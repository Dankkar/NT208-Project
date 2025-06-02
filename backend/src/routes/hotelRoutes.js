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
  getBasicHotelListForAdmin,
  searchAvailableHotels,
  assignManager,
  getAvailableManagers,
  getHotelWithImages,
  setMainImage,
  deleteHotelImage,
  updateHotelImage,
  uploadHotelWithImages
} = require('../controllers/hotelController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const { LocationSuggestLimiter } = require('../middlewares/rateLimiter');
const { uploadHotelImages } = require('../middlewares/upload');
const router = express.Router();

// ----------- PUBLIC ROUTES (NO AUTH) -----------

// GET /hotels/featured - danh sách nổi bật
router.get('/featured', getFeaturedHotels);

// GET /hotels/suggest-locations - gợi ý địa điểm
router.get('/suggest-locations', LocationSuggestLimiter, suggestLocations);

// GET /hotels - tất cả khách sạn
router.get('/', getAllHotels);

// POST /hotels/search - tìm kiếm khách sạn
router.post('/search', searchAvailableHotels);

// GET /hotels/:MaKS - chi tiết khách sạn
router.get('/:MaKS', getHotelById);

// ----------- ADMIN ROUTES (PRIVATE) -----------

// GET /hotels/list-basic - danh sách khách sạn cơ bản (admin)
router.get('/list-basic', authenticateToken, isAdmin, getBasicHotelListForAdmin);

// GET /hotels/nguoi-quan-ly/:MaKH - khách sạn theo người quản lý
router.get('/nguoi-quan-ly/:MaKH', authenticateToken, isAdmin, getHotelsByNguoiQuanLy);

// GET /hotels/available-managers - danh sách người có thể làm quản lý
router.get('/available-managers', authenticateToken, isAdmin, getAvailableManagers);

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

// PUT /hotels/:MaKS - cập nhật khách sạn (không có ảnh)
router.put('/:MaKS', authenticateToken, isAdmin, updateHotel);

// DELETE /hotels/:MaKS - xóa khách sạn (nếu cần)
// router.delete('/:MaKS', authenticateToken, isAdmin, deleteHotel);

// PUT /hotels/:MaKS/manager - gán/gỡ người quản lý
router.put('/:MaKS/manager', authenticateToken, isAdmin, assignManager);

// ----------- IMAGE MANAGEMENT ROUTES -----------

// GET /hotels/:MaKS/images - lấy khách sạn với tất cả ảnh
router.get('/:MaKS/images', authenticateToken, isAdmin, getHotelWithImages);

// PUT /hotels/:MaKS/upload-images - cập nhật khách sạn và upload ảnh
router.put(
  '/:MaKS/upload-images',
  authenticateToken,
  isAdmin,
  uploadHotelImages.array('images', 10), // Tối đa 10 ảnh
  uploadHotelWithImages
);

// PUT /hotels/images/:MaAnh/set-main - đặt ảnh làm ảnh chính
router.put('/images/:MaAnh/set-main', authenticateToken, isAdmin, setMainImage);

// DELETE /hotels/images/:MaAnh - xóa ảnh khách sạn
router.delete('/images/:MaAnh', authenticateToken, isAdmin, deleteHotelImage);

// PUT /hotels/images/:MaAnh - cập nhật thông tin ảnh
router.put('/images/:MaAnh', authenticateToken, isAdmin, updateHotelImage);

module.exports = router;