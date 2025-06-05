const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res
      .status(401)
      .json({ message: "Không có token xác thực được cung cấp." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Lỗi xác thực token:", err.message);
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
    }
    req.user = user;
    next();
  });
}

function restrictTo(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền truy cập chức năng này." });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  restrictTo,
};