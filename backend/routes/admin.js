const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/auth"); // Đảm bảo đường dẫn đúng

// Route để lấy tất cả truyện (có thể kèm tìm kiếm)
router.get(
  "/novels",
  authMiddleware.authenticateToken,
  authMiddleware.restrictTo(["admin"]), // Chỉ admin mới được truy cập
  adminController.getNovels
);

// Route để lấy chi tiết một truyện theo ID
router.get(
  "/novels/:id",
  authMiddleware.authenticateToken,
  authMiddleware.restrictTo(["admin"]),
  adminController.getNovelById
);

// Route để thêm truyện mới
router.post(
  "/novels",
  authMiddleware.authenticateToken,
  authMiddleware.restrictTo(["admin"]),
  adminController.addNovel
);

// Route để cập nhật truyện
router.put(
  "/novels/:id",
  authMiddleware.authenticateToken,
  authMiddleware.restrictTo(["admin"]),
  adminController.updateNovel
);

// Route để xóa truyện
router.delete(
  "/novels/:id",
  authMiddleware.authenticateToken,
  authMiddleware.restrictTo(["admin"]),
  adminController.deleteNovel
);

// Route lấy thống kê dashboard
router.get(
  "/dashboard-stats",
  authMiddleware.authenticateToken,
  authMiddleware.restrictTo(["admin"]),
  adminController.getDashboardStats
);
router.get(
  "/genres",
  authMiddleware.authenticateToken,
  adminController.getGenres
);

module.exports = router;
