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
    const proof_files = req.files ? req.files.map(f => f.filename) : []; 

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
    res.json({ id: user.id, name: user.name, roles: user.roles, token });
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
  res.json({ message: `Giảng viên đã ${approve ? "duyệt" : "từ chối"}` });
});

app.put("/users/:id/lock", authMiddleware, async (req, res) => {
  if (req.user.roles !== "admin") return res.status(403).json({ message: "Forbidden" });
  const { lock } = req.body;
  await db.execute("UPDATE users SET is_locked=? WHERE id=?", [lock ? 1 : 0, req.params.id]);
  res.json({ message: `Tài khoản đã ${lock ? "khóa" : "mở khóa"}` });
});

app.put("/users/:id/reset-password", authMiddleware, async (req, res) => {
  if (req.user.roles !== "admin") return res.status(403).json({ message: "Forbidden" });
  const { newPassword } = req.body;
  const hashed = await bcrypt.hash(newPassword, 10);
  
  await db.execute(
    "UPDATE users SET password=?, last_password_reset=NOW() WHERE id=?",
    [hashed, req.params.id]
  );
  
  res.json({ message: "Đặt lại mật khẩu thành công" });
});

app.put("/users/:id", authMiddleware, upload.single("proof_file"), async (req, res) => {
  if (req.user.roles !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    const { name, email, roles, proof_info } = req.body;
    const proof_file = req.file ? req.file.filename : undefined;

    let query = "UPDATE users SET name=?, email=?, roles=?";
    const params = [name, email, roles];

    if (proof_info !== undefined) {
      query += ", proof_info=?";
      params.push(proof_info);
    }

    if (proof_file !== undefined) {
      query += ", proof_file=?";
      params.push(proof_file);
    }

    query += " WHERE id=?";
    params.push(req.params.id);

    await db.execute(query, params);
    res.json({ message: "Cập nhật thành công" });
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


app.get("/courses", authMiddleware, async (req, res) => {
  const [courses] = await db.execute(`
    SELECT c.*, u.name as teacher_name
    FROM courses c
    JOIN users u ON c.teacher_id = u.id
  `);
  res.json(courses);
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

app.get("/courses/:id/students", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;

    const [students] = await db.execute(
      `SELECT 
          u.id, 
          u.name, 
          u.email, 
          ce.enrolled_at
       FROM course_enrollments ce
       JOIN users u ON ce.student_id = u.id
       WHERE ce.course_id = ?`,
      [courseId]
    );

    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách học viên" });
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


app.listen(5000, () => console.log("Server đang chạy tại http://localhost:5000"));
