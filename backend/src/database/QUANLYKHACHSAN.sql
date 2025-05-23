CREATE DATABASE QUANLYKHACHSAN

USE QUANLYKHACHSAN

-- Bảng Người Dùng (User)
CREATE TABLE NguoiDung (
    MaKH INT PRIMARY KEY IDENTITY(1,1),         -- Mã Khách Hàng (PK) - Dùng INT IDENTITY cho tiện
    LoaiUser NVARCHAR(50) NOT NULL,             -- Loại người dùng (Admin, KhachHang, QuanLyKS)
    HoTen NVARCHAR(100) NOT NULL,               -- Họ tên
    Email NVARCHAR(100) UNIQUE NOT NULL,        -- Email (UNIQUE)
    SDT NVARCHAR(20) UNIQUE,                    -- Số điện thoại (UNIQUE)
    MatKhauHash NVARCHAR(255) NOT NULL,         -- Nên lưu Hash mật khẩu, không lưu trực tiếp
    NgaySinh DATE,                              -- Ngày sinh
    GioiTinh NVARCHAR(10),                      -- Giới tính
    CCCD NVARCHAR(20) UNIQUE,                   -- Căn cước công dân (UNIQUE)
    NgayTao DATETIME2 DEFAULT GETDATE()         -- Ngày tạo tài khoản
);

-- Bảng Khách Sạn (Hotel)
CREATE TABLE KhachSan (
    MaKS INT PRIMARY KEY IDENTITY(1,1),         -- Mã Khách sạn (PK)
    TenKS NVARCHAR(150) NOT NULL,               -- Tên khách sạn
    DiaChi NVARCHAR(255) NOT NULL,              -- Địa chỉ
    Latitude DECIMAL(10, 8) NULL,               -- Vĩ độ cho Google Maps
    Longitude DECIMAL(11, 8) NULL,              -- Kinh độ cho Google Maps
    HangSao DECIMAL(2,1),                       -- Đánh giá số sao
    LoaiHinh NVARCHAR(100),                     -- Loại hình: Khách Sạn, Resort,..
    MoTaCoSoVatChat NVARCHAR(MAX),              -- Mô tả cơ sở vật chất
    QuyDinh NVARCHAR(MAX),                      -- Quy định khách sạn
    MoTaChung NVARCHAR(MAX),                    -- Mô tả chung
    MaNguoiQuanLy INT NULL,                     -- Mã người quản lý (FK - Optional)
    CONSTRAINT FK_KhachSan_NguoiQuanLy FOREIGN KEY (MaNguoiQuanLy) REFERENCES NguoiDung(MaKH) ON DELETE SET NULL -- Nếu người quản lý bị xóa, KS không có quản lý
);

-- Bảng Loại Phòng (RoomType) - Đã tách để đạt BCNF
CREATE TABLE LoaiPhong (
    MaLoaiPhong INT PRIMARY KEY IDENTITY(1,1),   -- Mã Loại Phòng (PK)
    MaKS INT NOT NULL,                          -- Mã Khách sạn (FK) - Loại phòng thuộc về KS nào
    TenLoaiPhong NVARCHAR(100) NOT NULL,        -- Tên loại phòng
    SoGiuong INT NOT NULL CHECK (SoGiuong > 0), -- Số giường
	TienNghi NVARCHAR(200),						-- Tiện nghi như: Wifi, Máy lạnh, Bàn ủi, TV, Tủ lạnh, ..
    DienTich DECIMAL(8, 2),                     -- Diện tích (m2)
    GiaCoSo DECIMAL(18, 2) NOT NULL CHECK (GiaCoSo >= 0), -- Giá cơ sở/đêm
    MoTa NVARCHAR(MAX),                         -- Mô tả thêm
    CONSTRAINT FK_LoaiPhong_KhachSan FOREIGN KEY (MaKS) REFERENCES KhachSan(MaKS) ON DELETE CASCADE -- Nếu KS bị xóa, các loại phòng cũng bị xóa
);

-- Bảng Cấu Hình Giường (Bed Configuration)
CREATE TABLE CauHinhGiuong (
    MaCauHinhGiuong INT PRIMARY KEY IDENTITY(1,1),  -- Mã cấu hình giường (PK)
    TenCauHinh NVARCHAR(100) NOT NULL,              -- Tên cấu hình (VD: "1 giường đôi", "1 giường đôi + 1 giường đơn")
    SoGiuongDoi INT DEFAULT 0,                      -- Số lượng giường đôi
    SoGiuongDon INT DEFAULT 0,                      -- Số lượng giường đơn
    CONSTRAINT CK_CauHinhGiuong_SoGiuong CHECK (SoGiuongDoi >= 0 AND SoGiuongDon >= 0 AND (SoGiuongDoi + SoGiuongDon) > 0)
);

-- Bảng Phòng (Room) - Chỉ chứa thông tin phòng cụ thể
CREATE TABLE Phong (
    MaPhong INT PRIMARY KEY IDENTITY(1,1),       -- Mã Phòng (PK)
    MaKS INT NOT NULL,                          -- Mã Khách sạn (FK)
    MaLoaiPhong INT NOT NULL,                   -- Mã Loại phòng (FK)
    MaCauHinhGiuong INT NOT NULL,               -- Mã cấu hình giường (FK)
    SoPhong NVARCHAR(20) NOT NULL,              -- Số phòng (VD: '101', 'P205', C308, TVQ36)
    Tang INT NULL,                              -- Phòng ở tầng mấy (Optional)
    TrangThaiPhong NVARCHAR(50) DEFAULT N'Sẵn sàng', -- Trạng thái (Sẵn sàng, Đang ở, Đang dọn, Bảo trì)
    CONSTRAINT FK_Phong_KhachSan FOREIGN KEY (MaKS) REFERENCES KhachSan(MaKS),
    CONSTRAINT FK_Phong_LoaiPhong FOREIGN KEY (MaLoaiPhong) REFERENCES LoaiPhong(MaLoaiPhong),
    CONSTRAINT FK_Phong_CauHinhGiuong FOREIGN KEY (MaCauHinhGiuong) REFERENCES CauHinhGiuong(MaCauHinhGiuong),
    CONSTRAINT UQ_Phong_SoPhong_MaKS UNIQUE (MaKS, SoPhong)
);

-- Insert some common bed configurations
INSERT INTO CauHinhGiuong (TenCauHinh, SoGiuongDoi, SoGiuongDon) VALUES
(N'1 giường đôi', 1, 0),
(N'1 giường đơn', 0, 1),    
(N'2 giường đơn', 0, 2),
(N'1 giường đôi + 1 giường đơn', 1, 1),
(N'2 giường đôi', 2, 0);

-- Bảng Loại Dịch Vụ (ServiceType) - Đổi tên từ DICHVU và tách để đạt BCNF
CREATE TABLE LoaiDichVu (
    MaLoaiDV INT PRIMARY KEY IDENTITY(1,1),      -- Mã Loại Dịch vụ (PK)
    MaKS INT NOT NULL,                          -- Mã Khách sạn (FK) - Dịch vụ thuộc về KS nào
    TenLoaiDV NVARCHAR(100) NOT NULL,           -- Tên loại dịch vụ
    GiaDV DECIMAL(18, 2) NOT NULL CHECK (GiaDV >= 0), -- Giá dịch vụ
    MoTaDV NVARCHAR(MAX),                       -- Mô tả dịch vụ
    CONSTRAINT FK_LoaiDichVu_KhachSan FOREIGN KEY (MaKS) REFERENCES KhachSan(MaKS) ON DELETE CASCADE -- Nếu KS xóa, dịch vụ cũng xóa
);

-- Bảng Khuyến Mãi (Promotion)
CREATE TABLE KhuyenMai (
    MaKM INT PRIMARY KEY IDENTITY(1,1),         -- Mã Khuyến mãi (PK)
    MaCodeKM NVARCHAR(50) UNIQUE NOT NULL,      -- Mã code khuyến mãi (VD: 'SUMMER20') (UNIQUE)
    TenKM NVARCHAR(150) NOT NULL,               -- Tên chương trình KM
    MoTaKM NVARCHAR(MAX),                       -- Mô tả chi tiết KM
    NgayBD DATETIME2 NOT NULL,                  -- Ngày bắt đầu
    NgayKT DATETIME2 NOT NULL,                  -- Ngày kết thúc
    LoaiKM NVARCHAR(50),                        -- Loại KM (Giảm %, Giảm tiền cố định)
    GiaTriKM DECIMAL(18, 2) NOT NULL,           -- Giá trị KM (Số tiền hoặc %)
    DieuKienApDung NVARCHAR(MAX),               -- Điều kiện áp dụng
    IsActive BIT DEFAULT 1,                     -- Còn hoạt động hay không
    CONSTRAINT CK_KhuyenMai_NgayKT CHECK (NgayKT >= NgayBD) -- Ngày kết thúc >= ngày bắt đầu
);

-- Bảng Đặt Phòng (Booking) - Tích hợp thông tin hủy
CREATE TABLE Booking (
    MaDat INT PRIMARY KEY IDENTITY(1,1),          -- Mã Đặt phòng (PK)
    MaKH INT,                           -- Mã Khách hàng (FK)
    MaKS INT NOT NULL,                           -- Mã Khách sạn (FK) - Booking này ở KS nào
    MaPhong INT NULL,                         -- Mã phòng CỤ THỂ được đặt (FK, NULL) - Theo ERD gốc (chỉ đặt 1 phòng)
                                                -- BỎ CỘT NÀY NẾU DÙNG BẢNG ChiTietDatPhong CHO NHIỀU PHÒNG
    NgayDat DATETIME2 DEFAULT GETDATE(),         -- Ngày thực hiện đặt phòng
    NgayNhanPhong DATETIME2 NOT NULL,            -- Ngày nhận phòng dự kiến
    NgayTraPhong DATETIME2 NOT NULL,             -- Ngày trả phòng dự kiến
    SoLuongKhach INT DEFAULT 1 CHECK(SoLuongKhach > 0), -- Số lượng khách
    YeuCauDacBiet NVARCHAR(MAX),                 -- Yêu cầu thêm
    TongTienDuKien DECIMAL(18, 2),               -- Tổng tiền dự kiến (có thể tính toán lại khi checkout)
    TrangThaiBooking NVARCHAR(50) DEFAULT N'Đã xác nhận', -- Trạng thái ( Đã xác nhận, Đã nhận phòng, Đã trả phòng, Đã hủy, Tạm Giữ)
    NgayHuy DATETIME2 NULL,                      -- Ngày hủy (nếu có)
    LyDoHuy NVARCHAR(255) NULL,                  -- Lý do hủy
    TienHoanTra DECIMAL(18, 2) NULL,             -- Số tiền hoàn lại khi hủy (nếu có)
    ThoiGianGiuCho DATETIME2 NULL,               -- Thời gian giữ chỗ

    CONSTRAINT FK_Booking_NguoiDung FOREIGN KEY (MaKH) REFERENCES NguoiDung(MaKH), -- Không nên CASCADE delete user
    CONSTRAINT FK_Booking_KhachSan FOREIGN KEY (MaKS) REFERENCES KhachSan(MaKS),  -- Không nên CASCADE delete KS
    -- CONSTRAINT FK_Booking_Phong FOREIGN KEY (MaPhong) REFERENCES Phong(MaPhong) ON DELETE SET NULL, -- Nếu phòng bị xóa, booking không trỏ đến phòng nữa
    CONSTRAINT CK_Booking_NgayTra CHECK (NgayTraPhong > NgayNhanPhong) -- Ngày trả > ngày nhận
);

-- Bảng Chi Tiết Đặt Phòng (Nếu cần đặt nhiều phòng cho 1 Booking)
-- Bỏ comment nếu sử dụng bảng này và bỏ MaPhong khỏi Booking
/*
CREATE TABLE ChiTietDatPhong (
    MaChiTietDatPhong INT PRIMARY KEY IDENTITY(1,1),
    MaDat INT NOT NULL,
    MaPhong INT NOT NULL,
    GiaTaiThoiDiemDat DECIMAL(18, 2) NOT NULL, -- Giá phòng áp dụng cho booking này
    CONSTRAINT FK_ChiTietDatPhong_Booking FOREIGN KEY (MaDat) REFERENCES Booking(MaDat) ON DELETE CASCADE, -- Nếu booking bị xóa, chi tiết cũng xóa
    CONSTRAINT FK_ChiTietDatPhong_Phong FOREIGN KEY (MaPhong) REFERENCES Phong(MaPhong) -- Không nên CASCADE xóa phòng
);
*/

-- Bảng Sử Dụng Dịch Vụ (Service Usage) - Liên kết Booking và Loại Dịch Vụ
CREATE TABLE SuDungDichVu (
    MaSuDungDV INT PRIMARY KEY IDENTITY(1,1),   -- Mã sử dụng dịch vụ (PK)
    MaDat INT NOT NULL,                         -- Thuộc về Booking nào (FK)
    MaLoaiDV INT NOT NULL,                      -- Đã sử dụng dịch vụ loại nào (FK)
    SoLuong INT DEFAULT 1 CHECK (SoLuong > 0), -- Số lượng
    ThoiGianSuDung DATETIME2 DEFAULT GETDATE(),-- Thời điểm sử dụng
    GiaTaiThoiDiemSuDung DECIMAL(18, 2) NOT NULL, -- Giá DV tại lúc dùng (có thể khác giá gốc)
    ThanhTien AS (ISNULL(SoLuong, 0) * ISNULL(GiaTaiThoiDiemSuDung, 0)), -- Computed column
    GhiChu NVARCHAR(255),                      -- Ghi chú thêm
    CONSTRAINT FK_SuDungDichVu_Booking FOREIGN KEY (MaDat) REFERENCES Booking(MaDat) ON DELETE CASCADE, -- Nếu booking xóa, sử dụng DV liên quan cũng xóa
    CONSTRAINT FK_SuDungDichVu_LoaiDV FOREIGN KEY (MaLoaiDV) REFERENCES LoaiDichVu(MaLoaiDV) -- Không nên CASCADE xóa loại DV
);

-- Bảng Hóa Đơn (Invoice)
CREATE TABLE HoaDon (
    MaHD INT PRIMARY KEY IDENTITY(1,1),         -- Mã Hóa đơn (PK)
    MaDat INT NOT NULL,                         -- Hóa đơn cho Booking nào (FK)
    MaKH INT NOT NULL,                          -- Hóa đơn của Khách hàng nào (FK) - Có thể lấy từ MaDat nhưng để tường minh
    MaKM INT NULL,                              -- Mã Khuyến mãi áp dụng (FK, Optional)
    NgayLapHD DATETIME2 DEFAULT GETDATE(),      -- Ngày lập hóa đơn
    TongTienPhong DECIMAL(18, 2) DEFAULT 0,     -- Tổng tiền phòng
    TongTienDichVu DECIMAL(18, 2) DEFAULT 0,    -- Tổng tiền dịch vụ
    TienGiamGia DECIMAL(18, 2) DEFAULT 0,       -- Số tiền được giảm từ KM
    ThueVAT DECIMAL(18, 2) DEFAULT 0,           -- Tiền thuế (nếu có)
    TongTienThanhToan AS (TongTienPhong + TongTienDichVu - TienGiamGia + ThueVAT), -- Computed
    HinhThucTT NVARCHAR(50),                    -- Hình thức thanh toán (Tiền mặt, Chuyển khoản, Thẻ...)
    TrangThaiThanhToan NVARCHAR(50) DEFAULT N'Chưa thanh toán', -- Trạng thái (Chưa thanh toán, Đã thanh toán)
    NgayThanhToan DATETIME2 NULL,               -- Ngày thanh toán (nếu có)

    CONSTRAINT FK_HoaDon_Booking FOREIGN KEY (MaDat) REFERENCES Booking(MaDat), -- Không CASCADE delete booking
    CONSTRAINT FK_HoaDon_NguoiDung FOREIGN KEY (MaKH) REFERENCES NguoiDung(MaKH),
    CONSTRAINT FK_HoaDon_KhuyenMai FOREIGN KEY (MaKM) REFERENCES KhuyenMai(MaKM) ON DELETE SET NULL -- Nếu KM bị xóa, hóa đơn không còn áp dụng KM đó
);


-- Bảng Bài Đánh Giá (Review) - Liên kết User, Booking, Hotel
CREATE TABLE BaiDanhGia (
    MaDG INT PRIMARY KEY IDENTITY(1,1),         -- Mã Đánh giá (PK)
    MaKH INT NOT NULL,                          -- Ai đánh giá (FK)
    MaDat INT NOT NULL,                         -- Đánh giá cho Booking nào (FK) -> Giúp biết KS, Phòng (nếu cần)
    MaKS INT NOT NULL,                          -- Đánh giá về Khách sạn nào (FK) - Có thể lấy từ MaDat
    Sao INT NOT NULL CHECK (Sao BETWEEN 1 AND 5), -- Số sao đánh giá (1-5)
    NoiDung NVARCHAR(MAX),                      -- Nội dung bình luận
    NgayDG DATETIME2 DEFAULT GETDATE(),         -- Ngày đánh giá
    IsApproved BIT DEFAULT 0,                   -- Đánh giá đã được duyệt hiển thị chưa?
    CONSTRAINT FK_BaiDanhGia_NguoiDung FOREIGN KEY (MaKH) REFERENCES NguoiDung(MaKH),
    CONSTRAINT FK_BaiDanhGia_Booking FOREIGN KEY (MaDat) REFERENCES Booking(MaDat),
    CONSTRAINT FK_BaiDanhGia_KhachSan FOREIGN KEY (MaKS) REFERENCES KhachSan(MaKS)
    -- Nên tạo Index cho các cột FK để tăng tốc truy vấn
);

-- Tạo Index cho các Foreign Keys phổ biến
CREATE INDEX IDX_Booking_MaKH ON Booking(MaKH);
CREATE INDEX IDX_Booking_MaKS ON Booking(MaKS);
-- CREATE INDEX IDX_Booking_MaPhong ON Booking(MaPhong); -- Nếu dùng cột này
CREATE INDEX IDX_Phong_MaKS ON Phong(MaKS);
CREATE INDEX IDX_Phong_MaLoaiPhong ON Phong(MaLoaiPhong);
CREATE INDEX IDX_LoaiPhong_MaKS ON LoaiPhong(MaKS);
CREATE INDEX IDX_LoaiDichVu_MaKS ON LoaiDichVu(MaKS);
CREATE INDEX IDX_SuDungDichVu_MaDat ON SuDungDichVu(MaDat);
CREATE INDEX IDX_SuDungDichVu_MaLoaiDV ON SuDungDichVu(MaLoaiDV);
CREATE INDEX IDX_HoaDon_MaDat ON HoaDon(MaDat);
CREATE INDEX IDX_HoaDon_MaKH ON HoaDon(MaKH);
CREATE INDEX IDX_HoaDon_MaKM ON HoaDon(MaKM);
CREATE INDEX IDX_BaiDanhGia_MaKH ON BaiDanhGia(MaKH);
CREATE INDEX IDX_BaiDanhGia_MaDat ON BaiDanhGia(MaDat);
CREATE INDEX IDX_BaiDanhGia_MaKS ON BaiDanhGia(MaKS);

-- Bảng phụ, liên kết với Booking
DELETE FROM BaiDanhGia;
DELETE FROM HoaDon;
DELETE FROM SuDungDichVu;
-- Bảng Booking
DELETE FROM Booking;

-- Bảng dịch vụ
DELETE FROM LoaiDichVu;

-- Bảng phòng
DELETE FROM Phong;
DELETE FROM LoaiPhong;

-- Bảng khách sạn
DELETE FROM KhachSan;

-- Bảng khuyến mãi
DELETE FROM KhuyenMai;

-- Cuối cùng: bảng người dùng
DELETE FROM NguoiDung;
SELECT * FROM KhachSan
SELECT * FROM LoaiPhong
