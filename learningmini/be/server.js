require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });
const uploadFields = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "proof_file", maxCount: 10 },
]);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// MySQL connection pool
let db;
async function connectDB() {
  db = await mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: Number(process.env.MYSQLPORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  console.log("MySQL connected");
}

// Test DB
async function testDB() {
  try {
    const [rows] = await db.query("SELECT NOW() AS now");
    console.log("DB time:", rows[0].now);
  } catch (err) {
    console.error("DB test error:", err);
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
      const [admins] = await db.execute("SELECT id, name FROM users WHERE roles = 'admin'");
      for (const admin of admins) {
        await createNotification(
          admin.id,
          `Có giảng viên mới đăng ký: ${name} (${email}) cần duyệt`,
          "/admin/teachers-pending"
        );
      }
      
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
      language: user.language,
      phone: user.phone,
      address: user.address,
      birthdate: user.birthdate,
      gender: user.gender,
      name: user.name,
      email: user.email,
      theme: user.theme || 'light',
      roles: user.roles,
      proof_info: user.proof_info,
      proof_file: user.proof_file,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Routes
app.get("/", (req, res) => res.send("API is running"));

// Example: upload avatar
app.post("/upload", uploadFields, (req, res) => {
  res.json({ files: req.files });
});

// Example: send email
app.post("/send-email", async (req, res) => {
  const { to, subject, text } = req.body;
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
    res.json({ message: "Email sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
connectDB()
  .then(testDB)
  .then(() => {
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("Failed to start server:", err));
