const express = require('express');
const { connectDB } = require('../config/db');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    const { novel_id, content, rating } = req.body;
    if (!novel_id || !content || !rating) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Đánh giá phải từ 1 đến 5' });
    }

    try {
        const db = await connectDB();
        await db.execute(
            'INSERT INTO Comments (novel_id, user_id, content, rating) VALUES (?, ?, ?, ?)',
            [novel_id, req.user.id, content, rating]
        );

        const [novelRatings] = await db.execute(
            'SELECT AVG(rating) as avg_rating FROM Comments WHERE novel_id = ?',
            [novel_id]
        );
        const avgRating = parseFloat(novelRatings[0].avg_rating) || 0;
        await db.execute('UPDATE Novels SET rating = ? WHERE id = ?', [avgRating.toFixed(1), novel_id]);

        res.status(201).json({ message: 'Thêm bình luận thành công' });
    } catch (error) {
        console.error('Lỗi khi thêm bình luận:', error);
        res.status(500).json({ error: 'Lỗi khi thêm bình luận' });
    }
});

router.delete('/:id', authenticateToken, restrictTo(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const db = await connectDB();
        const [comments] = await db.execute('SELECT novel_id FROM Comments WHERE id = ?', [id]);
        if (!comments[0]) {
            return res.status(404).json({ error: 'Bình luận không tồn tại' });
        }

        const novel_id = comments[0].novel_id;
        await db.execute('DELETE FROM Comments WHERE id = ?', [id]);

        const [novelRatings] = await db.execute(
            'SELECT AVG(rating) as avg_rating FROM Comments WHERE novel_id = ?',
            [novel_id]
        );
        const avgRating = parseFloat(novelRatings[0].avg_rating) || 0;
        await db.execute('UPDATE Novels SET rating = ? WHERE id = ?', [avgRating.toFixed(1), novel_id]);

        res.json({ message: 'Xóa bình luận thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa bình luận:', error);
        res.status(500).json({ error: 'Lỗi khi xóa bình luận' });
    }
});

module.exports = router;