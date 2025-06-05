const express = require('express');
const { connectDB } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET /api/comments/:novel_id - Lấy danh sách bình luận
router.get('/:novel_id', async (req, res) => {
    let { novel_id } = req.params;
    
    console.log(`[${new Date().toISOString()}] GET comments for novel_id: ${novel_id}`);
    
    novel_id = parseInt(novel_id);
    if (isNaN(novel_id)) {
        console.log(`[${new Date().toISOString()}] Invalid novel_id: ${novel_id}`);
        return res.status(400).json({ error: 'novel_id không hợp lệ' });
    }

    try {
        const db = await connectDB();
        const [comments] = await db.execute(
            `SELECT c.id, c.novel_id, c.user_id, u.username, c.content, c.rating, c.created_at
             FROM Comments c
             JOIN Users u ON c.user_id = u.id
             WHERE c.novel_id = ?
             ORDER BY c.created_at DESC`,
            [novel_id]
        );
        
        console.log(`[${new Date().toISOString()}] Comments for novel_id ${novel_id}:`, comments);
        res.json({ comments });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Lỗi khi lấy bình luận:`, error);
        res.status(500).json({ error: 'Lỗi khi lấy bình luận', details: error.message });
    }
});

// POST /api/comments/:novel_id - Gửi bình luận mới
router.post('/:novel_id', authenticateToken, async (req, res) => {
    let { novel_id } = req.params;
    const { content, rating } = req.body;
    const user_id = req.user.id;
    
    console.log(`[${new Date().toISOString()}] POST comment for novel_id: ${novel_id}, user_id: ${user_id}, content: ${content}, rating: ${rating}`);

    novel_id = parseInt(novel_id);
    if (isNaN(novel_id)) {
        console.log(`[${new Date().toISOString()}] Invalid novel_id: ${novel_id}`);
        return res.status(400).json({ error: 'novel_id không hợp lệ' });
    }
    
    if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Nội dung bình luận không được để trống' });
    }

    if (!user_id) {
        console.log(`[${new Date().toISOString()}] Missing user_id`);
        return res.status(400).json({ error: 'user_id không hợp lệ' });
    }

    // Kiểm tra rating
    const ratingValue = parseInt(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        console.log(`[${new Date().toISOString()}] Invalid rating: ${rating}`);
        return res.status(400).json({ error: 'Rating phải từ 1 đến 5' });
    }

    try {
        const db = await connectDB();
        
        // Thêm bình luận mới
        await db.execute(
            'INSERT INTO Comments (novel_id, user_id, content, rating, created_at) VALUES (?, ?, ?, ?, NOW())',
            [novel_id, user_id, content.trim(), ratingValue]
        );
        
        // Cập nhật rating trung bình trong bảng novels
        const [avgRatingResult] = await db.execute(
            'SELECT AVG(rating) as avg_rating FROM Comments WHERE novel_id = ?',
            [novel_id]
        );
        const avgRating = avgRatingResult[0].avg_rating || 0;
        
        await db.execute(
            'UPDATE novels SET rating = ? WHERE id = ?',
            [parseFloat(avgRating).toFixed(1), novel_id]
        );

        console.log(`[${new Date().toISOString()}] Comment added for novel_id ${novel_id}, updated avg rating: ${avgRating}`);
        res.status(201).json({ message: 'Bình luận và đánh giá đã được gửi' });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Lỗi khi gửi bình luận:`, error);
        res.status(500).json({ error: 'Lỗi khi gửi bình luận', details: error.message });
    }
});

module.exports = router;