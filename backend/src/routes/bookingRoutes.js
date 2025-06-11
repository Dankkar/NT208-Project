const express = require('express');
const router = express.Router();
const { 
    searchAvailableRooms,
    getAllBookings,
    getBookingByUser,
    getMyBookings,
    holdBooking,
    createBooking,
    calculatePrice,
    sendBookingConfirmation,
    checkIn,
    checkOut,
    getBookingById,
    cancelBooking,
    updateBookingDetails,
    confirmBooking,
} = require('../controllers/bookingController');
const { authenticateToken, isAdmin, optionalAuthenticationToken } = require('../middlewares/auth');

/**
 * @route   POST /api/bookings/search
 * @desc    Kiểm tra phòng trống theo loại phòng và ngày
 * @access  Public
 */
router.get('/search', searchAvailableRooms);

/**
 * @route   GET /api/bookings/admin
 * @desc    Lấy danh sách đơn đặt phòng của tất cả khách hàng
 * @access  Private
 */
router.get('/admin', authenticateToken, isAdmin, getAllBookings);

/**
 * @route   GET /api/bookings/user/:MaKH
 * @desc    Lấy danh sách đơn đặt phòng của một khách hàng (Admin/QuanLyKS only)
 * @access  Private (Admin/QuanLyKS)
 */
router.get('/user/:MaKH', authenticateToken, isAdmin, getBookingByUser);

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Lấy danh sách đơn đặt phòng của chính mình (sử dụng MaKH từ session)
 * @access  Private
 */
router.get('/my-bookings', authenticateToken, getMyBookings);

/**
 * @route   POST /api/bookings/hold
 * @desc    Đặt phòng và giữ chỗ
 * @access  Public
 */
router.post('/hold', optionalAuthenticationToken, holdBooking);

/**
 * @route   POST /api/bookings
 * @desc    Tạo đơn đặt phòng mới
 * @access  Private (không bắt buộc login, dùng token nếu có)
 */
router.post('/', optionalAuthenticationToken, createBooking);


/**
 * @route   GET /api/bookings/:MaDat
 * @desc    Lấy chi tiết một đơn đặt phòng
 * @access  Public (optional auth for security check)
 */
router.get('/:MaDat', optionalAuthenticationToken, getBookingById);

/**
 * @route   PUT /api/bookings/:MaDat
 * @desc    Hủy đơn đặt phòng
 * @access  Private
 */
router.put('/:MaDat', authenticateToken, cancelBooking);

/**
 * @route   GET /api/bookings/:MaDat/price
 * @desc    Tính giá đặt phòng (phòng, dịch vụ, ưu đãi)
 * @access  Private
 */
router.get('/:MaDat/price', authenticateToken, calculatePrice);

/**
 * @route   POST /api/bookings/:MaDat/confirmations
 * @desc    Gửi email xác nhận đặt phòng
 * @access  Private
 */
router.post('/:MaDat/confirmations', authenticateToken, sendBookingConfirmation);

/**
 * @route   PUT /api/bookings/:MaDat/check-in
 * @desc    Check-in đơn đặt phòng
 * @access  Admin Only
 */
router.put('/:MaDat/check-in', authenticateToken, isAdmin, checkIn);

/**
 * @route   PUT /api/bookings/:MaDat/check-out
 * @desc    Check-out đơn đặt phòng
 * @access  Admin Only
 */
router.put('/:MaDat/check-out', authenticateToken, isAdmin, checkOut);

/**
 * @route   PUT /api/bookings/:MaDat/details
 * @desc    Cập nhật thông tin khách và dịch vụ
 * @access  Public (token optional)
 */
router.put('/:MaDat/details', optionalAuthenticationToken, updateBookingDetails);

/**
 * @route   PUT /api/bookings/:MaDat/confirm
 * @desc    Xác nhận và hoàn tất đặt phòng
 * @access  Public (token optional)
 */
router.put('/:MaDat/confirm', optionalAuthenticationToken, confirmBooking);

module.exports = router;
