//backend/src/index.js

require('dotenv').config();

const express = require('express');
const app = express();

//middleware for cookies
const cors = require('cors');
const cookieParser = require('cookie-parser');  
app.use(cors({
  origin: 'http://localhost:5000', // Sửa lại cho đúng với FE thật
  credentials: true               // ✅ Cho phép gửi cookie
}));
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
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/roomTypes', roomTypeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

