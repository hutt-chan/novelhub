const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const { authenticateToken, restrictTo } = require("../middleware/auth");
const { logAction } = require("../utils/logger");

// Thêm favorite
router.post(
  "/",
  authenticateToken,
  restrictTo(["user", "admin"]),
  async (req, res) => {
    const userId = req.user.id;
    const { novel_id } = req.body;
    if (!novel_id) return res.status(400).json({ message: "Missing novel_id" });
    try {
      const db = await connectDB();
      await db.execute(
        "INSERT IGNORE INTO favorites (user_id, novel_id) VALUES (?, ?)",
        [userId, novel_id]
      );
      res.json({ message: "Favorited!" });
    } catch (err) {
      res.status(500).json({ message: "Error favoriting novel" });
    }
  }
);

// Xóa favorite
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
        "DELETE FROM favorites WHERE user_id = ? AND novel_id = ?",
        [userId, novel_id]
      );
      res.json({ message: "Favorite removed" });
    } catch (err) {
      res.status(500).json({ message: "Error removing favorite" });
    }
  }
);

// Lấy danh sách favorite
router.get(
  "/",
  authenticateToken,
  restrictTo(["user", "admin"]),
  async (req, res) => {
    const userId = req.user.id;
    try {
      const db = await connectDB();
      const [rows] = await db.execute(
        `SELECT f.novel_id, n.title as novelTitle, n.coverUrl as coverUrl
       FROM favorites f
       JOIN novels n ON f.novel_id = n.id
       WHERE f.user_id = ?`,
        [userId]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Error fetching favorites" });
    }
  }
);

module.exports = router;