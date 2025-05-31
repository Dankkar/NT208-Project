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

// GET /services - Tất cả loại dịch vụ
router.get('/', getAllServices);

// GET /services/:MaDV
router.get('/:MaLoaiDV', getServiceById);

// GET /services/hotel/:MaKS - loại dịch vụ theo khách sạn
router.get('/hotel/:MaKS', getServicesByHotel);

// --------- BOOKING - liên quan đến đơn đặt loại dịch vụ ---------

// GET /services/booking/:MaDat - Lấy các loại dịch vụ đã đặt
router.get('/booking/:MaDat', authenticateToken, getBookingServices);

// POST /services/booking/:MaDat - Thêm loại dịch vụ vào đơn
router.post('/booking/:MaDat', authenticateToken, addServiceToBooking);

// DELETE /services/booking/:MaDat/:MaDV - Gỡ loại dịch vụ khỏi đơn
router.delete('/booking/:MaDat/:MaDV', authenticateToken, removeServiceFromBooking);

// --------- ADMIN/STAFF ONLY ---------

// POST /services - Tạo loại dịch vụ
router.post('/:MaKS', authenticateToken, isAdmin, createService);

// PUT /services/:MaDV - Cập nhật loại dịch vụ
router.put('/:MaLoaiDV', authenticateToken, isAdmin, updateService);

// DELETE /services/:MaDV - Xóa loại dịch vụ
router.delete('/:MaLoaiDV', authenticateToken, isAdmin, deleteService);

module.exports = router;