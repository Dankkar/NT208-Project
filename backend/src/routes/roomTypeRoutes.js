const express = require('express');
const router = express.Router();

const {
  createRoomType,
  getRoomTypesByHotel,
  updateRoomType,
  //deleteRoomType,
  compareRoomTypes,
  getRoomTypeById
} = require('../controllers/roomTypeController');
const { authenticateToken, isAdmin, isStaff } = require('../middlewares/auth');

// -------- PUBLIC / SHARED ROUTES --------

// GET /roomTypes/compare/:typeId1/:typeId2 - So sánh 2 loại phòng theo param
router.get('/compare/:typeId1/:typeId2', compareRoomTypes);

// GET /roomTypes/compare?type1=...&type2=... - So sánh theo query
router.get('/compare', compareRoomTypes);

// GET /roomTypes/hotel/:MaKS - Lấy loại phòng theo khách sạn
router.get('/hotel/:MaKS', getRoomTypesByHotel);

// -------- ADMIN / STAFF ROUTES --------

// POST /roomTypes - Thêm loại phòng
router.post('/:MaKS', authenticateToken, isAdmin, createRoomType);

// GET /roomTypes/:id - Lấy loại phòng theo id
router.get('/:MaLoaiPhong', getRoomTypeById);

// PUT /roomTypes/:MaLoaiPhong - Cập nhật loại phòng
router.put('/:MaLoaiPhong', authenticateToken, isAdmin, updateRoomType);

// DELETE /roomTypes/:MaLoaiPhong - Xóa loại phòng
//router.delete('/:MaLoaiPhong', authenticateToken, isAdmin, deleteRoomType);

module.exports = router;