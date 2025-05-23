//backend/src/index.js

require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join-room', (managerId) => {
    socket.join(managerId);
    console.log(`User joined room: ${managerId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Function to emit booking notification
const emitBookingNotification = (managerId, bookingData) => {
  io.to(managerId).emit('new-booking', bookingData);
};

// Make emitBookingNotification available globally
global.emitBookingNotification = emitBookingNotification;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

