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
    getAllBookings,
    holdBooking
} = require('../controllers/bookingController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

/**
 * @route   POST /api/bookings/rooms/available
 * @desc    Kiểm tra phòng trống theo loại phòng và ngày
 * @access  Public
 */
router.post('/rooms/available', getAvailableRoomTypes);

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
 * @route   PUT /api/bookings/:MaDat
 * @desc    Cập nhật trạng thái đơn đặt phòng (hủy đơn)
 * @access  Private
 */
router.put('/:MaDat', authenticateToken, cancelBooking);

/**
 * @route   GET /api/bookings/:MaDat/price
 * @desc    Tính giá đặt phòng (bao gồm phòng, dịch vụ và ưu đãi)
 * @access  Private
 */
router.get('/:MaDat/price', authenticateToken, calculatePrice);

/**
 * @route   POST /api/bookings/:MaDat/confirmations
 * @desc    Gửi email xác nhận đặt phòng
 * @access  Private
 */
router.post('/:MaDat/confirmations', authenticateToken, sendBookingConfirmation);

router.get('/admin', authenticateToken, isAdmin, getAllBookings);

router.post('/hold', authenticateToken, holdBooking);

module.exports = router;