//backend/src/index.js

require('dotenv').config();

const express = require('express');
const app = express();

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
//Logging
app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.url}`);
  next();
});
//Mount routes
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes')
const hotelRoutes = require('./routes/hotelRoutes');
const roomTypeRoutes = require('./routes/roomTypeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mapRoutes = require('./routes/mapRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/roomTypes', roomTypeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/reviews', reviewRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

