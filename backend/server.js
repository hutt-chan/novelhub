const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456789', // Thay bằng mật khẩu MySQL của bạn
  database: 'novel_db'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Secret key cho JWT
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware để kiểm tra token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// API đăng ký người dùng
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, hashedPassword], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error registering user', error: err });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// API đăng nhập người dùng
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  });
});

// API lấy danh sách tiểu thuyết
app.get('/novels', (req, res) => {
  const query = 'SELECT * FROM novels';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching novels', error: err });
    }
    res.json(results);
  });
});

// API lấy chi tiết tiểu thuyết
app.get('/novels/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM novels WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching novel', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Novel not found' });
    }
    res.json(results[0]);
  });
});

// API lấy danh sách chương của một tiểu thuyết
app.get('/novels/:id/chapters', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT chapter_number, title FROM chapters WHERE novel_id = ? ORDER BY chapter_number';
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching chapters', error: err });
    }
    res.json(results);
  });
});

// API lấy nội dung một chương
app.get('/novels/:novelId/chapters/:chapterNumber', (req, res) => {
  const { novelId, chapterNumber } = req.params;
  const query = 'SELECT * FROM chapters WHERE novel_id = ? AND chapter_number = ?';
  db.query(query, [novelId, chapterNumber], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching chapter', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    res.json(results[0]);
  });
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
