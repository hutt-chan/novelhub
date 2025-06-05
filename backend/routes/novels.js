const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const { authenticateToken, restrictTo } = require("../middleware/auth");
const { logAction } = require("../utils/logger");

// Lấy danh sách chương
router.get("/:novel_id/chapters", async (req, res) => {
  const { novel_id } = req.params;
  try {
    const db = await connectDB();
    const [chapters] = await db.execute(
      "SELECT id, novel_id, name, date FROM Chapters WHERE novel_id = ? ORDER BY id ASC",
      [novel_id]
    );
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách chương" });
  }
});

// Lấy danh sách truyện
router.get("/", async (req, res) => {
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
            SELECT c.id, c.novel_id, c.name, c.date
            FROM Chapters c
            ORDER BY c.id DESC
        `);
    const result = novels.map((novel) => ({
      ...novel,
      genres: novel.genres ? novel.genres.split(",") : [],
      chapters: chapters.filter((ch) => ch.novel_id == novel.id),
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy dữ liệu novels" });
  }
});

// Thêm truyện
router.post("/", authenticateToken, restrictTo(["admin"]), async (req, res) => {
  const {
    id,
    title,
    author,
    views,
    rating,
    coverUrl,
    description,
    chapterCount,
    genres,
  } = req.body;
  if (!id || !title || !author) {
    return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
  }
  try {
    const db = await connectDB();
    await db.execute(
      "INSERT INTO Novels (id, title, author, views, rating, coverUrl, description, chapterCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        title,
        author,
        views || "0",
        rating || 0,
        coverUrl,
        description,
        chapterCount || 0,
      ]
    );
    if (genres && genres.length > 0) {
      for (const genre of genres) {
        let [genreRows] = await db.execute(
          "SELECT id FROM Genres WHERE name = ?",
          [genre]
        );
        let genreId = genreRows[0]?.id;
        if (!genreId) {
          [genreRows] = await db.execute(
            "INSERT INTO Genres (name) VALUES (?)",
            [genre]
          );
          genreId = genreRows.insertId;
        }
        await db.execute(
          "INSERT INTO NovelGenres (novel_id, genre_id) VALUES (?, ?)",
          [id, genreId]
        );
      }
    }
    await logAction(req.user.id, `Thêm tiểu thuyết: ${title}`);
    res.status(201).json({ message: "Thêm tiểu thuyết thành công" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi thêm tiểu thuyết" });
  }
});

// Cập nhật truyện
router.put(
  "/:id",
  authenticateToken,
  restrictTo(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const {
      title,
      author,
      views,
      rating,
      coverUrl,
      description,
      chapterCount,
      genres,
    } = req.body;
    try {
      const db = await connectDB();
      await db.execute(
        "UPDATE Novels SET title = ?, author = ?, views = ?, rating = ?, coverUrl = ?, description = ?, chapterCount = ? WHERE id = ?",
        [title, author, views, rating, coverUrl, description, chapterCount, id]
      );
      if (genres && genres.length > 0) {
        await db.execute("DELETE FROM NovelGenres WHERE novel_id = ?", [id]);
        for (const genre of genres) {
          let [genreRows] = await db.execute(
            "SELECT id FROM Genres WHERE name = ?",
            [genre]
          );
          let genreId = genreRows[0]?.id;
          if (!genreId) {
            [genreRows] = await db.execute(
              "INSERT INTO Genres (name) VALUES (?)",
              [genre]
            );
            genreId = genreRows.insertId;
          }
          await db.execute(
            "INSERT INTO NovelGenres (novel_id, genre_id) VALUES (?, ?)",
            [id, genreId]
          );
        }
      }
      await logAction(req.user.id, `Sửa tiểu thuyết: ${title}`);
      res.json({ message: "Cập nhật tiểu thuyết thành công" });
    } catch (error) {
      res.status(500).json({ error: "Lỗi khi cập nhật tiểu thuyết" });
    }
  }
);

// Xóa truyện
router.delete(
  "/:id",
  authenticateToken,
  restrictTo(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      const db = await connectDB();
      const [novels] = await db.execute(
        "SELECT title FROM Novels WHERE id = ?",
        [id]
      );
      if (!novels[0]) {
        return res.status(404).json({ error: "Tiểu thuyết không tồn tại" });
      }
      await db.execute("DELETE FROM NovelGenres WHERE novel_id = ?", [id]);
      await db.execute("DELETE FROM Chapters WHERE novel_id = ?", [id]);
      await db.execute("DELETE FROM Bookmarks WHERE novel_id = ?", [id]);
      await db.execute("DELETE FROM Favorites WHERE novel_id = ?", [id]);
      await db.execute("DELETE FROM Comments WHERE novel_id = ?", [id]);
      await db.execute("DELETE FROM Novels WHERE id = ?", [id]);
      await logAction(req.user.id, `Xóa tiểu thuyết: ${novels[0].title}`);
      res.json({ message: "Xóa tiểu thuyết thành công" });
    } catch (error) {
      res.status(500).json({ error: "Lỗi khi xóa tiểu thuyết" });
    }
  }
);

// Route để lấy top 3 truyện được yêu thích nhất
router.get("/top-favorites", async (req, res) => {
  try {
    const db = await connectDB(); // THÊM DÒNG NÀY ĐỂ KẾT NỐI DB
    const [rows] = await db.execute(`
            SELECT
                n.id,
                n.title,
                COUNT(f.novel_id) AS favorite_count
            FROM
                Novels n
            JOIN
                Favorites f ON n.id = f.novel_id
            GROUP BY
                n.id, n.title
            ORDER BY
                favorite_count DESC
            LIMIT 3; -- Đã sửa thành LIMIT 3
        `);
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi lấy top truyện yêu thích:", error.message);
    res.status(500).send("Lỗi máy chủ khi lấy top truyện yêu thích.");
  }
});

module.exports = router;