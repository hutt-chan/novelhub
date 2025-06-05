// backend/routes/users.js
const express = require("express");
const bcrypt = require("bcrypt");
const { connectDB } = require("../config/db");
const { authenticateToken, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const [users] = await db.execute(
      "SELECT username, email, created_at FROM Users WHERE id = ?",
      [req.user.id]
    );
    if (!users[0]) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(users[0]);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  const { username, password } = req.body;
  if (!username && !password) {
    return res
      .status(400)
      .json({ error: "Please provide a new username or password" });
  }

  try {
    const db = await connectDB();
    const updates = [];
    const values = [];

    if (username) {
      updates.push("username = ?");
      values.push(username);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push("password = ?");
      values.push(hashedPassword);
    }

    values.push(req.user.id);
    await db.execute(
      `UPDATE Users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin người dùng:", error);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

// Path: /api/users
router.get("/", authenticateToken, restrictTo(["admin"]), async (req, res) => {
  const { role, username_search } = req.query;

  let connection;
  try {
    connection = await connectDB();
    let query =
      "SELECT id, username, email, role, created_at FROM users WHERE 1=1";
    const params = [];

    if (role) {
      query += " AND role = ?";
      params.push(role);
    }
    if (username_search) {
      query += " AND username LIKE ?";
      params.push(`%${username_search}%`);
    }

    const [users] = await connection.execute(query, params);
    res.json(users);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching user list:`,
      error
    );
    res
      .status(500)
      .json({ error: "Failed to fetch user list", details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Get user details by ID
// Path: /api/users/detail/:id
router.get(
  "/detail/:id",
  authenticateToken,
  restrictTo(["admin"]),
  async (req, res) => {
    const { id } = req.params;

    let connection;
    try {
      connection = await connectDB();
      const [users] = await connection.execute(
        "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
        [id]
      );
      if (users.length === 0) {
        return res.status(404).json({ error: "User not found." });
      }
      res.json(users[0]);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error fetching user details:`,
        error
      );
      res
        .status(500)
        .json({
          error: "Failed to fetch user details",
          details: error.message,
        });
    } finally {
      if (connection) connection.release();
    }
  }
);

// Create new user (Admin only)
// Path: /api/users
router.post("/", authenticateToken, restrictTo(["admin"]), async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res
      .status(400)
      .json({ error: "Please provide username, email, password, and role." });
  }

  let connection;
  try {
    connection = await connectDB();
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role]
    );
    res
      .status(201)
      .json({ message: "User created successfully!", userId: result.insertId });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error creating user:`, error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Username or email already exists." });
    }
    res.status(500).json({ error: "Server error: " + error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Update user (Admin only)
// Path: /api/users/:id
router.put(
  "/:id",
  authenticateToken,
  restrictTo(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    if (!username || !email || !role) {
      return res
        .status(400)
        .json({ error: "Please provide username, email, and role." });
    }

    let connection;
    try {
      connection = await connectDB();
      let query = "UPDATE users SET username = ?, email = ?, role = ?";
      const params = [username, email, role];

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ", password = ?";
        params.push(hashedPassword);
      }

      query += " WHERE id = ?";
      params.push(id);

      const [result] = await connection.execute(query, params);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found for update." });
      }
      res.json({ message: "User updated successfully!" });
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error updating user:`,
        error
      );
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ error: "Username or email already exists." });
      }
      res.status(500).json({ error: "Server error: " + error.message });
    } finally {
      if (connection) connection.release();
    }
  }
);

// Delete user (Admin only)
// Path: /api/users/:id
router.delete(
  "/:id",
  authenticateToken,
  restrictTo(["admin"]),
  async (req, res) => {
    const { id } = req.params;

    let connection;
    try {
      connection = await connectDB();
      const [result] = await connection.execute(
        "DELETE FROM users WHERE id = ?",
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found for deletion." });
      }
      res.json({ message: "User deleted successfully!" });
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error deleting user:`,
        error
      );
      res
        .status(500)
        .json({ error: "Failed to delete user: " + error.message });
    } finally {
      if (connection) connection.release();
    }
  }
);

module.exports = router;