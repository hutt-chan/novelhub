require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const novelsRoutes = require("./routes/novels");
const bookmarksRoutes = require("./routes/bookmarks");
const chaptersRoutes = require("./routes/chapters");
const favoritesRoutes = require("./routes/favorites");
const adminRoutes = require("./routes/admin");
const commentsRoutes = require("./routes/comments");
const historyRoutes = require("./routes/history");
const bookmarkRouter = require("./routes/bookmarks");
const usersRoutes = require("./routes/users");
const notificationsRoutes = require("./routes/notifications");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api", authRoutes);
app.use("/api/novels", novelsRoutes);
app.use("/api/bookmarks", bookmarksRoutes);
app.use("/api/chapters", chaptersRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/bookmarks", bookmarkRouter);
app.use("/api/users", usersRoutes);
app.use("/api/notifications", notificationsRoutes);

async function searchNovels(query) {
  if (!query || query.length < 2) return [];
  try {
    const response = await fetch(
      `http://localhost:3000/api/novels?search=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    const results = await response.json();
    return results.slice(0, 7);
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

app.listen(3000, () => {
  console.log("Server chạy tại http://localhost:3000");
});