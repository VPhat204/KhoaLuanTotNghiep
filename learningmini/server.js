const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });
const uploadFields = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "proof_file", maxCount: 10 },
])
let db;
(async () => {
  db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "elearning_platform",
  });
  console.log("✅ MySQL connected");
})();

async function createNotification(userId, title, link = "") {
  try {
    await db.execute(
      "INSERT INTO notifications (user_id, title, link) VALUES (?, ?, ?)",
      [userId, title, link]
    );
  } catch (err) {
    console.error("Lỗi khi tạo thông báo:", err);
  }
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.post("/register", upload.array("proof_file"), async (req, res) => {
  try {
    const { name, email, password, roles, proof_info } = req.body;
    const proof_files = Array.isArray(req.files) ? req.files.map(f => f.filename) : [];

    const [exist] = await db.execute("SELECT * FROM users WHERE email=?", [email]);
    if (exist.length > 0) return res.status(400).json({ message: "Email đã tồn tại" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const isApproved = roles === "teacher" ? 0 : 1;

    await db.execute(
      "INSERT INTO users (name, email, password, roles, is_approved, proof_info, proof_file) VALUES (?,?,?,?,?,?,?)",
      [name, email, hashedPassword, roles, isApproved, proof_info || null, JSON.stringify(proof_files)]
    );

    if (roles === "teacher") {
      return res.json({ message: "Đăng ký giảng viên thành công. Chờ admin duyệt." });
    } else {
      return res.json({ message: "Đăng ký thành công" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute("SELECT * FROM users WHERE email=?", [email]);
    if (rows.length === 0) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

    if (user.roles === "teacher" && user.is_approved === 0) {
      return res.status(403).json({ message: "Tài khoản giảng viên đang chờ duyệt" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, roles: user.roles }, "secretkey", { expiresIn: "1d" });
    res.json({ 
      id: user.id, 
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      birthdate: user.birthdate,
      gender: user.gender,
      name: user.name, 
      email: user.email, 
      roles: user.roles, 
      proof_info: user.proof_info, 
      proof_file: user.proof_file, 
      token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.get("/users", authMiddleware, async (req, res) => {
  if (req.user.roles !== "admin") return res.status(403).json({ message: "Forbidden" });
  const [rows] = await db.execute(
    "SELECT id, name, email, roles, is_approved, is_locked, proof_info, proof_file, created_at FROM users"
  );
  res.json(rows);
});

app.put("/users/:id/approve-teacher", authMiddleware, async (req, res) => {
  if (req.user.roles !== "admin") return res.status(403).json({ message: "Forbidden" });
  const { approve } = req.body;
  await db.execute("UPDATE users SET is_approved=? WHERE id=?", [approve ? 1 : 0, req.params.id]);

  if (approve) {
    await createNotification(req.params.id, "Tài khoản giảng viên của bạn đã được duyệt!");
  } else {
    await createNotification(req.params.id, "Tài khoản giảng viên của bạn đã bị từ chối.");
  }

  res.json({ message: `Giảng viên đã ${approve ? "duyệt" : "từ chối"}` });
});

app.put("/users/:id/lock", authMiddleware, async (req, res) => {
  if (req.user.roles !== "admin") return res.status(403).json({ message: "Forbidden" });
  const { lock } = req.body;
  await db.execute("UPDATE users SET is_locked=? WHERE id=?", [lock ? 1 : 0, req.params.id]);
  res.json({ message: `Tài khoản đã ${lock ? "khóa" : "mở khóa"}` });
});

app.put("/users/:id", authMiddleware, uploadFields, async (req, res) => {
  if (req.user.id !== parseInt(req.params.id) && req.user.roles !== "admin") {
    return res.status(403).json({ message: "Không có quyền cập nhật hồ sơ này" });
  }

  try {
    const { name, email, roles, phone, gender, birthdate, address, proof_info } = req.body;

    const avatarFile = req.files["avatar"]?.[0];
    const proofFiles = req.files["proof_file"];

    let avatarPath = avatarFile ? `/uploads/${avatarFile.filename}` : undefined;
    let proofFilePaths = proofFiles ? proofFiles.map(f => `/uploads/${f.filename}`) : undefined;

    let query = "UPDATE users SET";
    let params = [];
    let updates = [];

    if (name) { updates.push(" name=? "); params.push(name); }
    if (email) { updates.push(" email=? "); params.push(email); }
    if (roles && req.user.roles === "admin") { updates.push(" roles=? "); params.push(roles); }
    if (phone !== undefined) { updates.push(" phone=? "); params.push(phone); }
    if (gender !== undefined) { updates.push(" gender=? "); params.push(gender); }
    if (birthdate !== undefined) { updates.push(" birthdate=? "); params.push(birthdate); }
    if (address !== undefined) { updates.push(" address=? "); params.push(address); }
    if (proof_info !== undefined) { updates.push(" proof_info=? "); params.push(proof_info); }
    if (avatarPath) { updates.push(" avatar=? "); params.push(avatarPath); }
    if (proofFilePaths) { updates.push(" proof_file=? "); params.push(JSON.stringify(proofFilePaths)); }

    if (updates.length === 0) {
      return res.json({ message: "Không có gì để cập nhật" });
    }

    query += updates.join(",") + " WHERE id=?";
    params.push(req.params.id);

    await db.execute(query, params);

    res.json({
      message: "Cập nhật thành công",
      avatar: avatarPath,
      proof_file: proofFilePaths
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật người dùng" });
  }
});

app.post("/users", authMiddleware, async (req, res) => {
  if (req.user.roles !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    const { name, email, password, roles } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await db.execute("INSERT INTO users (name, email, password, roles) VALUES (?, ?, ?, ?)", [name, email, hashed, roles]);
    res.json({ message: "Thêm người dùng thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm người dùng" });
  }
});

app.delete("/users/:id", authMiddleware, async (req, res) => {
  if (req.user.roles !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    await db.execute("DELETE FROM users WHERE id=?", [req.params.id]);
    res.json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa người dùng" });
  }
});

app.get("/courses", authMiddleware, async (req, res) => {
  try {
    let query = `
      SELECT c.*, u.name as teacher_name
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
    `;
    let params = [];

    if (req.user.roles === "teacher") {
      query += " WHERE c.teacher_id = ?";
      params.push(req.user.id);
    }

    const [courses] = await db.execute(query, params);
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy khóa học" });
  }
});

app.get("/users/:id/courses", authMiddleware, async (req, res) => {
  try {
    const studentId = req.params.id;

    const [courses] = await db.execute(
      `SELECT c.id, c.title, c.description, u.name AS teacher_name, ce.enrolled_at
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       JOIN users u ON c.teacher_id = u.id
       WHERE ce.student_id = ?`,
      [studentId]
    );

    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách khóa học của sinh viên" });
  }
});

app.post("/courses", authMiddleware, async (req, res) => {
  try {
    if (req.user.roles !== "teacher") {
      return res.status(403).json({ message: "Chỉ giảng viên mới được thêm khóa học." });
    }

    const { title, description, lessons, hours } = req.body;
    const teacherId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin khóa học." });
    }

    await db.execute(
      `INSERT INTO courses (title, description, teacher_id, lessons, hours, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, description, teacherId, lessons || 0, hours || 0]
    );

    res.json({ message: "Thêm khóa học thành công!" });
  } catch (err) {
    console.error("❌ Lỗi khi thêm khóa học:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

app.get("/courses/mine", authMiddleware, async (req, res) => {
  try {
    const teacherId = req.user.id; 
    const [courses] = await db.execute(
      "SELECT * FROM courses WHERE teacher_id = ?",
      [teacherId]
    );
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.post("/courses/:id/enroll", authMiddleware, async (req, res) => {
  if (req.user.roles !== "student")
    return res.status(403).json({ message: "Forbidden" });

  const courseId = req.params.id;
  await db.execute(
    "INSERT IGNORE INTO course_enrollments (course_id, student_id) VALUES (?,?)",
    [courseId, req.user.id]
  );
  res.json({ message: "Enrolled successfully" });
});

app.get("/courses/:id/isEnrolled", authMiddleware, async (req, res) => {
  const courseId = req.params.id;
  const studentId = req.query.studentId;

  const [rows] = await db.execute(
    "SELECT * FROM course_enrollments WHERE course_id = ? AND student_id = ?",
    [courseId, studentId]
  );

  res.json({ isEnrolled: rows.length > 0 });
});

app.delete("/courses/:id/unenroll", authMiddleware, async (req, res) => {
  const courseId = req.params.id;
  const studentId = req.user.id;

  await db.execute(
    "DELETE FROM course_enrollments WHERE course_id = ? AND student_id = ?",
    [courseId, studentId]
  );

  res.json({ message: "Unenrolled successfully" });
});

app.get("/courses/:id/progress", authMiddleware, async (req, res) => {
  const courseId = req.params.id;
  const [[{ progress }]] = await db.execute(`
    SELECT 
      IFNULL(
        ROUND(SUM(CASE WHEN asub.completed THEN 1 ELSE 0 END)/COUNT(asub.id)*100,0),
      0) AS progress
    FROM assignments a
    LEFT JOIN assignment_submissions asub 
      ON a.id = asub.assignment_id
      AND asub.student_id IN (SELECT student_id FROM course_enrollments WHERE course_id=?)
    WHERE a.course_id=?
  `, [courseId, courseId]);
  res.json({ progress });
});

app.get("/course-students", async (req, res) => {
  try {
    const courseId = req.query.courseId || 1; 
    const [students] = await db.execute(
      `SELECT u.id AS student_id, u.name AS student_name, u.email, u.phone, u.gender, ce.enrolled_at
       FROM course_enrollments ce
       JOIN users u ON ce.student_id = u.id
       WHERE ce.course_id = ?
       ORDER BY ce.enrolled_at`,
      [courseId]
    );

    if (students.length === 0) {
      return res.json({ message: "Chưa có học viên đăng ký khóa học này", students: [] });
    }

    res.json({ courseId, total: students.length, students });
  } catch (err) {
    console.error("Lỗi khi lấy học viên:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.get("/teachers-courses", async (req, res) => {
  try {
    const [teachers] = await db.execute(
      "SELECT id, name, email, gender, birthdate, phone, avatar FROM users WHERE roles='teacher' AND is_approved=1"
    );

    const teachersWithCourses = await Promise.all(
      teachers.map(async (t) => {
        const [courses] = await db.execute(
          "SELECT id, title, description FROM courses WHERE teacher_id = ?",
          [t.id]
        );
        return { ...t, courses };
      })
    );

    res.json(teachersWithCourses);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách giảng viên:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.get("/courses/:id/students-count", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total_students FROM course_enrollments WHERE course_id = ?",
      [req.params.id]
    );
    res.json({ total_students: rows[0].total_students });
  } catch (err) {
    console.error("Lỗi lấy số lượng học viên:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

app.post("/assignments", authMiddleware, async (req, res) => {
  try {
    if (req.user.roles !== "teacher") 
      return res.status(403).json({ message: "Chỉ giảng viên mới được tạo bài tập." });

    const { course_id, title, total_points } = req.body;
    await db.execute(
      "INSERT INTO assignments (course_id, title, total_points, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [course_id, title, total_points || 100]
    );
    res.json({ message: "Tạo bài tập thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi tạo bài tập" });
  }
});

app.get("/assignments/course/:courseId", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const [rows] = await db.execute(
      "SELECT * FROM assignments WHERE course_id = ? ORDER BY created_at DESC",
      [courseId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi lấy danh sách bài tập" });
  }
});

app.post("/assignments/submit", authMiddleware, async (req, res) => {
  try {
    if (req.user.roles !== "student") 
      return res.status(403).json({ message: "Chỉ sinh viên mới nộp bài." });

    const { assignment_id } = req.body;
    await db.execute(
      `INSERT INTO assignment_submissions (assignment_id, student_id, completed, submitted_at)
       VALUES (?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE completed=1, submitted_at=NOW()`,
      [assignment_id, req.user.id]
    );
    const [assignment] = await db.execute("SELECT course_id FROM assignments WHERE id=?", [assignment_id]);
    const [course] = await db.execute("SELECT teacher_id FROM courses WHERE id=?", [assignment[0].course_id]);
    await createNotification(course[0].teacher_id, `Sinh viên đã nộp bài tập #${assignment_id}`);
    res.json({ message: "Đã nộp bài" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi nộp bài" });
  }
});

app.get("/assignments/:assignmentId/submissions", authMiddleware, async (req, res) => {
  try {
    if (req.user.roles !== "teacher") 
      return res.status(403).json({ message: "Chỉ giảng viên mới xem danh sách bài nộp." });

    const { assignmentId } = req.params;
    const [rows] = await db.execute(
      `SELECT s.id AS submission_id, s.student_id, u.name AS student_name, s.completed, s.submitted_at, g.score
      FROM assignment_submissions s
      JOIN users u ON s.student_id = u.id
      LEFT JOIN grades g ON g.submission_id = s.id
      WHERE s.assignment_id = ?`,
      [assignmentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi lấy danh sách nộp" });
  }
});

app.post("/assignments/grade", authMiddleware, async (req, res) => {
  try {
    if (req.user.roles !== "teacher")
      return res.status(403).json({ message: "Chỉ giảng viên mới chấm điểm." });

    const { submission_id, score } = req.body;

    const [rows] = await db.execute(
      "SELECT user_id FROM assignment_submissions WHERE id = ?",
      [submission_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài nộp." });
    }

    const studentId = rows[0].user_id;

    await db.execute(
      "INSERT INTO grades (submission_id, score) VALUES (?, ?) ON DUPLICATE KEY UPDATE score=?",
      [submission_id, score, score]
    );

    await createNotification(
      studentId,
      `Bài tập của bạn đã được chấm điểm: ${score} điểm`
    );

    res.json({ message: "Đã chấm điểm" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi chấm điểm" });
  }
});


app.get("/assignments/:id/questions", authMiddleware, async (req, res) => {
  const assignmentId = req.params.id;
  try {
    const [questions] = await db.execute(
      "SELECT * FROM questions WHERE assignment_id = ?",
      [assignmentId]
    );
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy câu hỏi" });
  }
});

app.post("/assignments/:id/questions", authMiddleware, async (req, res) => {
  if (req.user.roles !== "teacher") 
    return res.status(403).json({ message: "Chỉ giảng viên mới thêm câu hỏi" });

  const assignmentId = req.params.id;
  const { question_text, points } = req.body;

  if (!question_text) return res.status(400).json({ message: "Câu hỏi không được để trống" });

  try {
    await db.execute(
      "INSERT INTO questions (assignment_id, question_text, points) VALUES (?, ?, ?)",
      [assignmentId, question_text, points || 1]
    );
    res.json({ message: "Thêm câu hỏi thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm câu hỏi" });
  }
});

app.post("/assignments/:id/submit-answers", authMiddleware, async (req, res) => {
  if (req.user.roles !== "student") return res.status(403).json({ message: "Chỉ sinh viên mới nộp bài" });
  const assignmentId = req.params.id;
  const studentId = req.user.id;
  const { answers } = req.body; 

  try {
    for (const [question_id, answer_text] of Object.entries(answers)) {
      await db.execute(
        `INSERT INTO answers (assignment_id, question_id, student_id, answer_text)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE answer_text=?`,
        [assignmentId, question_id, studentId, answer_text, answer_text]
      );
    }

    await db.execute(
      `INSERT INTO assignment_submissions (assignment_id, student_id, completed, submitted_at)
       VALUES (?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE completed=1, submitted_at=NOW()`,
      [assignmentId, studentId]
    );

    res.json({ message: "Nộp bài thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi nộp bài" });
  }
});

app.delete("/assignments/:assignmentId/questions/:questionId", async (req, res) => {
  const { assignmentId, questionId } = req.params;
  await db.execute("DELETE FROM questions WHERE id = ? AND assignment_id = ?", [
    questionId,
    assignmentId,
  ]);
  res.json({ message: "Đã xóa câu hỏi" });
});

app.delete("/assignments/:assignmentId/submissions/:studentId", async (req, res) => {
  const { assignmentId, studentId } = req.params;

  try {
     await db.execute(
      "DELETE FROM answers WHERE assignment_id = ? AND student_id = ?",
      [assignmentId, studentId]
    );

     const [result] = await db.execute(
      "DELETE FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?",
      [assignmentId, studentId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Không tìm thấy bài nộp để xóa" });

    res.json({ message: "Đã xóa toàn bộ bài nộp của học viên" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa bài nộp" });
  }
});

app.delete("/assignments/:assignmentId/answers/:studentId/:questionId", async (req, res) => {
  const { assignmentId, studentId, questionId } = req.params;

  try {
    const [result] = await db.execute(
      `DELETE FROM answers
       WHERE assignment_id = ? AND question_id = ? AND student_id = ?`,
      [assignmentId, questionId, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy câu trả lời để xóa" });
    }

    res.json({ message: "Đã xóa câu trả lời thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi xóa câu trả lời" });
  }
});

app.post("/assignments/:assignmentId/grade-answers-bulk", authMiddleware, async (req, res) => {
  try {
    if (req.user.roles !== "teacher") 
      return res.status(403).json({ message: "Chỉ giảng viên mới chấm điểm." });

    const { grades } = req.body;  
    if (!grades || !grades.length) 
      return res.status(400).json({ message: "Không có điểm hợp lệ để lưu." });

    for (const g of grades) {
      await db.execute(
        `INSERT INTO grades (submission_id, question_id, score) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score)`,
        [g.submission_id, g.question_id, g.score]
      );
      await createNotification(
        g.student_id, 
        `Bài tập #${g.submission_id} đã được chấm: ${g.score} điểm`
      );
    }

     const submissionIds = [...new Set(grades.map(g => g.submission_id))];
    const totalScores = {};
    for (const subId of submissionIds) {
      const [rows] = await db.execute(
        `SELECT SUM(score) AS total FROM grades WHERE submission_id = ?`,
        [subId]
      );
      totalScores[subId] = rows[0].total || 0;
    }

     return res.json({ message: "Đã chấm điểm thành công!", totalScores });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi gửi điểm!" });
  }
});


app.get("/assignments/:id/answers/student/:studentId", authMiddleware, async (req, res) => {
  const assignmentId = req.params.id;
  const studentId = req.params.studentId;

  try {
    const [answers] = await db.execute(`
  SELECT 
    a.id AS answer_id, 
    a.question_id, 
    a.answer_text, 
    g.score
  FROM answers a
  LEFT JOIN assignment_submissions s
    ON s.assignment_id = a.assignment_id AND s.student_id = a.student_id
  LEFT JOIN grades g 
    ON g.submission_id = s.id AND g.question_id = a.question_id
  WHERE a.assignment_id = ? AND a.student_id = ?
`, [assignmentId, studentId]
);
    res.json(answers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy câu trả lời", error: err });
  }
});

app.get("/assignments/course/:courseId/student/:studentId", authMiddleware, async (req, res) => {
  const { courseId, studentId } = req.params;
  const [rows] = await db.execute(
    `SELECT a.*, s.completed, s.submitted_at, g.score
     FROM assignments a
     LEFT JOIN assignment_submissions s 
       ON a.id = s.assignment_id AND s.student_id=?
     LEFT JOIN grades g 
       ON s.id = g.submission_id
     WHERE a.course_id=?`,
    [studentId, courseId]
  );
  res.json(rows);
});

app.get("/api/schedule/week", authMiddleware, async (req, res) => {
  const { date } = req.query;
  try {
    const inputDate = new Date(date);
    const startOfWeek = new Date(inputDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);
      dates.push(currentDate.toISOString().split('T')[0]);
    }

    const [rows] = await db.execute(
      `SELECT s.*, c.title, c.teacher_id, c.lessons, c.color, u.name as teacher_name
       FROM schedule s 
       LEFT JOIN courses c ON s.course_id = c.id 
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE s.date BETWEEN ? AND ?
       ORDER BY s.date, s.period, s.order_index`,
      [dates[0], dates[6]]
    );

    const scheduleData = { 
      Sáng: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }]),
      Chiều: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }]), 
      Tối: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }])
    };

    rows.forEach(r => {
      const scheduleDate = new Date(r.date);
      scheduleDate.setHours(0, 0, 0, 0);
      const normalizedDate = scheduleDate.toISOString().split('T')[0];
      
      const dayIndex = dates.findIndex(d => d === normalizedDate);
      
      if (dayIndex !== -1 && r.period in scheduleData) {
        const orderIndex = parseInt(r.order_index) || 0;
        if (orderIndex >= 0 && orderIndex < 2) {          
          scheduleData[r.period][dayIndex][orderIndex] = {
            type: r.type || 'theory',
            title: r.title || `Khóa học ${r.course_id}`,
            teacher: r.teacher_name || `Giáo viên ${r.teacher_id}`,
            lesson: r.lesson || `Tiết ${r.lessons || 1}`,
            schedule_id: r.id,
            course_id: r.course_id,
            teacher_id: r.teacher_id,
            url: r.url || '',
            date: normalizedDate, 
            period: r.period,
            order_index: orderIndex,
            color: r.color || '#9E9E9E'
          };
        }
      }
    });

    res.json(scheduleData);

  } catch (err) {
    console.error("Error in /api/schedule/week:", err);
    res.status(500).json({ message: "Lỗi lấy lịch tuần", error: err.message });
  }
});

app.post("/api/schedule/assign", async (req, res) => {
  const { course_id, date, period, lesson, type, order_index = 0 } = req.body;
  
  try {
    const [course] = await db.execute(
      `SELECT c.*, u.name as teacher_name 
       FROM courses c 
       LEFT JOIN users u ON c.teacher_id = u.id 
       WHERE c.id=?`, 
      [course_id]
    );
    
    if (!course.length) return res.status(404).json({ message: "Khóa học không tồn tại" });

    const inputDate = new Date(date);
    const localDate = new Date(inputDate.getTime() - (inputDate.getTimezoneOffset() * 60000));
    const formattedDate = localDate.toISOString().split('T')[0];

    const [existingSchedules] = await db.execute(
      "SELECT COUNT(*) as count FROM schedule WHERE date = ? AND period = ? AND order_index = ?",
      [formattedDate, period, order_index]
    );

    if (existingSchedules[0].count >= 1) {
      return res.status(400).json({ message: "Slot này đã có môn học. Vui lòng chọn slot khác." });
    }

    const [result] = await db.execute(
      "INSERT INTO schedule (course_id, teacher_id, url, date, period, lesson, type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        course_id, 
        course[0].teacher_id, 
        '', 
        formattedDate, 
        period, 
        lesson || `Tiết ${course[0].lessons || 1}`, 
        type || 'theory', 
        order_index
      ]
    );
    
    const [newSchedule] = await db.execute(
      `SELECT s.*, c.title, c.teacher_id, c.color, c.lessons, u.name as teacher_name
       FROM schedule s 
       LEFT JOIN courses c ON s.course_id = c.id 
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE s.id=?`, 
      [result.insertId]
    );
    
    res.status(201).json(newSchedule[0]);
    
  } catch (err) {
    console.error("Error assigning course:", err);
    res.status(500).json({ message: "Lỗi gán khóa học", error: err.message });
  }
});

app.get("/api/schedules/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [schedule] = await db.execute(
      `SELECT s.*, c.title, c.teacher_id, c.color, c.lessons, u.name as teacher_name
       FROM schedule s 
       LEFT JOIN courses c ON s.course_id = c.id 
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE s.id = ?`, 
      [id]
    );
    
    if (schedule.length === 0) {
      return res.status(404).json({ message: "Lịch học không tồn tại" });
    }
    
    res.json(schedule[0]);
  } catch (err) {
    console.error("Error fetching schedule:", err);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin lịch học", error: err.message });
  }
});

app.put("/api/schedules/:id", async (req, res) => {
  const { id } = req.params;
  const { url, lesson, type } = req.body;
  
  try {
    const [result] = await db.execute(
      "UPDATE schedule SET url = ?, lesson = ?, type = ? WHERE id = ?",
      [url || '', lesson, type, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    
    const [updated] = await db.execute(
      `SELECT s.*, c.title, c.teacher_id, c.color, c.lessons, u.name as teacher_name
       FROM schedule s 
       LEFT JOIN courses c ON s.course_id = c.id 
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE s.id = ?`, 
      [id]
    );
    
    if (updated.length === 0) {
      return res.status(404).json({ error: "Updated schedule not found" });
    }
    
    res.json(updated[0]);
    
  } catch (err) {
    console.error("Error updating schedule:", err);
    res.status(500).json({ 
      message: "Lỗi cập nhật lịch", 
      error: err.message,
      sqlMessage: err.sqlMessage 
    });
  }
});

app.post("/api/schedules", async (req, res) => {
  const { course_id, teacher_id, url, date, period, lesson, type } = req.body;
  
  try {
    const formattedDate = new Date(date).toISOString().split('T')[0];

    const [result] = await db.execute(
      "INSERT INTO schedule (course_id, teacher_id, url, date, period, lesson, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [course_id, teacher_id, url || '', formattedDate, period, lesson, type]
    );
    
    const [newSchedule] = await db.execute(
      `SELECT s.*, c.title, c.teacher_id, c.color, c.lessons, u.name as teacher_name
       FROM schedule s 
       LEFT JOIN courses c ON s.course_id = c.id 
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE s.id=?`, 
      [result.insertId]
    );
    
    res.status(201).json(newSchedule[0]);
  } catch (err) {
    console.error("Error creating schedule:", err);
    res.status(500).json({ message: "Lỗi tạo lịch", error: err.message });
  }
});

app.delete("/api/schedules/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [result] = await db.execute("DELETE FROM schedule WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    
    res.json({ message: "Đã xóa lịch thành công" });
  } catch (err) {
    console.error("Error deleting schedule:", err);
    res.status(500).json({ message: "Lỗi xóa lịch", error: err.message });
  }
});

app.post("/videos/add", authMiddleware, async (req, res) => {
  const { course_id, title, url, duration } = req.body;
  const userId = req.user.id;

  const [user] = await db.query("SELECT roles FROM users WHERE id = ?", [userId]);
  if (user[0].roles !== "teacher") return res.status(403).json({ message: "Chỉ giảng viên được thêm video." });

  await db.query("INSERT INTO videos (course_id, title, url, duration) VALUES (?, ?, ?, ?)", [
    course_id,
    title,
    url,
    duration,
  ]);

  const [students] = await db.execute("SELECT student_id FROM course_enrollments WHERE course_id=?", [course_id]);
  for (const s of students) {
    await createNotification(s.student_id, `Khóa học của bạn có video mới: ${title}`);
  }

  res.json({ message: "Thêm video thành công" });
});

app.get("/videos/:course_id", async (req, res) => {
  const { course_id } = req.params;
  const [videos] = await db.query("SELECT * FROM videos WHERE course_id = ?", [course_id]);
  res.json(videos);
});

app.post("/comments/add", authMiddleware, async (req, res) => {
  const { course_id, content } = req.body;
  const userId = req.user.id;
  await db.query("INSERT INTO comments (course_id, user_id, content) VALUES (?, ?, ?)", [
    course_id,
    userId,
    content,
  ]);

  const [students] = await db.execute(
    "SELECT student_id FROM course_enrollments WHERE course_id=? AND student_id != ?",
    [course_id, userId]
  );
  for (const s of students) {
    await createNotification(s.student_id, `Có bình luận mới trong khóa học của bạn`);
  }

  res.json({ message: "Đã đăng bình luận" });
});

app.get("/comments/:course_id", async (req, res) => {
  try {
    const { course_id } = req.params;
    const [results] = await db.execute(
      `SELECT c.id, c.content, c.created_at, u.name AS user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.course_id = ?
       ORDER BY c.created_at DESC`,
      [course_id]
    );
    res.json(results);
  } catch (err) {
    console.error("Lỗi lấy bình luận:", err);
    res.status(500).json({ message: "Lỗi khi lấy bình luận" });
  }
});

app.get("/notifications/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (parseInt(userId) !== req.user.id && req.user.roles !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const [rows] = await db.execute(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thông báo" });
  }
});

app.put("/notifications/:id/read", authMiddleware, async (req, res) => {
  const notifId = req.params.id;
  try {
    await db.execute("UPDATE notifications SET is_read=1 WHERE id=?", [notifId]);
    res.json({ message: "Đã đánh dấu đã đọc" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi đánh dấu thông báo" });
  }
});

app.listen(5000, () => console.log("Server đang chạy tại http://localhost:5000"));
