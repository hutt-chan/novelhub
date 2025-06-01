const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/db');
const { authenticateToken, restrictTo } = require('../middleware/auth');

// Thêm bookmark
router.post('/', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    const { novel_id } = req.body;
    if (!novel_id) {
        return res.status(400).json({ error: 'Vui lòng cung cấp novel_id' });
    }
    try {
        const db = await connectDB();
        await db.execute('INSERT INTO Bookmarks (user_id, novel_id) VALUES (?, ?)', [req.user.id, novel_id]);
        res.status(201).json({ message: 'Thêm bookmark thành công' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Bookmark đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi khi thêm bookmark' });
        }
    }
});

// Xóa bookmark
router.delete('/:novel_id', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    const { novel_id } = req.params;
    try {
        const db = await connectDB();
        await db.execute('DELETE FROM Bookmarks WHERE user_id = ? AND novel_id = ?', [req.user.id, novel_id]);
        res.json({ message: 'Xóa bookmark thành công' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi xóa bookmark' });
    }
});

// Lấy danh sách bookmark
router.get('/', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    try {
        const db = await connectDB();
        const [bookmarks] = await db.execute(`
            SELECT n.id, n.title, n.author, n.views, n.rating, n.coverUrl, n.description, n.chapterCount,
                   EXISTS(SELECT 1 FROM Favorites f WHERE f.novel_id = n.id AND f.user_id = ?) AS is_favorited,
                   COUNT(DISTINCT f.id) AS favorite_count
            FROM Bookmarks b
            JOIN Novels n ON b.novel_id = n.id
            LEFT JOIN Favorites f ON n.id = f.novel_id
            WHERE b.user_id = ?
            GROUP BY n.id
        `, [req.user.id, req.user.id]);
        res.json(bookmarks.map(b => ({
            ...b,
            is_favorited: !!b.is_favorited,
            favorite_count: parseInt(b.favorite_count) || 0
        })));
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách bookmark' });
    }
});

module.exports = router;