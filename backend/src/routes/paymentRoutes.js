const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { createPaymentUrl, vnpayIpn, getPaymentDetails, getPaymentHistory } = require('../controllers/paymentController');

/**
 * @route   POST /api/payments/create-payment-url
 * @desc    Create VNPay payment URL
 * @access  Private
 */
router.post('/create-payment-url', authenticateToken, createPaymentUrl);

/**
 * @route   POST /api/payments/vnpay-ipn
 * @desc    VNPay IPN (Instant Payment Notification) endpoint
 * @access  Public
 */
router.post('/vnpay-ipn', vnpayIpn);

/**
 * @route   GET /api/payments/details/:MaHD
 * @desc    Get detailed information of a specific payment (invoice) by MaHD
 * @access  Private (should use token to verify owner if needed)
 */
router.get('/details/:MaHD', getPaymentDetails);

/**
 * @route   GET /api/payments/history/:MaKH
 * @desc    Get payment history of a customer by MaKH (Customer ID)
 * @access  Private (should be protected to ensure only the correct user or admin can view)
 */
router.get('/history/:MaKH', getPaymentHistory);

module.exports = router; 