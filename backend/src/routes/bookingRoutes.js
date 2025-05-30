const express = require('express');
const router = express.Router();
const { 
    searchAvailableRooms,
    getAllBookings,
    getBookingByUser,
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
const { authenticateToken, isAdmin, isStaff, optionalAuthenticationToken } = require('../middlewares/auth');

/**
 * @route   POST /api/bookings/search
 * @desc    Kiểm tra phòng trống theo loại phòng và ngày
 * @access  Public
 */
router.post('/search', searchAvailableRooms);

/**
 * @route   GET /api/bookings/admin
 * @desc    Lấy danh sách đơn đặt phòng của tất cả khách hàng
 * @access  Private
 */
router.get('/admin', authenticateToken, isAdmin, getAllBookings);

/**
 * @route   GET /api/bookings/user/:MaKH
 * @desc    Lấy danh sách đơn đặt phòng của một khách hàng
 * @access  Private
 */
router.get('/user/:MaKH', authenticateToken, getBookingByUser);

/**
 * @route   POST /api/bookings
 * @desc    Tạo đơn đặt phòng mới
 * @access  Private
 */
router.post('/', optionalAuthenticationToken, createBooking);

/**
 * @route   POST /api/bookings/hold
 * @desc    Đặt phòng và giữ chỗ
 * @access  Public
 */
router.post('/hold', holdBooking);

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

/**
 * @route   PUT /api/bookings/:MaDat/check-in
 * @desc    Check-in đơn đặt phòng
 * @access  Private
 */
router.put('/:MaDat/check-in', authenticateToken, isStaff, checkIn);

// 3. USER booking
router.get('/user/:MaKH', authenticateToken, getBookingByUser);

// 4. CREATE / HOLD booking
router.post('/hold', authenticateToken, holdBooking);
router.post('/', authenticateToken, createBooking);

// 5. SUB-ROUTES FOR SPECIFIC BOOKING — đặt trước :MaDat
router.get('/:MaDat/price', authenticateToken, calculatePrice);
router.post('/:MaDat/confirmations', authenticateToken, sendBookingConfirmation);
router.put('/:MaDat/check-in', authenticateToken, isStaff, checkIn);
router.put('/:MaDat/check-out', authenticateToken, isStaff, checkOut);

/**
 * @route   PUT /api/bookings/:MaDat/details
 * @desc    Update booking with customer and service details
 * @access  Public
 */
router.put('/:MaDat/details', optionalAuthenticationToken, updateBookingDetails);

/**
 * @route   PUT /api/bookings/:MaDat/confirm
 * @desc    Confirm and finalize the booking
 * @access  Public
 */
router.put('/:MaDat/confirm', optionalAuthenticationToken, confirmBooking);

module.exports = router;