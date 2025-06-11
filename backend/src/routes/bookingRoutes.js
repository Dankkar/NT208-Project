// Routes xử lý các chức năng đặt phòng
const express = require('express');
const router = express.Router();

// Import các controller xử lý logic đặt phòng
const { 
    searchAvailableRooms,      // Tìm kiếm phòng trống
    getAllBookings,            // Lấy tất cả booking (admin)
    getBookingByUser,          // Lấy booking theo user (admin)
    getMyBookings,             // Lấy booking của chính mình
    holdBooking,               // Giữ chỗ phòng tạm thời
    createBooking,             // Tạo booking mới
    calculatePrice,            // Tính toán giá phòng
    sendBookingConfirmation,   // Gửi email xác nhận
    checkIn,                   // Check-in
    checkOut,                  // Check-out
    getBookingById,            // Lấy chi tiết booking
    cancelBooking,             // Hủy booking
    updateBookingDetails,      // Cập nhật thông tin booking
    confirmBooking,            // Xác nhận booking
} = require('../controllers/bookingController');

// Import middleware xác thực và phân quyền
const { authenticateToken, isAdmin, optionalAuthenticationToken } = require('../middlewares/auth');

/**
 * @route   GET /api/bookings/search
 * @desc    Tìm kiếm phòng trống theo loại phòng và khoảng thời gian
 * @access  Public (không cần đăng nhập)
 * @query   {number} MaLoaiPhong - Mã loại phòng cần tìm
 * @query   {date} NgayNhanPhong - Ngày nhận phòng (YYYY-MM-DD)
 * @query   {date} NgayTraPhong - Ngày trả phòng (YYYY-MM-DD)
 * @query   {number} SoLuongPhong - Số lượng phòng cần đặt
 */
router.get('/search', searchAvailableRooms);

/**
 * @route   GET /api/bookings/admin
 * @desc    Lấy danh sách tất cả đơn đặt phòng trong hệ thống
 * @access  Private (chỉ Admin)
 * @returns {Array} Danh sách tất cả booking với thông tin chi tiết
 */
router.get('/admin', authenticateToken, isAdmin, getAllBookings);

/**
 * @route   GET /api/bookings/user/:MaKH
 * @desc    Lấy danh sách đơn đặt phòng của một khách hàng cụ thể
 * @access  Private (chỉ Admin/QuanLyKS)
 * @param   {number} MaKH - Mã khách hàng cần xem booking
 * @returns {Array} Danh sách booking của khách hàng đó
 */
router.get('/user/:MaKH', authenticateToken, isAdmin, getBookingByUser);

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Lấy danh sách đơn đặt phòng của chính mình (từ token/session)
 * @access  Private (cần đăng nhập)
 * @returns {Array} Danh sách booking của user hiện tại
 */
router.get('/my-bookings', authenticateToken, getMyBookings);

/**
 * @route   POST /api/bookings/hold
 * @desc    Tạo booking tạm thời để giữ chỗ (15 phút)
 * @access  Public (không cần đăng nhập, cho guest user)
 * @body    {Object} Thông tin phòng, ngày, số lượng
 * @returns {Object} Thông tin booking tạm với thời gian hết hạn
 */
router.post('/hold',optionalAuthenticationToken, holdBooking);

/**
 * @route   POST /api/bookings
 * @desc    Tạo đơn đặt phòng chính thức (sau khi đã hold)
 * @access  Public (có thể dùng token hoặc guest, tùy chọn)
 * @body    {Object} Thông tin đầy đủ: khách hàng, phòng, dịch vụ, thanh toán
 * @returns {Object} Booking đã tạo với mã đặt phòng
 */
router.post('/', optionalAuthenticationToken, createBooking);

/**
 * @route   GET /api/bookings/:MaDat
 * @desc    Lấy chi tiết một đơn đặt phòng theo mã đặt
 * @access  Public (có thể kiểm tra thêm quyền sở hữu nếu có token)
 * @param   {number} MaDat - Mã đặt phòng cần xem chi tiết
 * @returns {Object} Thông tin chi tiết đầy đủ của booking
 */
router.get('/:MaDat', optionalAuthenticationToken, getBookingById);

/**
 * @route   PUT /api/bookings/:MaDat
 * @desc    Hủy đơn đặt phòng
 * @access  Private (cần đăng nhập và kiểm tra quyền sở hữu)
 * @param   {number} MaDat - Mã đặt phòng cần hủy
 * @body    {string} LyDoHuy - Lý do hủy booking
 * @returns {Object} Kết quả hủy booking
 */
router.put('/:MaDat', authenticateToken, cancelBooking);

/**
 * @route   GET /api/bookings/:MaDat/price
 * @desc    Tính toán lại giá đặt phòng (bao gồm phòng, dịch vụ, khuyến mãi, VAT)
 * @access  Private (cần đăng nhập)
 * @param   {number} MaDat - Mã đặt phòng cần tính giá
 * @returns {Object} Chi tiết breakdown giá từng phần
 */
router.get('/:MaDat/price', authenticateToken, calculatePrice);

/**
 * @route   POST /api/bookings/:MaDat/confirmations
 * @desc    Gửi email xác nhận đặt phòng cho khách hàng
 * @access  Private (cần đăng nhập)
 * @param   {number} MaDat - Mã đặt phòng cần gửi email
 * @returns {Object} Kết quả gửi email
 */
router.post('/:MaDat/confirmations', authenticateToken, sendBookingConfirmation);

/**
 * @route   PUT /api/bookings/:MaDat/check-in
 * @desc    Thực hiện check-in cho khách hàng (tại quầy lễ tân)
 * @access  Private (chỉ Admin/Staff)
 * @param   {number} MaDat - Mã đặt phòng cần check-in
 * @body    {Object} Thông tin bổ sung nếu cần
 * @returns {Object} Kết quả check-in
 */
router.put('/:MaDat/check-in', authenticateToken, isAdmin, checkIn);

/**
 * @route   PUT /api/bookings/:MaDat/check-out
 * @desc    Thực hiện check-out cho khách hàng (tại quầy lễ tân)
 * @access  Private (chỉ Admin/Staff)
 * @param   {number} MaDat - Mã đặt phòng cần check-out
 * @body    {Object} Thông tin thanh toán bổ sung nếu có
 * @returns {Object} Kết quả check-out và hóa đơn cuối cùng
 */
router.put('/:MaDat/check-out', authenticateToken, isAdmin, checkOut);

/**
 * @route   PUT /api/bookings/:MaDat/details
 * @desc    Cập nhật thông tin khách hàng và dịch vụ của booking
 * @access  Public (có thể dùng token để kiểm tra quyền, không bắt buộc)
 * @param   {number} MaDat - Mã đặt phòng cần cập nhật
 * @body    {Object} Thông tin khách hàng và dịch vụ mới
 * @returns {Object} Booking đã được cập nhật
 */
router.put('/:MaDat/details', optionalAuthenticationToken, updateBookingDetails);

/**
 * @route   PUT /api/bookings/:MaDat/confirm
 * @desc    Xác nhận và hoàn tất đặt phòng (bước cuối của quy trình booking)
 * @access  Public (có thể dùng token để kiểm tra, không bắt buộc)
 * @param   {number} MaDat - Mã đặt phòng cần xác nhận
 * @body    {Object} Thông tin thanh toán và xác nhận cuối cùng
 * @returns {Object} Booking đã được xác nhận với trạng thái "Đã xác nhận"
 */
router.put('/:MaDat/confirm', optionalAuthenticationToken, confirmBooking);

// Export router để sử dụng trong app chính
module.exports = router;
