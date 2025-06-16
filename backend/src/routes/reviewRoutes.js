const express = require('express');
const router = express.Router();
const {
  createReview,
  getHotelReviews,
  getBookingReviews,
  adminGetHotelReviews,
  adminSetReviewApproval
} = require('../controllers/reviewController');
const { authenticateToken, isAdmin, optionalAuthenticationToken } = require('../middlewares/auth');

// -------- PUBLIC ROUTES --------

// GET /reviews/hotel/:MaKS - Lấy đánh giá theo khách sạn
router.get('/hotel/:MaKS', getHotelReviews);

// GET /reviews/booking/:MaDat - Lấy đánh giá theo booking
router.get('/booking/:MaDat', getBookingReviews);

// -------- PRIVATE ROUTES --------

// POST /reviews - Tạo đánh giá (optional auth cho guest)
router.post('/', optionalAuthenticationToken, createReview);

// GET /api/reviews/admin/hotel/:MaKS - Admin lấy tất cả review (có phân trang) của một khách sạn
router.get('/admin/hotel/:MaKS', authenticateToken, isAdmin, adminGetHotelReviews);

// PUT /api/reviews/admin/:MaDG/approval - Admin cập nhật trạng thái duyệt (true/false)
router.put('/admin/:MaDG/approval', authenticateToken, isAdmin, adminSetReviewApproval);

module.exports = router;