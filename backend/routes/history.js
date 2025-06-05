const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/db');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

// Lưu lịch sử đọc (gọi khi user đọc chương)
router.post('/', authenticateToken, async (req, res) => {
    const { novel_id, chapter_id } = req.body;
    const user_id = req.user.id;
    try {
        const db = await connectDB();
        // Xóa bản ghi cũ nếu đã có (chỉ lưu lần đọc gần nhất)
        await db.execute(
            'DELETE FROM reading_history WHERE user_id = ? AND novel_id = ?',
            [user_id, novel_id]
        );
        await db.execute(
            'INSERT INTO reading_history (user_id, novel_id, chapter_id) VALUES (?, ?, ?)',
            [user_id, novel_id, chapter_id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lưu lịch sử đọc' });
    }
});

// Lấy lịch sử đọc của user
router.get('/', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    try {
        const db = await connectDB();
        const [rows] = await db.execute(`
            SELECT h.*, n.title as novelTitle, n.coverUrl, c.name as chapterTitle
            FROM reading_history h
            JOIN novels n ON h.novel_id = n.id
            JOIN chapters c ON h.chapter_id = c.id
            WHERE h.user_id = ?
            ORDER BY h.read_at DESC
        `, [user_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy lịch sử đọc' });
    }
});

module.exports = router;
