// Routes xử lý các chức năng quản lý phòng
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController'); // Import controller xử lý logic phòng

// =========== ROUTES QUẢN LÝ PHÒNG ===========

/**
 * @route   GET /api/rooms/hotel/:MaKS
 * @desc    Lấy danh sách tất cả phòng thuộc một khách sạn cụ thể
 * @access  Public/Private (tùy theo business logic)
 * @param   {number} MaKS - Mã khách sạn cần lấy danh sách phòng
 * @returns {Array} Danh sách phòng với thông tin chi tiết: số phòng, loại, trạng thái
 */
router.get('/hotel/:MaKS', roomController.getRoomByHotel);

/**
 * @route   GET /api/rooms/:MaPhong
 * @desc    Lấy thông tin chi tiết của một phòng cụ thể
 * @access  Public/Private (tùy theo business logic)
 * @param   {number} MaPhong - Mã phòng cần xem chi tiết
 * @returns {Object} Thông tin đầy đủ của phòng: số phòng, loại, trang thiết bị, trạng thái
 */
router.get('/:MaPhong', roomController.getRoomById);

/**
 * @route   GET /api/rooms/roomtype/:MaLoaiPhong
 * @desc    Lấy danh sách tất cả phòng thuộc một loại phòng cụ thể
 * @access  Public/Private (tùy theo business logic)
 * @param   {number} MaLoaiPhong - Mã loại phòng cần lấy danh sách
 * @returns {Array} Danh sách phòng cùng loại với thông tin trạng thái
 */
router.get('/roomtype/:MaLoaiPhong', roomController.getRoomsByRoomType);

/**
 * @route   POST /api/rooms
 * @desc    Tạo phòng mới trong hệ thống
 * @access  Private (chỉ Admin/QuanLyKS)
 * @body    {Object} Thông tin phòng: MaKS, MaLoaiPhong, SoPhong, MoTaTrangThietBi
 * @returns {Object} Thông tin phòng vừa được tạo
 */
router.post('/', roomController.createRoom);

/**
 * @route   PUT /api/rooms/:MaPhong
 * @desc    Cập nhật thông tin phòng (mô tả, trang thiết bị, v.v.)
 * @access  Private (chỉ Admin/QuanLyKS)
 * @param   {number} MaPhong - Mã phòng cần cập nhật
 * @body    {Object} Thông tin cần cập nhật
 * @returns {Object} Thông tin phòng đã được cập nhật
 */
router.put('/:MaPhong', roomController.updateRoom);

/**
 * @route   PATCH /api/rooms/:MaPhong/status
 * @desc    Cập nhật trạng thái phòng (Trống, Đang sử dụng, Bảo trì, v.v.)
 * @access  Private (chỉ Admin/Staff)
 * @param   {number} MaPhong - Mã phòng cần cập nhật trạng thái
 * @body    {Object} { TrangThai: "Trống|Đang sử dụng|Bảo trì|Đã đặt" }
 * @returns {Object} Kết quả cập nhật trạng thái
 */
router.patch('/:MaPhong/status', roomController.updateRoomStatus);

/**
 * @route   DELETE /api/rooms/:MaPhong
 * @desc    Xóa phòng khỏi hệ thống (soft delete để giữ lịch sử)
 * @access  Private (chỉ Admin)
 * @param   {number} MaPhong - Mã phòng cần xóa
 * @returns {Object} Kết quả xóa phòng
 * @note    Thường sử dụng soft delete để không ảnh hưởng đến dữ liệu booking cũ
 */
router.delete('/:MaPhong', roomController.deleteRoom);

// Export router để sử dụng trong app chính
module.exports = router;
