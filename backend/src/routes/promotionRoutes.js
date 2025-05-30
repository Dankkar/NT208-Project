const express = require('express');
const router = express.Router();
const { authenticateToken, isStaff } = require('../middlewares/auth');
const {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  validatePromotion,
  getActivePromotions,
  applyPromotionToBooking,
  getPromotionDetails,
  deletePromotion
} = require('../controllers/promotionController');

// -------- PUBLIC ROUTES --------

// GET /promotions - Tất cả khuyến mãi
router.get('/', getAllPromotions);

// GET /promotions/active - Khuyến mãi đang hoạt động
router.get('/active', getActivePromotions);

// GET /promotions/validate/:MaCodeKM - Kiểm tra mã khuyến mãi
router.get('/validate/:MaCodeKM', validatePromotion);

// -------- BOOKING ROUTE --------
// POST /promotions/booking/:MaDat/apply - Áp dụng mã khuyến mãi cho đơn
router.post('/booking/:MaDat/apply', authenticateToken, applyPromotionToBooking);

// -------- ADMIN/STAFF ROUTES --------
router.post('/', authenticateToken, isStaff, createPromotion);
router.put('/:MaKM', authenticateToken, isStaff, updatePromotion);
router.delete('/:MaKM', authenticateToken, isStaff, deletePromotion);

// -------- DYNAMIC PARAM ROUTE - Đặt CUỐI --------
// GET /promotions/:MaKM - Chi tiết khuyến mãi
router.get('/:MaKM', getPromotionDetails);

module.exports = router;