// routes/traffic.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // <-- Import kết nối CSDL từ db.js

// Endpoint để ghi lại lượt truy cập
router.post('/track-view', async (req, res) => {
    const { path } = req.body; // Đường dẫn trang được gửi từ frontend
    const timestamp = new Date(); // Lấy thời gian hiện tại
    const userAgent = req.headers['user-agent']; // Thông tin trình duyệt/OS
    const ipAddress = req.ip || req.connection.remoteAddress; // Địa chỉ IP người dùng

    if (!path) {
        return res.status(400).send('Path is required.');
    }

    try {
        // Thực hiện câu lệnh INSERT vào CSDL
        const [result] = await db.execute(
            `INSERT INTO page_views (timestamp, path, user_agent, ip_address) VALUES (?, ?, ?, ?)`,
            [timestamp, path, userAgent, ipAddress]
        );
        console.log(`A page view has been inserted. Inserted ID: ${result.insertId} for path: ${path}`);
        res.status(200).send('View tracked successfully!');
    } catch (error) {
        console.error("Error tracking page view:", error.message);
        res.status(500).send('Error tracking view.');
    }
});

// Tùy chọn: Endpoint để lấy dữ liệu lượt truy cập (để hiển thị biểu đồ)
router.get('/get-views', async (req, res) => {
    // Có thể thêm logic lọc theo thời gian (daily, weekly, monthly) ở đây
    // Dưới đây là ví dụ đơn giản lấy 100 lượt xem gần nhất
    try {
        const [rows] = await db.execute(
            `SELECT timestamp, path, COUNT(*) as view_count
             FROM page_views
             GROUP BY DATE(timestamp), path
             ORDER BY timestamp DESC
             LIMIT 100` // Lấy dữ liệu theo ngày và đường dẫn
        );
        res.json(rows);
    } catch (error) {
        console.error("Error fetching page views:", error.message);
        res.status(500).send('Error fetching views.');
    }
});

module.exports = router;