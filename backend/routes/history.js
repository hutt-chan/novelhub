// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db'); // Giả định bạn có file db.js để kết nối MySQL
const authMiddleware = require('../middleware/auth'); // Giả định middleware xác thực token

// Middleware để lấy user_id từ token
router.use(authMiddleware);

// GET /api/history - Lấy danh sách lịch sử đọc của người dùng
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id; // Lấy user_id từ token qua middleware
        const [rows] = await db.query(
            'SELECT h.id, h.novel_id, n.title AS novel_title, h.chapter_id, c.title AS chapter_title, h.progress, h.created_at, h.updated_at ' +
            'FROM history h ' +
            'JOIN novels n ON h.novel_id = n.id ' +
            'JOIN chapters c ON h.chapter_id = c.id ' +
            'WHERE h.user_id = ? ORDER BY h.updated_at DESC',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/history/:id - Lấy chi tiết một mục lịch sử
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT h.id, h.novel_id, n.title AS novel_title, h.chapter_id, c.title AS chapter_title, h.progress, h.created_at, h.updated_at ' +
            'FROM history h ' +
            'JOIN novels n ON h.novel_id = n.id ' +
            'JOIN chapters c ON h.chapter_id = c.id ' +
            'WHERE h.id = ? AND h.user_id = ?',
            [id, userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'History entry not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching history entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/history - Thêm một mục lịch sử mới
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { novel_id, chapter_id, progress = 0.0 } = req.body;

        // Validate input
        if (!novel_id || !chapter_id) {
            return res.status(400).json({ error: 'novel_id and chapter_id are required' });
        }
        if (progress < 0.0 || progress > 100.0) {
            return res.status(400).json({ error: 'Progress must be between 0.0 and 100.0' });
        }

        // Kiểm tra xem bản ghi đã tồn tại chưa
        const [existing] = await db.query(
            'SELECT id FROM history WHERE user_id = ? AND novel_id = ? AND chapter_id = ?',
            [userId, novel_id, chapter_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'History entry already exists' });
        }

        const [result] = await db.query(
            'INSERT INTO history (user_id, novel_id, chapter_id, progress) VALUES (?, ?, ?, ?)',
            [userId, novel_id, chapter_id, progress]
        );
        res.status(201).json({ id: result.insertId, message: 'History entry created' });
    } catch (error) {
        console.error('Error creating history entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/history/:id - Cập nhật tiến độ đọc
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { progress } = req.body;

        // Validate input
        if (progress === undefined) {
            return res.status(400).json({ error: 'Progress is required' });
        }
        if (progress < 0.0 || progress > 100.0) {
            return res.status(400).json({ error: 'Progress must be between 0.0 and 100.0' });
        }

        const [result] = await db.query(
            'UPDATE history SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            [progress, id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'History entry not found or unauthorized' });
        }
        res.json({ message: 'Progress updated successfully' });
    } catch (error) {
        console.error('Error updating history entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/history/:id - Xóa một mục lịch sử
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM history WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'History entry not found or unauthorized' });
        }
        res.json({ message: 'History entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting history entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;