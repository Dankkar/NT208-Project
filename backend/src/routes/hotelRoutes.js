// Routes xử lý các chức năng quản lý khách sạn
const express = require('express');
const { check } = require('express-validator'); // Validation middleware

// Import các controller xử lý logic khách sạn
const {
  createHotel,                    // Tạo khách sạn mới
  updateHotel,                    // Cập nhật thông tin khách sạn
  // deleteHotel,                 // Xóa khách sạn (đã comment)
  getHotelsByNguoiQuanLy,        // Lấy khách sạn theo người quản lý
  getHotelById,                   // Lấy chi tiết khách sạn
  getAllHotels,                   // Lấy tất cả khách sạn
  getFeaturedHotels,              // Lấy khách sạn nổi bật
  suggestLocations,               // Gợi ý địa điểm
  getBasicHotelListForAdmin,      // Danh sách cơ bản cho admin
  searchAvailableHotels,          // Tìm kiếm khách sạn có phòng trống
  assignManager,                  // Gán người quản lý cho khách sạn
  getAvailableManagers,           // Lấy danh sách người có thể làm quản lý
  getHotelWithImages,             // Lấy khách sạn với tất cả ảnh
  setMainImage,                   // Đặt ảnh chính
  deleteHotelImage,               // Xóa ảnh khách sạn
  updateHotelImage,               // Cập nhật thông tin ảnh
  uploadHotelWithImages           // Upload ảnh kèm cập nhật khách sạn
} = require('../controllers/hotelController');

// Import middleware xác thực và phân quyền
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const { LocationSuggestLimiter } = require('../middlewares/rateLimiter'); // Rate limiting cho gợi ý địa điểm
const { uploadHotelImages, uploadHotelImagesCreate } = require('../middlewares/upload'); // Upload ảnh

const router = express.Router();

// =========== ROUTES CÔNG KHAI (KHÔNG CẦN XÁC THỰC) ===========

/**
 * @route   GET /api/hotels/featured
 * @desc    Lấy danh sách khách sạn nổi bật (để hiển thị trên trang chủ)
 * @access  Public
 * @returns {Array} Danh sách khách sạn được đánh dấu là nổi bật
 */
router.get('/featured', getFeaturedHotels);

/**
 * @route   GET /api/hotels/suggest-locations
 * @desc    Gợi ý địa điểm dựa trên từ khóa tìm kiếm (autocomplete)
 * @access  Public (có rate limiting để tránh spam)
 * @query   {string} query - Từ khóa tìm kiếm địa điểm
 * @returns {Array} Danh sách địa điểm gợi ý
 */
router.get('/suggest-locations', LocationSuggestLimiter, suggestLocations);

/**
 * @route   GET /api/hotels/list-basic
 * @desc    Lấy danh sách cơ bản tất cả khách sạn (dành cho admin quản lý)
 * @access  Private (chỉ Admin)
 * @returns {Array} Danh sách khách sạn với thông tin cơ bản
 */
router.get('/list-basic', authenticateToken, isAdmin, getBasicHotelListForAdmin);

/**
 * @route   GET /api/hotels
 * @desc    Lấy tất cả khách sạn với thông tin đầy đủ
 * @access  Public
 * @query   {number} page - Số trang (pagination)
 * @query   {number} limit - Số lượng mỗi trang
 * @returns {Object} Danh sách khách sạn với thông tin pagination
 */
router.get('/', getAllHotels);

/**
 * @route   POST /api/hotels/search
 * @desc    Tìm kiếm khách sạn có phòng trống theo tiêu chí
 * @access  Public
 * @body    {Object} Tiêu chí tìm kiếm: địa điểm, ngày, số người, số phòng
 * @returns {Array} Danh sách khách sạn phù hợp với phòng trống
 */
router.post('/search', searchAvailableHotels);

/**
 * @route   GET /api/hotels/:MaKS
 * @desc    Lấy chi tiết một khách sạn theo mã khách sạn
 * @access  Public
 * @param   {number} MaKS - Mã khách sạn cần xem chi tiết
 * @returns {Object} Thông tin chi tiết khách sạn bao gồm ảnh, dịch vụ, đánh giá
 */
router.get('/:MaKS', getHotelById);

// =========== ROUTES ADMIN (CẦN XÁC THỰC VÀ QUYỀN ADMIN) ===========
/**
 * @route   GET /api/hotels/nguoi-quan-ly/:MaKH
 * @desc    Lấy danh sách khách sạn được quản lý bởi một người cụ thể
 * @access  Private (chỉ Admin)
 * @param   {number} MaKH - Mã khách hàng (người quản lý)
 * @returns {Array} Danh sách khách sạn do người đó quản lý
 */
router.get('/nguoi-quan-ly/:MaKH', authenticateToken, isAdmin, getHotelsByNguoiQuanLy);

/**
 * @route   GET /api/hotels/available-managers
 * @desc    Lấy danh sách những người có thể được gán làm quản lý khách sạn
 * @access  Private (chỉ Admin)
 * @returns {Array} Danh sách user có role QuanLyKS và chưa quản lý khách sạn nào
 */
router.get('/available-managers', authenticateToken, isAdmin, getAvailableManagers);

/**
 * @route   POST /api/hotels
 * @desc    Tạo khách sạn mới (có thể kèm upload ảnh)
 * @access  Private (chỉ Admin)
 * @body    {Object} Thông tin khách sạn: tên, địa chỉ, hạng sao, mô tả, quy định
 * @files   {Array} images - Danh sách ảnh khách sạn (tối đa 10 ảnh)
 * @returns {Object} Khách sạn vừa tạo với ID mới
 */
router.post(
  '/',
  authenticateToken,                              // Yêu cầu đăng nhập
  isAdmin,                                        // Yêu cầu quyền Admin
  uploadHotelImagesCreate.array('images', 10),    // Middleware upload ảnh (tối đa 10)
  [
    // Validation rules cho các trường bắt buộc
    check('TenKS', 'Tên khách sạn không được để trống').notEmpty(),
    check('DiaChi', 'Địa chỉ không được để trống').notEmpty(),
    check('HangSao', 'Hạng sao không được để trống').notEmpty(),
    check('LoaiHinh', 'Loại hình không được để trống').notEmpty(),
    check('MoTaCoSoVatChat', 'Mô tả cơ sở vật chất không được để trống').notEmpty(),
    check('QuyDinh', 'Quy định không được để trống').notEmpty()
  ],
  createHotel // Controller xử lý tạo khách sạn
);

/**
 * @route   PUT /api/hotels/:MaKS
 * @desc    Cập nhật thông tin khách sạn (có thể kèm upload ảnh mới)
 * @access  Private (chỉ Admin)
 * @param   {number} MaKS - Mã khách sạn cần cập nhật
 * @body    {Object} Thông tin cần cập nhật
 * @files   {Array} images - Ảnh mới cần thêm (tùy chọn)
 * @returns {Object} Khách sạn đã được cập nhật
 */
router.put(
  '/:MaKS', 
  authenticateToken,                           // Yêu cầu đăng nhập
  isAdmin,                                     // Yêu cầu quyền Admin
  uploadHotelImages.array('images', 10),       // Middleware upload ảnh (tùy chọn)
  updateHotel                                  // Controller xử lý cập nhật
);

// DELETE /hotels/:MaKS - xóa khách sạn (đã comment vì có thể ảnh hưởng đến data integrity)
// router.delete('/:MaKS', authenticateToken, isAdmin, deleteHotel);

/**
 * @route   PUT /api/hotels/:MaKS/manager
 * @desc    Gán hoặc gỡ người quản lý cho khách sạn
 * @access  Private (chỉ Admin)
 * @param   {number} MaKS - Mã khách sạn
 * @body    {number} MaKH - Mã người quản lý (null để gỡ)
 * @returns {Object} Kết quả gán/gỡ quản lý
 */
router.put('/:MaKS/manager', authenticateToken, isAdmin, assignManager);

// =========== ROUTES QUẢN LÝ ẢNH KHÁCH SẠN ===========

/**
 * @route   GET /api/hotels/:MaKS/images
 * @desc    Lấy thông tin khách sạn kèm tất cả ảnh (cho admin quản lý ảnh)
 * @access  Private (chỉ Admin)
 * @param   {number} MaKS - Mã khách sạn
 * @returns {Object} Khách sạn với danh sách đầy đủ ảnh và metadata
 */
router.get('/:MaKS/images', authenticateToken, isAdmin, getHotelWithImages);

/**
 * @route   PUT /api/hotels/:MaKS/upload-images
 * @desc    Upload thêm ảnh mới cho khách sạn
 * @access  Private (chỉ Admin)
 * @param   {number} MaKS - Mã khách sạn
 * @files   {Array} images - Danh sách ảnh mới (tối đa 10)
 * @returns {Object} Khách sạn với ảnh đã được thêm
 */
router.put(
  '/:MaKS/upload-images',
  authenticateToken,                           // Yêu cầu đăng nhập
  isAdmin,                                     // Yêu cầu quyền Admin
  uploadHotelImages.array('images', 10),       // Middleware upload (tối đa 10 ảnh)
  uploadHotelWithImages                        // Controller xử lý upload
);

/**
 * @route   PUT /api/hotels/images/:MaAnh/set-main
 * @desc    Đặt một ảnh làm ảnh chính (thumbnail) của khách sạn
 * @access  Private (chỉ Admin)
 * @param   {number} MaAnh - Mã ảnh cần đặt làm ảnh chính
 * @returns {Object} Kết quả cập nhật ảnh chính
 */
router.put('/images/:MaAnh/set-main', authenticateToken, isAdmin, setMainImage);

/**
 * @route   DELETE /api/hotels/images/:MaAnh
 * @desc    Xóa một ảnh khỏi khách sạn
 * @access  Private (chỉ Admin)
 * @param   {number} MaAnh - Mã ảnh cần xóa
 * @returns {Object} Kết quả xóa ảnh
 */
router.delete('/images/:MaAnh', authenticateToken, isAdmin, deleteHotelImage);

/**
 * @route   PUT /api/hotels/images/:MaAnh
 * @desc    Cập nhật thông tin mô tả của một ảnh
 * @access  Private (chỉ Admin)
 * @param   {number} MaAnh - Mã ảnh cần cập nhật
 * @body    {string} MoTa - Mô tả mới cho ảnh
 * @returns {Object} Ảnh đã được cập nhật thông tin
 */
router.put('/images/:MaAnh', authenticateToken, isAdmin, updateHotelImage);

// Export router để sử dụng trong app chính
module.exports = router;