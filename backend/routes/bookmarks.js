const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const { authenticateToken, restrictTo } = require("../middleware/auth");
const { logAction } = require("../utils/logger");

// Thêm bookmark
router.post(
  "/",
  authenticateToken,
  restrictTo(["user", "admin"]),
  async (req, res) => {
    const userId = req.user.id;
    const { novel_id } = req.body;
    if (!novel_id) {
      return res.status(400).json({ message: "Missing novel_id" });
    }
    try {
      const db = await connectDB();
      await db.execute(
        "INSERT IGNORE INTO bookmarks (user_id, novel_id) VALUES (?, ?)",
        [userId, novel_id]
      );
      res.json({ message: "Bookmarked!" });
    } catch (err) {
      res.status(500).json({ message: "Error bookmarking novel" });
    }
  }
);

// Xóa bookmark
router.delete(
  "/:novel_id",
  authenticateToken,
  restrictTo(["user", "admin"]),
  async (req, res) => {
    const userId = req.user.id;
    const { novel_id } = req.params;
    try {
      const db = await connectDB();
      await db.execute(
        "DELETE FROM bookmarks WHERE user_id = ? AND novel_id = ?",
        [userId, novel_id]
      );
      res.json({ message: "Bookmark removed" });
    } catch (err) {
      res.status(500).json({ message: "Error removing bookmark" });
    }
  }
);

// Lấy danh sách bookmark
router.get(
  "/",
  authenticateToken,
  restrictTo(["user", "admin"]),
  async (req, res) => {
    const userId = req.user.id;
    try {
      const db = await connectDB();
      const [rows] = await db.execute(
        `SELECT b.novel_id, n.title as novelTitle, n.coverUrl as coverUrl
         FROM bookmarks b
         JOIN novels n ON b.novel_id = n.id
         WHERE b.user_id = ?`,
        [userId]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Error fetching bookmarks" });
    }
  }
);

// Lấy danh sách thông báo
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const db = await connectDB();
  const [rows] = await db.execute(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    [userId]
  );
  res.json(rows);
});

module.exports = router;