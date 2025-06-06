const express = require('express');
const router = express.Router();
const bedConfigController = require('../controllers/bedConfigController');

// Routes for bed configuration management

// GET /api/bed-configs - Lấy tất cả cấu hình giường
router.get('/', bedConfigController.getAllBedConfigs);

// GET /api/bed-configs/:MaCauHinhGiuong - Lấy cấu hình giường theo ID
router.get('/:MaCauHinhGiuong', bedConfigController.getBedConfigById);

module.exports = router; 