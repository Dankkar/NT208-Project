//backend/src/routes/bookingRoutes.js

const express = require('express');
const router = express.Router();
const { 
    getAvailableRoomTypes,
    createBooking,
    getBookingById,
    cancelBooking,
    getBookingByUser,
    calculatePrice,
    sendBookingConfirmation,
    getAllBookings
} = require('../controllers/bookingController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

/**
 * @route   POST /api/bookings/check-available-rooms
 * @desc    Kiểm tra phòng trống theo loại phòng và ngày
 * @access  Public
 */
router.post('/check-available-rooms', getAvailableRoomTypes);

/**
 * @route   POST /api/bookings
 * @desc    Tạo đơn đặt phòng mới
 * @access  Private
 */
router.post('/', authenticateToken, createBooking);

/**
 * @route   GET /api/bookings/user/:MaKH
 * @desc    Lấy danh sách đơn đặt phòng của một khách hàng
 * @access  Private
 */
router.get('/user/:MaKH', authenticateToken, getBookingByUser);

/**
 * @route   GET /api/bookings/:MaDat
 * @desc    Lấy chi tiết một đơn đặt phòng
 * @access  Private
 */
router.get('/:MaDat', authenticateToken, getBookingById);

/**
 * @route   PUT /api/bookings/:MaDat/cancel
 * @desc    Hủy đơn đặt phòng
 * @access  Private
 */
router.put('/:MaDat/cancel', authenticateToken, cancelBooking);

/**
 * @route   POST /api/bookings/calculate-price
 * @desc    Tính giá đặt phòng (bao gồm phòng, dịch vụ và ưu đãi)
 * @access  Private
 */
router.post('/calculate-price', authenticateToken, calculatePrice);

/**
 * @route   POST /api/bookings/send-confirmation
 * @desc    Gửi email xác nhận đặt phòng
 * @access  Private
 */
router.post('/send-confirmation', authenticateToken, sendBookingConfirmation);

router.get('/admin', authenticateToken, isAdmin, getAllBookings);

module.exports = router;