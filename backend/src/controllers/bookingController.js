// backend/src/controllers/bookingController.js

const sql = require('mssql');
const { poolPromise } = require('../database/db');
const { sendReviewRequestEmail, sendBookingConfirmation } = require('../utils/emailService');
const PriceCalculationService = require('../services/priceCalculationService');
const EmailService = require('../services/emailService');

// Kiem tra phong trong cua tung loai phong
exports.getAvailableRoomTypes = async (req, res) => {
    try {
        const { NgayNhanPhong, NgayTraPhong } = req.body;

        if (!NgayNhanPhong || !NgayTraPhong) {
            return res.status(400).json({ error: "Vui lòng cung cấp ngày nhận phòng và ngày trả phòng" });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .query(`
                SELECT lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo, COUNT(*) AS SoPhongTrong
                FROM Phong p
                JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                WHERE NOT EXISTS (
                    SELECT 1 FROM Booking b
                    WHERE b.MaPhong = p.MaPhong
                    AND b.TrangThaiBooking != N'Đã hủy'
                    AND (
                        b.NgayNhanPhong <= @NgayTraPhong
                        AND b.NgayTraPhong >= @NgayNhanPhong
                    )
                )
                GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};

// Tao don dat phong
exports.createBooking = async (req, res) => {
    try{
        const{
        MaKS, MaPhong, NgayNhanPhong, NgayTraPhong,
            SoLuongKhach, YeuCauDacBiet, services, promotionCode
        } = req.body;
        const MaKH = req.user.MaKH;
        const pool = await poolPromise;

        // Lấy giá phòng từ LoaiPhong
        const roomPriceResult = await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .query(`
                SELECT lp.GiaCoSo
                FROM Phong p
                JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                WHERE p.MaPhong = @MaPhong
            `);

        if(roomPriceResult.recordset.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông tin phòng" });
        }

        const basePrice = roomPriceResult.recordset[0].GiaCoSo;

        // Kiểm tra và lấy thông tin khuyến mãi nếu có
        let promotion = null;
        if (promotionCode) {
            const promotionResult = await pool.request()
                .input('MaCodeKM', sql.NVarChar, promotionCode)
                .input('currentDate', sql.DateTime, new Date())
                .query(`
                    SELECT MaKM, LoaiKM, GiaTriKM
                    FROM KhuyenMai
                    WHERE MaCodeKM = @MaCodeKM
                    AND IsActive = 1
                    AND @currentDate BETWEEN NgayBD AND NgayKT
                `);

            if (promotionResult.recordset.length > 0) {
                promotion = promotionResult.recordset[0];
            }
        }

        // Kiểm tra và lấy thông tin dịch vụ
        let serviceDetails = [];
        if (services && services.length > 0) {
            const serviceIds = services.map(s => s.MaLoaiDV);
            const serviceResult = await pool.request()
                .input('serviceIds', sql.NVarChar, serviceIds.join(','))
                .query(`
                    SELECT MaLoaiDV, TenLoaiDV, GiaDV
                    FROM LoaiDichVu
                    WHERE MaLoaiDV IN (SELECT value FROM STRING_SPLIT(@serviceIds, ','))
                `);

            serviceDetails = serviceResult.recordset.map(service => ({
                ...service,
                quantity: services.find(s => s.MaLoaiDV === service.MaLoaiDV)?.quantity || 1
            }));
        }

        // Tính tổng tiền dự kiến
        const bookingDetails = {
            basePrice,
            checkIn: NgayNhanPhong,
            checkOut: NgayTraPhong,
            services: serviceDetails,
            promotion: promotion
        };

        const priceDetails = PriceCalculationService.calculateTotalPrice(bookingDetails);
        const TongTienDuKien = priceDetails.finalPrice;

        // Kiem tra trung
        const check = await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .query(`
                SELECT COUNT(*) AS count FROM Booking
                WHERE MaPhong = @MaPhong
                AND TrangThaiBooking != 'Đã hủy'
                AND (NgayNhanPhong <= @NgayTraPhong AND NgayTraPhong >= @NgayNhanPhong)
                `);

        if(check.recordset[0].count > 0){
            return res.status(409).json({ error: "Phong da duoc dat trong thoi gian nay"});
        }

        // Bắt đầu transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Tao don moi
            const bookingResult = await transaction.request()
                .input('MaKH', sql.Int, MaKH)
                .input('MaKS', sql.Int, MaKS)
                .input('MaPhong', sql.Int, MaPhong)
                .input('NgayDat', sql.DateTime, new Date())
                .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
                .input('NgayTraPhong', sql.Date, NgayTraPhong)
                .input('SoLuongKhach', sql.Int, SoLuongKhach)
                .input('YeuCauDacBiet', sql.NVarChar, YeuCauDacBiet || '')
                .input('TongTienDuKien', sql.Decimal(18, 2), TongTienDuKien)
                .input('TrangThaiBooking', sql.NVarChar, 'Đã xác nhận')
                .query(`
                    INSERT INTO Booking
                    (MaKH, MaKS, MaPhong, NgayDat, NgayNhanPhong, NgayTraPhong, SoLuongKhach, YeuCauDacBiet, TongTienDuKien, TrangThaiBooking)
                    OUTPUT INSERTED.MaDat
                    VALUES
                    (@MaKH, @MaKS, @MaPhong, @NgayDat, @NgayNhanPhong, @NgayTraPhong, @SoLuongKhach, @YeuCauDacBiet, @TongTienDuKien, @TrangThaiBooking)
                `);

            const MaDat = bookingResult.recordset[0].MaDat;

            // Thêm chi tiết dịch vụ nếu có
            if (serviceDetails.length > 0) {
                for (const service of serviceDetails) {
                    await transaction.request()
                        .input('MaDat', sql.Int, MaDat)
                        .input('MaLoaiDV', sql.Int, service.MaLoaiDV)
                        .input('SoLuong', sql.Int, service.quantity)
                        .input('GiaTaiThoiDiemSuDung', sql.Decimal(18, 2), service.GiaDV)
                        .query(`
                            INSERT INTO SuDungDichVu
                            (MaDat, MaLoaiDV, SoLuong, GiaTaiThoiDiemSuDung)
                            VALUES
                            (@MaDat, @MaLoaiDV, @SoLuong, @GiaTaiThoiDiemSuDung)
                        `);
                }
            }

            await transaction.commit();
            
            res.status(201).json({ 
                message: 'Dat phong thanh cong',
                MaDat,
                priceDetails: {
                    ...priceDetails,
                    TongTienDuKien
                }
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json({ error: "Loi he thong"});
    }
};

//Gửi email đánh giá sau khi trả phòng

exports.checkoutBooking = async (req, res) => {
    try {
        const { MaDat } = req.params;
        const pool = await sql.connect(db);

        // Cập nhật trạng thái
        await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .input('TrangThaiBooking', sql.NVarChar, 'Đã trả phòng')
            .query(`
                UPDATE Booking
                SET TrangThaiBooking = @TrangThaiBooking
                WHERE MaDat = @MaDat
            `);

        // Lấy thông tin booking + email người dùng
        const result = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT b.NgayNhanPhong, b.NgayTraPhong, ks.TenKS AS hotelName, nd.Email
                FROM Booking b 
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                JOIN NguoiDung nd ON b.MaKH = nd.MaKH
                WHERE b.MaDat = @MaDat
            `);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy đơn đặt phòng" });
        }
        const info = result.recordset[0];
        const reviewLink = `https://your-domain.com/review/${MaDat}`; // Tùy chỉnh
        try {
            await sendReviewRequestEmail(info.Email, info, reviewLink);
        } catch (emailErr) {
            console.error("Gửi email thất bại:", emailErr);
            // Không throw để không ảnh hưởng người dùng
        }

        res.json({ message: "Check-out thành công và đã gửi email mời đánh giá!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};

// Xem chi tiet don
exports.getBookingById = async (req, res) => {
    try{
        const { MaDat } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT b.*, p.SoPhong, ks.TenKS, nd.HoTen
                FROM Booking b JOIN Phong p ON b.MaPhong = p.MaPhong
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                JOIN NguoiDung nd ON b.MaKH = nd.MaKH
                WHERE b.MaDat = @MaDat
            `);

        if(result.recordset.length === 0){
            return res.status(404).json({ error: 'Khong tim thay don dat phong'});
        }

        res.json(result.recordset[0]);
    }
    catch(err){
        res.status(500).json({  error: 'Loi server'});
    }
};

// Huy don
exports.cancelBooking = async (req, res) => {
    try{
        const { MaDat } = req.params;
        const {LyDoHuy} = req.body;

        const pool = await poolPromise;

        const booking = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT NgayNhanPhong, TongTienDuKien FROM Booking
                WHERE MaDat = @MaDat
        `);
        if(booking.recordset.length == 0){
            return res.status(404).json({ error: 'Khong tim thay don'});
        }

        // Tinh tien hoan tra
        const { NgayNhanPhong, TongTienDuKien } = booking.recordset[0];
        const dayBefore = Math.floor((new Date(NgayNhanPhong) - new Date()) / (1000 * 3600 * 24));
        const TienHoanTra = dayBefore >= 7 ? TongTienDuKien : 0;

        await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .input('TrangThaiBooking', sql.NVarChar, 'Đã hủy')
            .input('NgayHuy', sql.DateTime, new Date())
            .input('LyDoHuy', sql.NVarChar, LyDoHuy)
            .input('TienHoanTra', sql.Decimal(18, 2), TienHoanTra)
            .query(`
                UPDATE Booking
                SET TrangThaiBooking = @TrangThaiBooking,
                    NgayHuy = @NgayHuy,
                    LyDoHuy = @LyDoHuy,
                    TienHoanTra = @TienHoanTra
                WHERE MaDat = @MaDat
            `);

        res.json({ message: 'Huy don thanh cong', TienHoanTra});
    }
    catch(err){
        res.status(500).json({ error: 'Loi he thong'});
    }
};

// Xem don dat phong theo MaKH
exports.getBookingByUser = async (req, res) => {
    try{
        const requestedMaKH = parseInt(req.params.MaKH);
        const currentUser = req.user;
        if (!requestedMaKH || isNaN(Number(requestedMaKH))) {
            return res.status(400).json({ error: 'MaKH không hợp lệ' });
        }
        if(currentUser.role !== 'QuanLyKS' && currentUser.role !== 'Admin')
        {
            if(currentUser.MaKH !== requestedMaKH)
            {
                return res.status(403).json({ error: 'Bạn không có quyền truy cập vào đơn đặt phòng của người khác'});
            }
        }
        const pool = await poolPromise;

        const result = await pool.request()
            .input('MaKH', sql.Int, parseInt(MaKH))
            .query(`
                SELECT b.MaDat, ks.TenKS, p.SoPhong, b.NgayNhanPhong, b.NgayTraPhong, b.TrangThaiBooking
                FROM Booking b JOIN KhachSan ks ON b.MaKS = ks.MaKS
                JOIN PHONG p ON b.MaPhong = p.MaPhong
                WHERE b.MaKH = @MaKH
                ORDER BY b.NgayDat DESC
            `);

        res.json(result.recordset);
    }
    catch(err){
        console.error('Lỗi getBookingByUser:', err);
        res.status(500).json({ error: "Loi he thong"});
    }
};

/**
 * API tính giá đặt phòng
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.calculatePrice = async (req, res) => {
    try {
        const bookingDetails = req.body;
        
        // Validate input
        if (!bookingDetails.basePrice || !bookingDetails.checkIn || !bookingDetails.checkOut) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin cần thiết'
            });
        }

        const priceDetails = PriceCalculationService.calculateTotalPrice(bookingDetails);
        
        res.json({
            success: true,
            data: priceDetails
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * API gửi email xác nhận đặt phòng
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.sendBookingConfirmation = async (req, res) => {
    try {
        const bookingInfo = req.body;
        
        // Validate input
        if (!bookingInfo.guestEmail || !bookingInfo.guestName || !bookingInfo.roomNumber) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin cần thiết'
            });
        }

        const result = await sendBookingConfirmation(bookingInfo);
        
        res.json({
            success: true,
            message: 'Email xác nhận đã được gửi thành công',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
//API: Admin xem toan bo don dat phong
exports.getAllBookings = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
        SELECT 
            b.MaDat, b.NgayDat, b.NgayNhanPhong, b.NgayTraPhong, 
            b.TrangThaiBooking, b.TongTienDuKien,
            ks.TenKS, p.SoPhong, nd.HoTen AS TenKhachHang, nd.Email, nd.SDT
        FROM Booking b
        JOIN KhachSan ks ON b.MaKS = ks.MaKS
        JOIN Phong p ON b.MaPhong = p.MaPhong
        JOIN NguoiDung nd ON b.MaKH = nd.MaKH
        ORDER BY b.NgayDat DESC
        `);
        res.json({success: true, data: result.recordset});
    }
    catch (err) {
        console.error('Lỗi getAllBookings:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};