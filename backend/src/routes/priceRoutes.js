const express = require('express');
const router = express.Router();
const { calculateTotalPrice } = require('../controllers/priceController');

// POST /api/prices/calculate
router.post('/calculate', calculateTotalPrice);

module.exports = router; 