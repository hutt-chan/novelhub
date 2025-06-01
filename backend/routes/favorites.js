const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/db');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

// Thêm yêu thích
router.post('/', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    const { novel_id } = req.body;
    if (!novel_id) {
        return res.status(400).json({ error: 'Vui lòng cung cấp novel_id' });
    }
    try {
        const db = await connectDB();
        const [novels] = await db.execute('SELECT title FROM Novels WHERE id = ?', [novel_id]);
        if (!novels[0]) {
            return res.status(404).json({ error: 'Tiểu thuyết không tồn tại' });
        }
        const novelTitle = novels[0].title;
        await db.execute('INSERT INTO Favorites (user_id, novel_id) VALUES (?, ?)', [req.user.id, novel_id]);
        console.log(`User ${req.user.id} added favorite: ${novel_id} (${novelTitle})`);
        // await logAction(req.user.id, `Thêm yêu thích: ${novelTitle}`);
        res.status(201).json({ message: 'Thêm yêu thích thành công' });
    } catch (error) {
        console.error('Lỗi khi thêm yêu thích:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Tiểu thuyết đã có trong danh sách yêu thích' });
        } else {
            res.status(500).json({ error: 'Lỗi server: ' + error.message });
        }
    }
});

// Xóa yêu thích
router.delete('/:novel_id', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    const { novel_id } = req.params;
    try {
        const db = await connectDB();
        const [result] = await db.execute('DELETE FROM Favorites WHERE user_id = ? AND novel_id = ?', [req.user.id, novel_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tiểu thuyết không có trong danh sách yêu thích' });
        }
        await logAction(req.user.id, `Xóa yêu thích: novel_id ${novel_id}`);
        res.json({ message: 'Xóa yêu thích thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa yêu thích:', error);
        res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
});

// Lấy danh sách yêu thích
router.get('/', authenticateToken, async (req, res) => {
    try {
        const db = await connectDB();
        const [favorites] = await db.query(`
            SELECT n.id, n.title, n.author, n.views, n.coverUrl, n.description, n.chapterCount, n.updated_at,
                   GROUP_CONCAT(g.name) AS genres,
                   COUNT(DISTINCT f2.user_id) AS favorite_count,
                   EXISTS(SELECT 1 FROM Bookmarks b WHERE b.novel_id = n.id AND b.user_id = ?) AS is_bookmarked,
                   EXISTS(SELECT 1 FROM Favorites f WHERE f.novel_id = n.id AND f.user_id = ?) AS is_favorited
            FROM Favorites f
            JOIN Novels n ON f.novel_id = n.id
            LEFT JOIN NovelGenres ng ON n.id = ng.novel_id
            LEFT JOIN Genres g ON ng.genre_id = g.id
            LEFT JOIN Favorites f2 ON n.id = f2.novel_id
            WHERE f.user_id = ?
            GROUP BY n.id
        `, [req.user.id, req.user.id, req.user.id]);
        res.json(favorites.map(f => ({
            ...f,
            genres: f.genres ? f.genres.split(',') : [],
            favorite_count: parseInt(f.favorite_count) || 0,
            is_bookmarked: !!f.is_bookmarked,
            is_favorited: !!f.is_favorited
        })));
    } catch (error) {
        console.error('Lỗi khi lấy danh sách yêu thích:', error);
        res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
});

module.exports = router;