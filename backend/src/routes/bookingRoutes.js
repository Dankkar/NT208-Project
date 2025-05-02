//backend/src/routes/bookingRoutes.js

const express = require('express');
const router = express.Router();

const {
    createBooking,
    getBookingById,
    cancelBooking,
    getBookingsByUser
} = require('../controllers/bookingController');

router.post('/', createBooking)
router.get('/user/:MaKH', getBookingsByUser);
router.get('/:MaDat', getBookingById);
router.put('/:MaDat/cancel', cancelBooking);

module.exports = router;