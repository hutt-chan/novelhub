require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

const JWT_SECRET = process.env.JWT_SECRET;

async function connectDB() {
    return await mysql.createConnection(dbConfig);
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token không hợp lệ' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token không hợp lệ' });
        req.user = user;
        next();
    });
}

function restrictTo(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }
        next();
    };
}

async function logAction(userId, action) {
    try {
        const db = await connectDB();
        await db.execute('INSERT INTO Logs (user_id, action) VALUES (?, ?)', [userId, action]);
    } catch (error) {
        console.error('Lỗi khi ghi log:', error);
    }
}

app.post('/api/register', async (req, res) => {
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
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    try {
        const db = await connectDB();
        const [rows] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

app.get('/api/user', authenticateToken, async (req, res) => {
    res.json({ user: req.user });
});

app.post('/api/logout', (req, res) => {
    res.json({ message: 'Đăng xuất thành công' });
});

app.get('/api/novels', async (req, res) => {
    try {
        const db = await connectDB();
        const [novels] = await db.execute(`
            SELECT n.id, n.title, n.author, n.views, n.rating, n.coverUrl, n.description, n.chapterCount,
                   GROUP_CONCAT(g.name) AS genres
            FROM Novels n
            LEFT JOIN NovelGenres ng ON n.id = ng.novel_id
            LEFT JOIN Genres g ON ng.genre_id = g.id
            GROUP BY n.id
        `);
        const [chapters] = await db.execute(`
            SELECT c.novel_id, c.name, c.date
            FROM Chapters c
            ORDER BY c.id DESC
        `);

        const result = novels.map(novel => ({
            ...novel,
            genres: novel.genres ? novel.genres.split(',') : [],
            chapters: chapters.filter(ch => ch.novel_id == novel.id)
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu novels' });
    }
});

app.post('/api/novels', authenticateToken, restrictTo(['admin']), async (req, res) => {
    const { id, title, author, views, rating, coverUrl, description, chapterCount, genres } = req.body;
    if (!id || !title || !author) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    try {
        const db = await connectDB();
        await db.execute(
            'INSERT INTO Novels (id, title, author, views, rating, coverUrl, description, chapterCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, author, views || '0', rating || 0, coverUrl, description, chapterCount || 0]
        );

        if (genres && genres.length > 0) {
            for (const genre of genres) {
                let [genreRows] = await db.execute('SELECT id FROM Genres WHERE name = ?', [genre]);
                let genreId = genreRows[0]?.id;
                if (!genreId) {
                    [genreRows] = await db.execute('INSERT INTO Genres (name) VALUES (?)', [genre]);
                    genreId = genreRows.insertId;
                }
                await db.execute('INSERT INTO NovelGenres (novel_id, genre_id) VALUES (?, ?)', [id, genreId]);
            }
        }

        await logAction(req.user.id, `Thêm tiểu thuyết: ${title}`);
        res.status(201).json({ message: 'Thêm tiểu thuyết thành công' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi thêm tiểu thuyết' });
    }
});

app.put('/api/novels/:id', authenticateToken, restrictTo(['admin']), async (req, res) => {
    const { id } = req.params;
    const { title, author, views, rating, coverUrl, description, chapterCount, genres } = req.body;

    try {
        const db = await connectDB();
        await db.execute(
            'UPDATE Novels SET title = ?, author = ?, views = ?, rating = ?, coverUrl = ?, description = ?, chapterCount = ? WHERE id = ?',
            [title, author, views, rating, coverUrl, description, chapterCount, id]
        );

        if (genres && genres.length > 0) {
            await db.execute('DELETE FROM NovelGenres WHERE novel_id = ?', [id]);
            for (const genre of genres) {
                let [genreRows] = await db.execute('SELECT id FROM Genres WHERE name = ?', [genre]);
                let genreId = genreRows[0]?.id;
                if (!genreId) {
                    [genreRows] = await db.execute('INSERT INTO Genres (name) VALUES (?)', [genre]);
                    genreId = genreRows.insertId;
                }
                await db.execute('INSERT INTO NovelGenres (novel_id, genre_id) VALUES (?, ?)', [id, genreId]);
            }
        }

        await logAction(req.user.id, `Sửa tiểu thuyết: ${title}`);
        res.json({ message: 'Cập nhật tiểu thuyết thành công' });
    } catch (error) {
        console.error('Lỗi khi cập nhật tiểu thuyết:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật tiểu thuyết' });
    }
});

app.delete('/api/novels/:id', authenticateToken, restrictTo(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const db = await connectDB();
        const [novels] = await db.execute('SELECT title FROM Novels WHERE id = ?', [id]);
        if (!novels[0]) {
            return res.status(404).json({ error: 'Tiểu thuyết không tồn tại' });
        }

        await db.execute('DELETE FROM NovelGenres WHERE novel_id = ?', [id]);
        await db.execute('DELETE FROM Chapters WHERE novel_id = ?', [id]);
        await db.execute('DELETE FROM Bookmarks WHERE novel_id = ?', [id]);
        await db.execute('DELETE FROM Favorites WHERE novel_id = ?', [id]);
        await db.execute('DELETE FROM Comments WHERE novel_id = ?', [id]);
        await db.execute('DELETE FROM Novels WHERE id = ?', [id]);

        await logAction(req.user.id, `Xóa tiểu thuyết: ${novels[0].title}`);
        res.json({ message: 'Xóa tiểu thuyết thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa tiểu thuyết:', error);
        res.status(500).json({ error: 'Lỗi khi xóa tiểu thuyết' });
    }
});

app.get('/api/admin/users', authenticateToken, restrictTo(['admin']), async (req, res) => {
    try {
        const db = await connectDB();
        const [users] = await db.execute('SELECT id, username, email, role, created_at FROM Users');
        res.json(users);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng' });
    }
});

app.put('/api/admin/users/:id', authenticateToken, restrictTo(['admin']), async (req, res) => {
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
        console.error('Lỗi khi cập nhật vai trò:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật vai trò' });
    }
});

app.post('/api/bookmarks', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    const { novel_id } = req.body;
    if (!novel_id) {
        return res.status(400).json({ error: 'Vui lòng cung cấp novel_id' });
    }

    try {
        const db = await connectDB();
        await db.execute('INSERT INTO Bookmarks (user_id, novel_id) VALUES (?, ?)', [req.user.id, novel_id]);
        res.status(201).json({ message: 'Thêm bookmark thành công' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Bookmark đã tồn tại' });
        } else {
            console.error('Lỗi khi thêm bookmark:', error);
            res.status(500).json({ error: 'Lỗi khi thêm bookmark' });
        }
    }
});

app.delete('/api/bookmarks/:novel_id', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    const { novel_id } = req.params;

    try {
        const db = await connectDB();
        await db.execute('DELETE FROM Bookmarks WHERE user_id = ? AND novel_id = ?', [req.user.id, novel_id]);
        res.json({ message: 'Xóa bookmark thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa bookmark:', error);
        res.status(500).json({ error: 'Lỗi khi xóa bookmark' });
    }
});

app.get('/api/bookmarks', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    try {
        const db = await connectDB();
        const [bookmarks] = await db.execute(`
            SELECT n.id, n.title, n.author, n.views, n.rating, n.coverUrl, n.description, n.chapterCount,
                   EXISTS(SELECT 1 FROM Favorites f WHERE f.novel_id = n.id AND f.user_id = ?) AS is_favorited,
                   COUNT(DISTINCT f.id) AS favorite_count
            FROM Bookmarks b
            JOIN Novels n ON b.novel_id = n.id
            LEFT JOIN Favorites f ON n.id = f.novel_id
            WHERE b.user_id = ?
            GROUP BY n.id
        `, [req.user.id, req.user.id]);
        res.json(bookmarks.map(b => ({
            ...b,
            is_favorited: !!b.is_favorited,
            favorite_count: parseInt(b.favorite_count) || 0
        })));
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bookmark:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách bookmark' });
    }
});

app.post('/api/favorites', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    const { novel_id } = req.body;
    if (!novel_id) {
        return res.status(400).json({ error: 'Vui lòng cung cấp novel_id' });
    }

    try {
        const db = await connectDB();
        // Lấy tiêu đề tiểu thuyết để ghi log
        const [novels] = await db.execute('SELECT title FROM Novels WHERE id = ?', [novel_id]);
        if (!novels[0]) {
            return res.status(404).json({ error: 'Tiểu thuyết không tồn tại' });
        }
        const novelTitle = novels[0].title;

        await db.execute('INSERT INTO Favorites (user_id, novel_id) VALUES (?, ?)', [req.user.id, novel_id]);
        await logAction(req.user.id, `Thêm yêu thích: ${novelTitle}`);
        res.status(201).json({ message: 'Thêm yêu thích thành công' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Yêu thích đã tồn tại' });
        } else {
            console.error('Lỗi khi thêm yêu thích:', error);
            res.status(500).json({ error: 'Lỗi khi thêm yêu thích' });
        }
    }
});

app.delete('/api/favorites/:novel_id', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
    const { novel_id } = req.params;

    try {
        const db = await connectDB();
        // Lấy tiêu đề tiểu thuyết để ghi log (tùy chọn, bỏ comment nếu cần)
        /*
        const [novels] = await db.execute('SELECT title FROM Novels WHERE id = ?', [novel_id]);
        if (!novels[0]) {
            return res.status(404).json({ error: 'Tiểu thuyết không tồn tại' });
        }
        const novelTitle = novels[0].title;
        */

        await db.execute('DELETE FROM Favorites WHERE user_id = ? AND novel_id = ?', [req.user.id, novel_id]);
        // await logAction(req.user.id, `Xóa yêu thích: ${novelTitle}`); // Bỏ comment nếu muốn ghi log
        res.json({ message: 'Xóa yêu thích thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa yêu thích:', error);
        res.status(500).json({ error: 'Lỗi khi xóa yêu thích' });
    }
});

app.get('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const db = await connectDB();
        const [favorites] = await db.query(`
            SELECT n.id, n.title, n.author, n.views, n.coverUrl, n.description, n.chapterCount, n.updated_at,
                   GROUP_CONCAT(g.name) AS genres,
                   COUNT(DISTINCT f2.user_id) AS favorite_count,
                   EXISTS(SELECT 1 FROM Bookmarks b WHERE b.novel_id = n.id AND b.user_id = ?) AS is_bookmarked,
                   EXISTS(SELECT 1 FROM Favorites f WHERE f.novel_id = n.id AND f.user_id = ?) AS is_favorited
            FROM Favorites f
            JOIN Novels n ON f.novel_id = n.id
            LEFT JOIN NovelGenres ng ON n.id = ng.novel_id
            LEFT JOIN Genres g ON ng.genre_id = g.id
            LEFT JOIN Favorites f2 ON n.id = f2.novel_id
            WHERE f.user_id = ?
            GROUP BY n.id
        `, [req.user.id, req.user.id, req.user.id]);
        res.json(favorites.map(f => ({
            ...f,
            genres: f.genres ? f.genres.split(',') : [],
            favorite_count: parseInt(f.favorite_count) || 0,
            is_bookmarked: !!f.is_bookmarked,
            is_favorited: !!f.is_favorited
        })));
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/comments', authenticateToken, restrictTo(['user', 'admin']), async (req, res) => {
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

        // Cập nhật rating trung bình của tiểu thuyết
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

app.delete('/api/comments/:id', authenticateToken, restrictTo(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const db = await connectDB();
        const [comments] = await db.execute('SELECT novel_id FROM Comments WHERE id = ?', [id]);
        if (!comments[0]) {
            return res.status(404).json({ error: 'Bình luận không tồn tại' });
        }

        const novel_id = comments[0].novel_id;
        await db.execute('DELETE FROM Comments WHERE id = ?', [id]);

        // Cập nhật rating trung bình của tiểu thuyết
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

app.listen(3000, () => {
    console.log('Server chạy tại http://localhost:3000');
});