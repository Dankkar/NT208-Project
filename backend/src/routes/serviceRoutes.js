const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin, isStaff } = require('../middlewares/auth');
const {
  getAllServices,
  getServiceById,
  getServicesByHotel,
  createService,
  updateService,
  deleteService,
  addServiceToBooking,
  removeServiceFromBooking,
  getBookingServices
} = require('../controllers/serviceController');

// --------- PUBLIC ROUTES ---------

// GET /services - Tất cả dịch vụ
router.get('/', getAllServices);

// GET /services/hotel/:MaKS - Dịch vụ theo khách sạn
router.get('/hotel/:MaKS', getServicesByHotel);

// --------- BOOKING - liên quan đến đơn đặt dịch vụ ---------

// GET /services/booking/:MaDat - Lấy các dịch vụ đã đặt
router.get('/booking/:MaDat', authenticateToken, getBookingServices);

// POST /services/booking/:MaDat - Thêm dịch vụ vào đơn
router.post('/booking/:MaDat', authenticateToken, addServiceToBooking);

// DELETE /services/booking/:MaDat/:MaDV - Gỡ dịch vụ khỏi đơn
router.delete('/booking/:MaDat/:MaDV', authenticateToken, removeServiceFromBooking);

// --------- ADMIN/STAFF ONLY ---------

// POST /services - Tạo dịch vụ
router.post('/', authenticateToken, isAdmin, createService);

// PUT /services/:MaDV - Cập nhật dịch vụ
router.put('/:MaDV', authenticateToken, isAdmin, updateService);

// DELETE /services/:MaDV - Xóa dịch vụ
router.delete('/:MaDV', authenticateToken, isAdmin, deleteService);

// --------- ĐỂ CUỐI: GET /services/:MaDV ---------
router.get('/:MaDV', getServiceById);

module.exports = router;