const express = require('express');
const router = express.Router();
const { 
    createReview,
    getHotelReviews,
    getBookingReviews
} = require('../controllers/reviewController');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @route   POST /api/reviews
 * @desc    Create a new review with auto-reply
 * @access  Private
 */
router.post('/', authenticateToken, createReview);

/**
 * @route   GET /api/reviews/hotel/:MaKS
 * @desc    Get all reviews for a hotel
 * @access  Public
 */
router.get('/hotel/:MaKS', getHotelReviews);

/**
 * @route   GET /api/reviews/booking/:MaDat
 * @desc    Get all reviews for a booking
 * @access  Public
 */
router.get('/booking/:MaDat', getBookingReviews);

module.exports = router; 