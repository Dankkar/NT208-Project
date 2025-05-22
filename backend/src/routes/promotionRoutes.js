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

// Public routes
router.get('/', getAllPromotions);
router.get('/active', getActivePromotions);
router.get('/validate/:MaCodeKM', validatePromotion);
router.get('/:MaKM', getPromotionDetails);

// Admin/Staff routes
router.post('/', authenticateToken, isStaff, createPromotion);
router.put('/:MaKM', authenticateToken, isStaff, updatePromotion);
router.delete('/:MaKM', authenticateToken, isStaff, deletePromotion);

// Booking promotion routes
router.post('/booking/:MaDat/apply', authenticateToken, applyPromotionToBooking);

module.exports = router;