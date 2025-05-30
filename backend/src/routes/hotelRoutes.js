const express = require('express');
const { check } = require('express-validator');
const {
  createHotel,
  updateHotel,
  deleteHotel,
  getHotelsByNguoiQuanLy,
  getHotelById,
  getAllHotels,
  getFeaturedHotels,
  suggestLocations,
  getBasicHotelListForAdmin
} = require('../controllers/hotelController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const { LocationSuggestLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// ----------- PUBLIC ROUTES (NO AUTH) -----------

// GET /hotels/featured - danh sách nổi bật
router.get('/featured', getFeaturedHotels);

// GET /hotels/suggest-locations - gợi ý địa điểm
router.get('/suggest-locations', LocationSuggestLimiter, suggestLocations);

// GET /hotels - tất cả khách sạn
router.get('/', getAllHotels);

// ----------- ADMIN ROUTES (PRIVATE) -----------
// GET /hotels/nguoi-quan-ly/:MaKH - khách sạn theo người quản lý
router.get('/nguoi-quan-ly/:MaKH', authenticateToken, isAdmin, getHotelsByNguoiQuanLy);

// POST /hotels - thêm mới khách sạn
router.post(
  '/',
  authenticateToken,
  isAdmin,
  [
    check('TenKS', 'Tên khách sạn không được để trống').notEmpty(),
    check('DiaChi', 'Địa chỉ không được để trống').notEmpty(),
    check('HangSao', 'Hạng sao không được để trống').notEmpty(),
    check('LoaiHinh', 'Loại hình không được để trống').notEmpty(),
    check('MoTaCoSoVatChat', 'Mô tả cơ sở vật chất không được để trống').notEmpty(),
    check('QuyDinh', 'Quy định không được để trống').notEmpty()
  ],
  createHotel
);

// PUT /hotels/:MaKS - cập nhật
router.put('/:MaKS', authenticateToken, isAdmin, updateHotel);

// // DELETE /hotels/:MaKS - xóa
// router.delete('/:MaKS', authenticateToken, isAdmin, deleteHotel);

// GET /hotels/list-basic - danh sách khách sạn (admin)
router.get('/list-basic', authenticateToken, isAdmin, getBasicHotelListForAdmin);

// GET /hotels/:MaKS - chi tiết khách sạn
router.get('/:MaKS', getHotelById);

module.exports = router;