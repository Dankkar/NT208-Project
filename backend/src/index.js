//backend/src/index.js

require('dotenv').config();
const { initBookingCleanupJob } = require('./services/bookingCleanupService');
const path = require('path');

const express = require('express');
const app = express();

// Session middleware
const session = require('express-session');

// Session configuration - using MemoryStore (default)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false, // Chỉ tạo session khi có data để lưu
    genid: function(req) {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    cookie: {
        secure: false, // Set to false for localhost development
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Add SameSite attribute for cross-origin requests
    }
}));

//middleware for cookies
const cors = require('cors');
const cookieParser = require('cookie-parser');  
app.use(cors({
  origin: 'http://localhost:3000', // Sửa lại cho đúng với FE thật
  credentials: true               // ✅ Cho phép gửi cookie
}));
app.use(express.urlencoded({ extended: true })); // ✅ Đọc URL-encoded body
app.use(cookieParser());          // ✅ Đặt TRƯỚC các route cần đọc cookie
app.use(express.json());          // ✅ Đọc JSON body

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
//Logging
app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.url}`);
  console.log('Session ID:', req.session?.id);
  console.log('Cookies:', Object.keys(req.cookies || {}).join(', '));
  next();
});
//Mount routes
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes')
const hotelRoutes = require('./routes/hotelRoutes');
const roomTypeRoutes = require('./routes/roomTypeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const simplePaymentRoutes = require('./routes/simplePaymentRoutes');
const mapRoutes = require('./routes/mapRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const priceRoutes = require('./routes/priceRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const promotionRoutes = require('./routes/promotionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/roomTypes', roomTypeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/simple-payments', simplePaymentRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/promotions', promotionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Static files served from: ${path.join(__dirname, '../uploads')}`);
    initBookingCleanupJob();
})

