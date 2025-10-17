const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Server OK"));

app.listen(3000, () => console.log("Server chạy tại http://localhost:3000"));

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("💀 Uncaught Exception:", err);
});
