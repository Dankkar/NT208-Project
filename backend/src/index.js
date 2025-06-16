//backend/src/index.js
// Tải cấu hình biến môi trường từ file .env
require('dotenv').config();
const { initBookingCleanupJob } = require('./services/bookingCleanupService');
const path = require('path');

// Khởi tạo ứng dụng Express
const express = require('express');
const app = express();

// Middleware xử lý session
const session = require('express-session');

// Cấu hình session - sử dụng MemoryStore (mặc định)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Khóa bí mật để ký session
    resave: false, // Không lưu session nếu không có thay đổi
    saveUninitialized: false, // Chỉ tạo session khi có data để lưu
    genid: function(req) {
        // Tạo ID session duy nhất bằng timestamp và random
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    cookie: {
        secure: false, // Đặt false cho phát triển localhost
        httpOnly: true, // Cookie chỉ có thể truy cập qua HTTP, không qua JavaScript
        maxAge: 24 * 60 * 60 * 1000, // Thời gian sống 24 giờ
        sameSite: 'lax' // Thuộc tính SameSite cho cross-origin requests
    }
}));

// Middleware xử lý cookies và CORS
const cors = require('cors');
const cookieParser = require('cookie-parser');  
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Dynamic CORS origin
  credentials: true               // ✅ Cho phép gửi cookie
}));
app.use(express.urlencoded({ extended: true })); // ✅ Đọc URL-encoded body
app.use(cookieParser());          // ✅ Đặt TRƯỚC các route cần đọc cookie
app.use(express.json());          // ✅ Đọc JSON body

// Cấu hình CORS để cho phép frontend truy cập
app.use(cors({
  origin: 'http://localhost:3000', // URL của frontend
  credentials: true               // Cho phép gửi cookie trong request
}));

// Middleware xử lý dữ liệu request
app.use(express.urlencoded({ extended: true })); // Đọc URL-encoded body (form data)
app.use(cookieParser());          // Đặt TRƯỚC các route cần đọc cookie
app.use(express.json());          // Đọc JSON body từ request

// Cung cấp file tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware logging để theo dõi request
app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.url}`);
  console.log('Session ID:', req.session?.id);
  console.log('Cookies:', Object.keys(req.cookies || {}).join(', '));
  next(); // Chuyển sang middleware tiếp theo
});

// Import các route handlers
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes')
const hotelRoutes = require('./routes/hotelRoutes');
const roomTypeRoutes = require('./routes/roomTypeRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bedConfigRoutes = require('./routes/bedConfigRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const simplePaymentRoutes = require('./routes/simplePaymentRoutes');
const mapRoutes = require('./routes/mapRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const priceRoutes = require('./routes/priceRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const promotionRoutes = require('./routes/promotionRoutes');

// Đăng ký các route với prefix tương ứng
app.use('/api/auth', authRoutes);           // Route xác thực người dùng
app.use('/api/bookings', bookingRoutes);   // Route quản lý đặt phòng
app.use('/api/hotels', hotelRoutes);       // Route quản lý khách sạn
app.use('/api/roomTypes', roomTypeRoutes); // Route quản lý loại phòng
app.use('/api/rooms', roomRoutes);         // Route quản lý phòng
app.use('/api/bed-configs', bedConfigRoutes); // Route cấu hình giường
app.use('/api/admin', adminRoutes);        // Route dành cho admin
app.use('/api/users', userRoutes);         // Route quản lý người dùng
app.use('/api/payments', paymentRoutes);   // Route xử lý thanh toán
app.use('/api/simple-payments', simplePaymentRoutes); // Route thanh toán đơn giản
app.use('/api/maps', mapRoutes);           // Route xử lý bản đồ
app.use('/api/reviews', reviewRoutes);     // Route quản lý đánh giá
app.use('/api/prices', priceRoutes);       // Route quản lý giá
app.use('/api/services', serviceRoutes);   // Route quản lý dịch vụ
app.use('/api/promotions', promotionRoutes); // Route quản lý khuyến mãi

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
    console.log(`File tĩnh được phục vụ từ: ${path.join(__dirname, '../uploads')}`);
    // Khởi tạo job tự động xóa booking hết hạn
    initBookingCleanupJob();
})

