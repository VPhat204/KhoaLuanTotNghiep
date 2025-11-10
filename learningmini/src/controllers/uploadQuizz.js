import db from "../models/db.js"; 
export const uploadQuizFile = async (req, res) => {
  try {
    const { quizId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Không có file được upload" });
    }

    await db.query("UPDATE quizzes SET description = ? WHERE id = ?", [
      file.filename,
      quizId,
    ]);

    res.json({ success: true, message: "Upload quiz thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi upload quiz" });
  }
};
