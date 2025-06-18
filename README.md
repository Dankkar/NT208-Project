# 🏨 NT208 Hotel Management System

## 📖 Tổng quan dự án

**NT208 Hotel Management System** là một hệ thống quản lý khách sạn toàn diện được phát triển cho môn học NT208. Hệ thống cho phép quản lý đặt phòng, khách hàng, dịch vụ và các hoạt động vận hành khách sạn với giao diện hiện đại và tính năng đầy đủ.

## 🏗️ Kiến trúc hệ thống

### Frontend (Vue.js 3 + Vite)
- **Framework**: Vue 3 với Composition API
- **Build Tool**: Vite
- **UI Framework**: Bootstrap 5.3.3
- **State Management**: Pinia với Persisted State
- **Routing**: Vue Router 4
- **Date Handling**: Vue Datepicker, date-fns
- **HTTP Client**: Axios
- **Authentication**: JWT với Google Login integration

### Backend (Node.js + Express)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Microsoft SQL Server
- **ORM**: Native mssql driver
- **Authentication**: JWT + bcryptjs
- **Session Management**: express-session
- **Email Service**: Nodemailer
- **Scheduled Tasks**: node-cron
- **Security**: CORS, Rate Limiting, Cookie Parser

### Database
- **RDBMS**: Microsoft SQL Server
- **Schema**: QUANLYKHACHSAN
- **Key Tables**: NguoiDung, KhachSan, Booking, Phong, LoaiPhong, HoaDon

## 🚀 Tính năng chính

### 👤 Quản lý người dùng
- **Đăng ký/Đăng nhập**: Email + mật khẩu, Google OAuth
- **Phân quyền**: Admin, Quản lý khách sạn, Khách hàng
- **Hồ sơ**: Quản lý thông tin cá nhân, CCCD, số điện thoại
- **Xác thực**: JWT tokens với refresh mechanism

### 🏨 Quản lý khách sạn
- **Thông tin khách sạn**: Tên, địa chỉ, mô tả, tiện nghi
- **Phân loại**: Theo hạng sao, loại hình (khách sạn, resort)
- **Vị trí**: Tích hợp Google Maps với latitude/longitude
- **Hình ảnh**: Upload và quản lý hình ảnh khách sạn

### 🛏️ Quản lý phòng
- **Loại phòng**: Deluxe, Standard, Suite với giá cơ sở
- **Cấu hình giường**: Giường đôi, giường đơn linh hoạt
- **Tiện nghi phòng**: Wifi, điều hòa, TV, tủ lạnh
- **Trạng thái**: Trống, đang ở, bảo trì
- **Kiểm tra tính khả dụng**: Real-time availability check

### 📅 Hệ thống đặt phòng
- **Tìm kiếm phòng**: Theo ngày, số khách, địa điểm
- **Booking flow**: 4 bước đặt phòng intuitive
  - Step 1: Tìm kiếm (ngày, số khách)
  - Step 2: Chọn phòng
  - Step 3: Thông tin khách & thanh toán  
  - Step 4: Xác nhận booking
- **Temporary hold**: Giữ phòng 15 phút khi đang đặt
- **Guest booking**: Hỗ trợ đặt phòng không cần đăng ký
- **Booking management**: Xem lịch sử, hủy booking

### 💰 Quản lý thanh toán
- **Hóa đơn**: Tự động tạo hóa đơn VAT
- **Khuyến mãi**: Áp dụng mã giảm giá
- **Lịch sử giao dịch**: Theo dõi các khoản thanh toán

### 🛎️ Dịch vụ khách sạn
- **Loại dịch vụ**: Spa, nhà hàng, giặt ủi, đưa đón
- **Đặt dịch vụ**: Thêm vào booking hoặc đặt riêng
- **Tính phí**: Theo số lượng và thời điểm sử dụng

### ⭐ Đánh giá & Nhận xét
- **Rating system**: 1-5 sao cho khách sạn
- **Reviews**: Nhận xét chi tiết từ khách hàng
- **Quản lý phản hồi**: Admin/Manager có thể trả lời

### 🔧 Admin Panel
- **Dashboard**: Thống kê tổng quan
- **Quản lý người dùng**: Tìm kiếm, chỉnh sửa, kích hoạt/vô hiệu hóa
- **Quản lý khách sạn**: Thêm/sửa/xóa khách sạn và loại phòng
- **Quản lý booking**: Xem và xử lý các đặt phòng
- **Báo cáo**: Doanh thu, occupancy rate, customer analytics

## 📁 Cấu trúc thư mục

```
NT208-Project/
├── frontend/                  # Vue.js Frontend
│   ├── src/
│   │   ├── components/        # Vue components
│   │   │   ├── booking/       # Booking-related components
│   │   │   │   ├── steps/     # Step-by-step booking process
│   │   │   │   └── BookingProgressIndicator.vue
│   │   │   ├── NavBar.vue     # Navigation bar
│   │   │   ├── HotelCard.vue  # Hotel display cards
│   │   │   └── ...
│   │   ├── views/             # Page components
│   │   │   ├── admin/         # Admin panel pages
│   │   │   ├── HomePage.vue
│   │   │   ├── Hotels.vue
│   │   │   ├── BookingProcess.vue
│   │   │   └── ...
│   │   ├── store/             # Pinia stores
│   │   ├── router/            # Vue Router config
│   │   ├── services/          # API services
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── package.json
│
├── backend/                   # Node.js Backend
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   │   ├── authController.js
│   │   │   ├── bookingController.js
│   │   │   ├── hotelController.js
│   │   │   └── ...
│   │   ├── routes/            # API routes
│   │   ├── database/          # Database config & schema
│   │   │   ├── db.js          # SQL Server connection
│   │   │   └── QUANLYKHACHSAN.sql # Database schema
│   │   ├── middlewares/       # Express middlewares
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   └── index.js           # Server entry point
│   └── package.json
│
└── README.md                  # Project documentation
```

## 🛠️ Cài đặt và chạy dự án

### Yêu cầu hệ thống
- **Node.js**: >= 16.0.0
- **SQL Server**: 2019 hoặc mới hơn
- **Git**: Latest version

### 1. Clone repository
```bash
git clone <repository-url>
cd NT208-Project
```

### 2. Cài đặt Backend

```bash
cd backend
npm install

# Tạo file .env
cp .env.example .env
```

**Cấu hình file `.env`:**
```env
# Database Configuration
DB_SERVER=localhost
DB_NAME=QUANLYKHACHSAN
DB_USER=your_db_user
DB_PASS=your_db_password
DB_PORT=1433

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Session Configuration
SESSION_SECRET=your_session_secret

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id

# Server Configuration
PORT=5000
```

### 3. Cài đặt Database

```bash
# Chạy SQL script để tạo database
sqlcmd -S localhost -d master -i src/database/QUANLYKHACHSAN.sql

# Hoặc sử dụng SQL Server Management Studio
# Import và chạy file QUANLYKHACHSAN.sql
```

### 4. Cài đặt Frontend

```bash
cd ../frontend
npm install
```

### 5. Chạy ứng dụng

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev    # Development với nodemon
# hoặc
npm start      # Production
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev    # Development server
# hoặc
npm run build  # Build for production
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Đăng xuất

### Hotels
- `GET /api/hotels` - Danh sách khách sạn
- `GET /api/hotels/:id` - Chi tiết khách sạn
- `POST /api/hotels` - Tạo khách sạn (Admin)
- `PUT /api/hotels/:id` - Cập nhật khách sạn
- `DELETE /api/hotels/:id` - Xóa khách sạn

### Bookings
- `POST /api/bookings/search` - Tìm phòng trống
- `POST /api/bookings/hold` - Giữ phòng tạm thời
- `POST /api/bookings` - Tạo booking
- `GET /api/bookings/user` - Lịch sử booking
- `PUT /api/bookings/:id/cancel` - Hủy booking

### Users
- `GET /api/users/profile` - Thông tin người dùng
- `PUT /api/users/profile` - Cập nhật profile
- `GET /api/admin/users` - Quản lý users (Admin)

## 🔐 Phân quyền

### Khách hàng (Customer)
- Tìm kiếm và đặt phòng
- Xem lịch sử booking
- Đánh giá khách sạn
- Quản lý thông tin cá nhân

### Quản lý khách sạn (Hotel Manager)
- Quản lý thông tin khách sạn được phân công
- Xem booking của khách sạn
- Quản lý loại phòng và dịch vụ
- Trả lời đánh giá khách hàng

### Admin
- Toàn quyền truy cập hệ thống
- Quản lý tất cả khách sạn
- Quản lý người dùng
- Xem báo cáo tổng hợp
- Cấu hình hệ thống

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm run test
```


## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Dự án này được phát triển cho mục đích học tập môn NT208.

## 👥 Nhóm phát triển

- **Frontend**: Vue.js, UI/UX Design
- **Backend**: Node.js, Database Design
- **Database**: SQL Server Administration
- **Testing & QA**: System Testing

## 📞 Liên hệ

- **Email**: [your-email@student.uit.edu.vn]
- **GitHub**: [repository-link]
- **Demo**: [demo-link]

---

⭐ **Đừng quên star repository nếu bạn thấy dự án hữu ích!**
