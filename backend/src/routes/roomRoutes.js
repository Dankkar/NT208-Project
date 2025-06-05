const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// Routes for room management

// GET /api/rooms/hotel/:MaKS - Lấy danh sách phòng của khách sạn
router.get('/hotel/:MaKS', roomController.getRoomByHotel);

// GET /api/rooms/:MaPhong - Lấy thông tin chi tiết phòng
router.get('/:MaPhong', roomController.getRoomById);

// GET /api/rooms/roomtype/:MaLoaiPhong - Lấy phòng theo loại phòng
router.get('/roomtype/:MaLoaiPhong', roomController.getRoomsByRoomType);

// POST /api/rooms - Tạo phòng mới
router.post('/', roomController.createRoom);

// PUT /api/rooms/:MaPhong - Cập nhật thông tin phòng
router.put('/:MaPhong', roomController.updateRoom);

// PATCH /api/rooms/:MaPhong/status - Cập nhật trạng thái phòng
router.patch('/:MaPhong/status', roomController.updateRoomStatus);

// DELETE /api/rooms/:MaPhong - Xóa phòng (soft delete)
router.delete('/:MaPhong', roomController.deleteRoom);

module.exports = router;
