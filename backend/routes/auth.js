const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;

// Đăng nhập
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    try {
        // Kết nối database
        const db = await connectDB();
        console.log(`Trying to find user with email: ${email}`);

        // Truy vấn user
        const [rows] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        console.log(`Query result: ${JSON.stringify(rows)}`);
        const user = rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Email không tồn tại' });
        }

        // So sánh mật khẩu
        console.log('Comparing passwords...');
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Mật khẩu không đúng' });
        }

        // Tạo token
        console.log('User data before signing token:', { id: user.id, username: user.username, email: user.email, role: user.role });
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET không được định nghĩa');
        }
        const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Token created:', token);

        // Trả về kết quả
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
});


router.get('/user', authenticateToken, async (req, res) => {
    res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
    res.json({ message: 'Đăng xuất thành công' });
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    try {
        const db = await connectDB();
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, 'user']
        );
        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username hoặc email đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server: ' + error.message });
        }
    }
});

module.exports = router;