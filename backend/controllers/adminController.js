// backend/controllers/adminController.js

const dbModule = require("../config/db");

// Hàm lấy số liệu dashboard
exports.getDashboardStats = async (req, res) => {
  let connection;
  try {
    connection = await dbModule.connectDB();

    const [novelRows] = await connection.query(
      "SELECT COUNT(*) AS totalNovels FROM novels"
    );
    const totalNovels = novelRows[0].totalNovels;

    const [userRows] = await connection.query(
      "SELECT COUNT(*) AS totalUsers FROM users"
    );
    const totalUsers = userRows[0].totalUsers;

    const [newUsersRows] = await connection.query(
      "SELECT COUNT(*) AS newUsers FROM users WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())"
    );
    const newUsers = newUsersRows[0].newUsers;

    res.json({
      totalNovels,
      totalUsers,
      newUsers,
    });
  } catch (error) {
    console.error("Lỗi khi lấy số liệu dashboard:", error);
    res.status(500).json({ message: "Lỗi server khi lấy số liệu dashboard." });
  } finally {
    if (connection) {
      await connection.end();
      console.log("Đã đóng kết nối database (getDashboardStats).");
    }
  }
};

// Hàm lấy danh sách truyện (có tìm kiếm và lọc theo genres, date)
exports.getNovels = async (req, res) => {
  var connection;
  try {
    connection = await dbModule.connectDB();
    const { search, genreId, date } = req.query;
    console.log(connection);
    let sql = `
            SELECT
                n.id, n.title, n.author, n.views, n.coverUrl, n.description, n.chapterCount, n.created_at,
                -- Thay đổi cách GROUP_CONCAT để trả về JSON cho genres
                COALESCE(
                    CONCAT('[', GROUP_CONCAT(DISTINCT JSON_OBJECT('id', g.id, 'name', g.name) ORDER BY g.name), ']')
                , '[]') AS genres_json
            FROM novels n
            LEFT JOIN novelgenres ng ON n.id = ng.novel_id
            LEFT JOIN genres g ON ng.genre_id = g.id
        `;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(n.title LIKE ? OR n.author LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (genreId) {
      conditions.push(
        "n.id IN (SELECT novel_id FROM novelgenres WHERE genre_id = ?)"
      );
      params.push(genreId);
    }

    if (date) {
      conditions.push("DATE(n.created_at) = ?");
      params.push(date);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " GROUP BY n.id ORDER BY n.id ASC";

    const [rows] = await connection.query(sql, params);

    const novels = rows.map((novel) => {
      let parsedGenres = [];
      try {
        parsedGenres = JSON.parse(novel.genres_json);
      } catch (e) {
        console.warn("Lỗi khi parse genres_json cho truyện ID:", novel.id, e);
        parsedGenres = [];
      }
      return {
        ...novel,
        genres: parsedGenres,
        genres_json: undefined,
      };
    });

    res.json(novels);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách truyện:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách truyện." });
  } finally {
    if (connection) {
      await connection.end();
      console.log("Đã đóng kết nối database (getNovels).");
    }
  }
};

// Hàm lấy chi tiết một truyện theo ID (và các thể loại liên quan)
exports.getNovelById = async (req, res) => {
  let connection;
  try {
    connection = await dbModule.connectDB();
    const { id } = req.params;

    const [rows] = await connection.query(
      `SELECT
                n.id, n.title, n.author, n.views, n.description, n.coverUrl, n.chapterCount, n.created_at,
                COALESCE(
                    CONCAT('[', GROUP_CONCAT(DISTINCT JSON_OBJECT('id', g.id, 'name', g.name) ORDER BY g.name), ']')
                , '[]') AS genres_json
            FROM novels n
            LEFT JOIN novelgenres ng ON n.id = ng.novel_id
            LEFT JOIN genres g ON ng.genre_id = g.id
            WHERE n.id = ?
            GROUP BY n.id`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy truyện." });
    }

    const novel = rows[0];
    let parsedGenres = [];
    try {
      parsedGenres = JSON.parse(novel.genres_json);
    } catch (e) {
      console.warn("Lỗi khi parse genres_json cho truyện ID:", novel.id, e);
      parsedGenres = [];
    }
    novel.genres = parsedGenres;
    novel.genres_json = undefined;

    res.json(novel);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết truyện:", error);
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết truyện." });
  } finally {
    if (connection) {
      await connection.end();
      console.log("Đã đóng kết nối database (getNovelById).");
    }
  }
};

// Hàm thêm truyện mới (có xử lý genres)
exports.addNovel = async (req, res) => {
  let connection;
  try {
    connection = await dbModule.connectDB();
    await connection.beginTransaction();

    const { title, author, description, coverUrl, chapterCount, genres } =
      req.body; // BỎ rating
    const views = 0;

    const [novelResult] = await connection.query(
      "INSERT INTO novels (title, author, description, coverUrl, chapterCount, views, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())", // BỎ rating
      [title, author, description, coverUrl, chapterCount || 0, views]
    );
    const novelId = novelResult.insertId;

    if (genres && Array.isArray(genres) && genres.length > 0) {
      const genreValues = genres.map((genreId) => [novelId, genreId]);
      await connection.query(
        "INSERT INTO novelgenres (novel_id, genre_id) VALUES ?",
        [genreValues]
      );
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Truyện đã được thêm thành công!", novelId: novelId });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi khi thêm truyện mới:", error);
    res.status(500).json({ message: "Lỗi server khi thêm truyện mới." });
  } finally {
    if (connection) {
      await connection.end();
      console.log("Đã đóng kết nối database (addNovel).");
    }
  }
};

// Hàm cập nhật truyện (có xử lý genres)
exports.updateNovel = async (req, res) => {
  let connection;
  try {
    connection = await dbModule.connectDB();
    await connection.beginTransaction();

    const { id } = req.params;
    const { title, author, description, coverUrl, chapterCount, genres } =
      req.body; // BỎ rating

    const [updateNovelResult] = await connection.query(
      "UPDATE novels SET title = ?, author = ?, description = ?, coverUrl = ?, chapterCount = ? WHERE id = ?", // BỎ rating
      [title, author, description, coverUrl, chapterCount || 0, id]
    );

    if (updateNovelResult.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Không tìm thấy truyện để cập nhật." });
    }

    await connection.query("DELETE FROM novelgenres WHERE novel_id = ?", [id]);

    if (genres && Array.isArray(genres) && genres.length > 0) {
      const genreValues = genres.map((genreId) => [id, genreId]);
      await connection.query(
        "INSERT INTO novelgenres (novel_id, genre_id) VALUES ?",
        [genreValues]
      );
    }

    await connection.commit();
    res.json({ message: "Truyện đã được cập nhật thành công!" });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi khi cập nhật truyện:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật truyện." });
  } finally {
    if (connection) {
      await connection.end();
      console.log("Đã đóng kết nối database (updateNovel).");
    }
  }
};

// Hàm xóa truyện
exports.deleteNovel = async (req, res) => {
  let connection;
  try {
    connection = await dbModule.connectDB();
    const { id } = req.params;
    // Xóa tất cả các dữ liệu liên quan trước khi xóa truyện để tránh lỗi khóa ngoại
    await connection.query("DELETE FROM bookmarks WHERE novel_id = ?", [id]);
    await connection.query("DELETE FROM favorites WHERE novel_id = ?", [id]);
    await connection.query("DELETE FROM comments WHERE novel_id = ?", [id]);
    await connection.query("DELETE FROM novelgenres WHERE novel_id = ?", [id]);
    await connection.query("DELETE FROM chapters WHERE novel_id = ?", [id]);
    // Sau đó mới xóa truyện
    const [result] = await connection.query("DELETE FROM novels WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy truyện để xóa." });
    }
    res.json({ message: "Truyện đã được xóa thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa truyện:", error);
    res.status(500).json({ message: "Lỗi server khi xóa truyện." });
  } finally {
    if (connection) {
      await connection.end();
      console.log("Đã đóng kết nối database (deleteNovel).");
    }
  }
};

// Hàm LẤY DANH SÁCH TẤT CẢ THỂ LOẠI
exports.getGenres = async (req, res) => {
  let connection;
  try {
    connection = await dbModule.connectDB();
    const [rows] = await connection.query(
      "SELECT id, name FROM genres ORDER BY name ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thể loại:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách thể loại." });
  } finally {
    if (connection) {
      await connection.end();
      console.log("Đã đóng kết nối database (getGenres).");
    }
  }
};