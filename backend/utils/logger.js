const { connectDB } = require('../config/db');

async function logAction(userId, action) {
    try {
        const db = await connectDB();
        await db.execute('INSERT INTO Logs (user_id, action) VALUES (?, ?)', [userId, action]);
    } catch (error) {
        console.error('Lỗi khi ghi log:', error);
    }
}

module.exports = { logAction };