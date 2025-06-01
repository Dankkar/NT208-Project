const express = require('express');
const router = express.Router();
const {
  createReview,
  getHotelReviews,
  getBookingReviews
} = require('../controllers/reviewController');
const { authenticateToken } = require('../middlewares/auth');

// -------- PUBLIC ROUTES --------

// GET /reviews/hotel/:MaKS - Lấy đánh giá theo khách sạn
router.get('/hotel/:MaKS', getHotelReviews);

// GET /reviews/booking/:MaDat - Lấy đánh giá theo booking
router.get('/booking/:MaDat', getBookingReviews);

// -------- PRIVATE ROUTES --------

// POST /reviews - Tạo đánh giá (phải đăng nhập)
router.post('/', authenticateToken, createReview);

module.exports = router;