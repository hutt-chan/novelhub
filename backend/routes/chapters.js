const express = require('express');
const { connectDB } = require('../config/db');
const router = express.Router();

//Lấy nội dung chương cụ thể
router.get('/:novel_id/:chapter_id', async (req, res) => {
    const { novel_id, chapter_id } = req.params;

    try {
        const db = await connectDB();
        // Lấy chương hiện tại
        const [chapters] = await db.execute(
            'SELECT id, novel_id, name, content, date FROM Chapters WHERE novel_id = ? AND id = ?',
            [novel_id, chapter_id]
        );
        if (!chapters[0]) {
            return res.status(404).json({ error: 'Chương không tồn tại' });
        }

        // Lấy danh sách chương để tìm chương trước và sau
        const [allChapters] = await db.execute(
            'SELECT id FROM Chapters WHERE novel_id = ? ORDER BY id ASC',
            [novel_id]
        );
        const chapterIds = allChapters.map(ch => ch.id);
        const currentIndex = chapterIds.indexOf(parseInt(chapter_id));

        // Xác định chương trước và chương sau
        const prevChapterId = currentIndex > 0 ? chapterIds[currentIndex - 1] : null;
        const nextChapterId = currentIndex < chapterIds.length - 1 ? chapterIds[currentIndex + 1] : null;

        res.json({
            chapter: chapters[0],
            prevChapterId,
            nextChapterId
        });
    } catch (error) {
        console.error('Lỗi khi lấy chương:', error);
        res.status(500).json({ error: 'Lỗi khi lấy chương' });
    }
});

//Lấy danh sách chương
router.get('/:novel_id/chapters', async (req, res) => {
    let { novel_id } = req.params;
    console.log(`[${new Date().toISOString()}] Received novel_id: ${novel_id}, type: ${typeof novel_id}`);
    
    novel_id = parseInt(novel_id);
    if (isNaN(novel_id)) {
        console.log(`[${new Date().toISOString()}] Invalid novel_id: ${novel_id}`);
        return res.status(400).json({ error: 'novel_id không hợp lệ' });
    }

    try {
        const db = await connectDB();
        const [chapters] = await db.execute(
            'SELECT id, novel_id, name, date FROM Chapters WHERE novel_id = ? ORDER BY id ASC',
            [novel_id]
        );
        console.log(`[${new Date().toISOString()}] Chapter list for novel_id ${novel_id}:`, chapters);
        res.json(chapters);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Lỗi khi lấy danh sách chương:`, error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách chương', details: error.message });
    }
});

module.exports = router;