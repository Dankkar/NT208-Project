const express = require('express');
const router = express.Router();
const { 
    searchAvailableRooms,
    suggestAlternativeDates,
    getAllBookings,
    getBookingByUser,
    holdBooking,
    createBooking,
    calculatePrice,
    sendBookingConfirmation,
    checkIn,
    checkOut,
    getBookingById,
    cancelBooking
} = require('../controllers/bookingController');
const { authenticateToken, isAdmin, isStaff } = require('../middlewares/auth');

// 1. PUBLIC
router.get('/search', searchAvailableRooms);
router.post('/suggest-dates', suggestAlternativeDates);

// 2. ADMIN / STAFF
router.get('/admin', authenticateToken, isAdmin, getAllBookings);

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

// 6. MAIN ROUTE BY ID — đặt sau tất cả cụ thể hơn
router.get('/:MaDat', authenticateToken, getBookingById);
router.put('/:MaDat', authenticateToken, cancelBooking);

module.exports = router;