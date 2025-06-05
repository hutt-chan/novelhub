const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Lấy danh sách thông báo mới nhất của user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const db = await connectDB();
    const [rows] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});





module.exports = router; 