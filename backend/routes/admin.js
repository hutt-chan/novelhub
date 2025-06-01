const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/db');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

// Lấy danh sách người dùng
router.get('/users', authenticateToken, restrictTo(['admin']), async (req, res) => {
    try {
        const db = await connectDB();
        const [users] = await db.execute('SELECT id, username, email, role, created_at FROM Users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng' });
    }
});

// Cập nhật vai trò người dùng
router.put('/users/:id', authenticateToken, restrictTo(['admin']), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Vai trò không hợp lệ' });
    }
    try {
        const db = await connectDB();
        if (role === 'admin') {
            const [adminCount] = await db.execute('SELECT COUNT(*) as count FROM Users WHERE role = ?', ['admin']);
            if (adminCount[0].count >= 3) {
                return res.status(403).json({ error: 'Đã đạt tối đa 3 tài khoản admin' });
            }
        }
        await db.execute('UPDATE Users SET role = ? WHERE id = ?', [role, id]);
        await logAction(req.user.id, `Thay đổi vai trò người dùng ID ${id} thành ${role}`);
        res.json({ message: 'Cập nhật vai trò thành công' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi cập nhật vai trò' });
    }
});

module.exports = router;