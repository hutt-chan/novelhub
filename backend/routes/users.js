const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { connectDB } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const db = await connectDB();
        const [users] = await db.execute('SELECT username, email, created_at FROM Users WHERE id = ?', [req.user.id]);
        if (!users[0]) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
});

router.put('/profile', authenticateToken, async (req, res) => {
    const { username, password } = req.body;
    if (!username && !password) {
        return res.status(400).json({ error: 'Please provide a new username or password' });
    }

    try {
        const db = await connectDB();
        const updates = [];
        const values = [];

        if (username) {
            updates.push('username = ?');
            values.push(username);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        values.push(req.user.id);
        await db.execute(`UPDATE Users SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin người dùng:', error);
        res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
});

module.exports = router;