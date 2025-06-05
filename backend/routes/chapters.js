const express = require("express");
const { connectDB } = require("../config/db");
const { authenticateToken, restrictTo } = require("../middleware/auth");

const router = express.Router();

// Lấy nội dung chương cụ thể theo ID (dùng cho việc sửa chương)
// Path: /api/chapters/detail/:id
router.get(
  "/detail/:id",
  authenticateToken,
  restrictTo(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    console.log(
      `[${new Date().toISOString()}] Received request for chapter detail ID: ${id}`
    );
    try {
      const db = await connectDB();
      const [chapters] = await db.execute(
        "SELECT id, novel_id, name, content, date FROM Chapters WHERE id = ?",
        [id]
      );
      if (!chapters[0]) {
        console.log(
          `[${new Date().toISOString()}] Chapter ID ${id} not found.`
        );
        return res.status(404).json({ error: "Chương không tồn tại!" });
      }
      console.log(
        `[${new Date().toISOString()}] Found chapter detail for ID ${id}.`
      );
      res.json(chapters[0]);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Lỗi khi lấy chương chi tiết:`,
        error
      );
      res.status(500).json({ error: "Lỗi khi lấy chương chi tiết" });
    }
  }
);

//Lấy nội dung chương cụ thể
//Lấy nội dung chương cụ thể
router.get("/:novel_id/:chapter_id", async (req, res) => {
  const { novel_id, chapter_id } = req.params;

  try {
    const db = await connectDB();
    const [result] = await db.execute(
      `CALL GetChapterAndIncrementViews(?, ?, @id, @novel_id, @name, @content, @date, @coverUrl, @novelTitle, @error)`,
      [novel_id, chapter_id]
    );
    const [output] = await db.execute(
      `SELECT @id AS id, @novel_id AS novel_id, @name AS name, @content AS content, @date AS date, @coverUrl AS coverUrl, @novelTitle AS novelTitle, @error AS error`
    );

    if (output[0].error) {
      return res.status(404).json({ error: output[0].error });
    }

    const chapterData = {
      id: output[0].id,
      novel_id: output[0].novel_id,
      name: output[0].name,
      content: output[0].content,
      date: output[0].date,
      coverUrl: output[0].coverUrl,
      novelTitle: output[0].novelTitle,
    };
    res.json(chapterData);
  } catch (error) {
    console.error("Lỗi khi lấy chương:", error);
    res.status(500).json({ error: "Lỗi khi lấy chương" });
  }
});

//Lấy danh sách chương
router.get("/:novel_id/chapters", async (req, res) => {
  let { novel_id } = req.params;
  console.log(
    `[${new Date().toISOString()}] Received novel_id: ${novel_id}, type: ${typeof novel_id}`
  );

  novel_id = parseInt(novel_id);
  if (isNaN(novel_id)) {
    console.log(`[${new Date().toISOString()}] Invalid novel_id: ${novel_id}`);
    return res.status(400).json({ error: "novel_id không hợp lệ" });
  }

  try {
    const db = await connectDB();
    const [chapters] = await db.execute(
      "SELECT id, novel_id, name, date FROM Chapters WHERE novel_id = ? ORDER BY id ASC",
      [novel_id]
    );
    console.log(
      `[${new Date().toISOString()}] Chapter list for novel_id ${novel_id}:`,
      chapters
    );
    res.json(chapters);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Lỗi khi lấy danh sách chương:`,
      error
    );
    res
      .status(500)
      .json({ error: "Lỗi khi lấy danh sách chương", details: error.message });
  }
});

// --- API cho quản lý chương ---

// Lấy TẤT CẢ các chương (dành cho trang quản lý chung của admin)
// Có thể lọc theo novel_id, chức năng tìm kiếm theo tên tiểu thuyết đã được bỏ
// Path: /api/chapters/
// Tuyến này phục vụ trang quản lý chương, cho phép quản trị viên xem và lọc danh sách chương.
router.get("/", authenticateToken, restrictTo(["admin"]), async (req, res) => {
  // Chỉ lấy novel_id từ query parameters, novel_title_search đã được bỏ
  const { novel_id } = req.query;
  console.log(
    `[${new Date().toISOString()}] Received request for all chapters. Filters: novel_id=${novel_id}`
  );

  try {
    const db = await connectDB();
    // Cần JOIN với bảng Novels để lấy tên tiểu thuyết (nếu muốn hiển thị)
    // nhưng không còn lọc theo tên tiểu thuyết nữa
    let query = `
            SELECT
                c.id,
                c.novel_id,
                c.name,
                c.date,
                LEFT(c.content, 200) AS content_summary,
                n.title AS novel_title_for_display -- Vẫn lấy tên tiểu thuyết để hiển thị nếu cần
            FROM
                Chapters c
            JOIN
                Novels n ON c.novel_id = n.id
        `;
    let params = [];
    let conditions = [];

    if (novel_id) {
      conditions.push("c.novel_id = ?"); // Sử dụng alias 'c' cho Chapters
      params.push(novel_id);
    }

    // Đã bỏ phần thêm điều kiện tìm kiếm theo tên tiểu thuyết
    // if (novel_title_search) {
    //     conditions.push('n.title LIKE ?');
    //     params.push(`%${novel_title_search}%`);
    // }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY c.novel_id ASC, c.date ASC"; // Sắp xếp để dễ quản lý, sử dụng alias 'c'

    const [chapters] = await db.execute(query, params);
    console.log(
      `[${new Date().toISOString()}] Fetched ${
        chapters.length
      } chapters with filters.`
    );
    res.json(chapters);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Lỗi khi lấy danh sách chương tổng quát:`,
      error
    );
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

// Lấy danh sách chương của một tiểu thuyết cụ thể (dành cho trang chi tiết tiểu thuyết)
// Path: /api/chapters/:novel_id/chapters
router.get("/:novel_id/chapters", async (req, res) => {
  let { novel_id } = req.params;
  console.log(
    `[${new Date().toISOString()}] Received novel_id for chapter list: ${novel_id}, type: ${typeof novel_id}`
  );

  novel_id = parseInt(novel_id);
  if (isNaN(novel_id)) {
    console.log(`[${new Date().toISOString()}] Invalid novel_id: ${novel_id}`);
    return res.status(400).json({ error: "novel_id không hợp lệ" });
  }

  try {
    const db = await connectDB();
    const [chapters] = await db.execute(
      "SELECT id, novel_id, name, date, LEFT(content, 200) AS content_summary FROM Chapters WHERE novel_id = ? ORDER BY id ASC",
      [novel_id]
    );
    console.log(
      `[${new Date().toISOString()}] Chapter list for novel_id ${novel_id}:`,
      chapters.length
    );
    res.json(chapters);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Lỗi khi lấy danh sách chương:`,
      error
    );
    res
      .status(500)
      .json({ error: "Lỗi khi lấy danh sách chương", details: error.message });
  }
});

// Lấy nội dung chương cụ thể (tuyến cũ của bạn, có thể trùng lặp với /detail/:id tùy cách dùng)
// Path: /api/chapters/:novel_id/:chapter_id
router.get("/:novel_id/:chapter_id", async (req, res) => {
  const { novel_id, chapter_id } = req.params;
  console.log(
    `[${new Date().toISOString()}] Received novel_id: ${novel_id}, chapter_id: ${chapter_id} for specific chapter`
  );

  try {
    const db = await connectDB();
    const [chapters] = await db.execute(
      "SELECT id, novel_id, name, content, date FROM Chapters WHERE novel_id = ? AND id = ?",
      [novel_id, chapter_id]
    );
    if (!chapters[0]) {
      console.log(
        `[${new Date().toISOString()}] Chapter not found for novel_id: ${novel_id}, chapter_id: ${chapter_id}`
      );
      return res.status(404).json({ error: "Chương không tồn tại" });
    }
    console.log(
      `[${new Date().toISOString()}] Found chapter: ${chapters[0].name}`
    );
    res.json(chapters[0]);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Lỗi khi lấy chương cụ thể:`,
      error
    );
    res
      .status(500)
      .json({ error: "Lỗi khi lấy chương", details: error.message });
  }
});

// Tạo chương mới
// Path: /api/chapters/
router.post("/", authenticateToken, restrictTo(["admin"]), async (req, res) => {
  const { novel_id, name, date, content } = req.body;
  console.log(
    `[${new Date().toISOString()}] Received request to create chapter:`,
    { novel_id, name, date }
  );

  if (!novel_id || !name) {
    return res
      .status(400)
      .json({ error: "Vui lòng cung cấp novel_id và tên chương." });
  }

  // Đảm bảo date là một đối tượng Date hợp lệ
  const chapterDate = date ? new Date(date) : new Date();
  try {
    const db = await connectDB();
    const [result] = await db.execute(
      "INSERT INTO Chapters (novel_id, name, date, content) VALUES (?, ?, ?, ?)",
      [novel_id, name, chapterDate, content]
    );
    // Gửi thông báo cho user đã bookmark truyện này
    const [bookmarkUsers] = await db.execute(
      "SELECT user_id FROM bookmarks WHERE novel_id = ?",
      [novel_id]
    );
    if (bookmarkUsers.length > 0) {
      // Lấy tên truyện
      const [novelRows] = await db.execute(
        "SELECT title FROM novels WHERE id = ?",
        [novel_id]
      );
      const novelTitle = novelRows[0]?.title || '';
      for (const user of bookmarkUsers) {
        await db.execute(
          "INSERT INTO notifications (user_id, novel_id, message) VALUES (?, ?, ?)",
          [user.user_id, novel_id, `Novel '${novelTitle}' has a new chapter: ${name}`]
        );
      }
    }
    console.log(
      `[${new Date().toISOString()}] Chapter created with ID: ${
        result.insertId
      }`
    );
    res
      .status(201)
      .json({ message: "Tạo chương thành công!", chapterId: result.insertId });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Lỗi khi tạo chương:`, error);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

// Cập nhật chương
// Path: /api/chapters/:id
router.put(
  "/:id",
  authenticateToken,
  restrictTo(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { novel_id, name, date, content } = req.body;
    console.log(
      `[${new Date().toISOString()}] Received request to update chapter ID ${id}:`,
      { novel_id, name, date }
    );

    if (!novel_id || !name) {
      return res
        .status(400)
        .json({ error: "Vui lòng cung cấp novel_id và tên chương." });
    }

    const chapterDate = date ? new Date(date) : new Date();
    try {
      const db = await connectDB();
      const [result] = await db.execute(
        "UPDATE Chapters SET novel_id = ?, name = ?, date = ?, content = ? WHERE id = ?",
        [novel_id, name, chapterDate, content, id]
      );
      if (result.affectedRows === 0) {
        console.log(
          `[${new Date().toISOString()}] Chapter ID ${id} not found for update.`
        );
        return res
          .status(404)
          .json({ error: "Không tìm thấy chương để cập nhật" });
      }
      console.log(
        `[${new Date().toISOString()}] Chapter ID ${id} updated successfully.`
      );
      res.json({ message: "Cập nhật chương thành công!" });
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Lỗi khi cập nhật chương:`,
        error
      );
      res.status(500).json({ error: "Lỗi server: " + error.message });
    }
  }
);

// Xóa chương
// Path: /api/chapters/:id
router.delete(
  "/:id",
  authenticateToken,
  restrictTo(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    console.log(
      `[${new Date().toISOString()}] Received request to delete chapter ID: ${id}`
    );

    try {
      const db = await connectDB();
      const [result] = await db.execute("DELETE FROM Chapters WHERE id = ?", [
        id,
      ]);
      if (result.affectedRows === 0) {
        console.log(
          `[${new Date().toISOString()}] Chapter ID ${id} not found for deletion.`
        );
        return res.status(404).json({ error: "Không tìm thấy chương để xóa" });
      }
      console.log(
        `[${new Date().toISOString()}] Chapter ID ${id} deleted successfully.`
      );
      res.json({ message: "Xóa chương thành công!" });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Lỗi khi xóa chương:`, error);
      res.status(500).json({ error: "Lỗi server: " + error.message });
    }
  }
);

module.exports = router;