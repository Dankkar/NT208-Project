const express = require('express');
const router = express.Router();
const { processSimplePayment } = require('../controllers/simplePaymentController');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @route   POST /api/simple-payments/process
 * @desc    Process a simple payment (just validate and show booking info)
 * @access  Private
 */
router.post('/process', authenticateToken, processSimplePayment);

module.exports = router; 