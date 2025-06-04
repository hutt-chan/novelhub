require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const novelsRoutes = require('./routes/novels');
const bookmarksRoutes = require('./routes/bookmarks');
const chaptersRoutes = require('./routes/chapters');
const favoritesRoutes = require('./routes/favorites');
const adminRoutes = require('./routes/admin');
const commentsRoutes = require('./routes/comments');
const usersRouter = require('./routes/users');
// const historyRouter = require('./routes/history'); 

const app = express();
app.use(express.json());
app.use(cors());


app.use('/api/novels', novelsRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/chapters', chaptersRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/users', usersRouter);

app.use('/api', authRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Route không tồn tại' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
});

// app.use('/api/history', historyRouter);
async function searchNovels(query) {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch(`http://localhost:3000/api/novels?search=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        const results = await response.json();
        return results.slice(0, 7);
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

app.listen(3000, () => {
    console.log('Server chạy tại http://localhost:3000');
});
