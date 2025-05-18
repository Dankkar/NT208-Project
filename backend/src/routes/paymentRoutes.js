const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { createPaymentUrl, vnpayIpn } = require('../controllers/paymentController');

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

module.exports = router; 