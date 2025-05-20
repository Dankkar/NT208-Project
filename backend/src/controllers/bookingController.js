// backend/src/controllers/bookingController.js

const { poolPromise, sql } = require('../database/db');
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
                SELECT 
                    lp.MaLoaiPhong, 
                    lp.TenLoaiPhong, 
                    lp.GiaCoSo,
                    chg.TenCauHinh as CauHinhGiuong,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon,
                    COUNT(*) AS SoPhongTrong
                FROM Phong p
                JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE NOT EXISTS (
                    SELECT 1 FROM Booking b
                    WHERE b.MaPhong = p.MaPhong
                    AND b.TrangThaiBooking != N'Đã hủy'
                    AND (
                        b.NgayNhanPhong <= @NgayTraPhong
                        AND b.NgayTraPhong >= @NgayNhanPhong
                    )
                    AND (
                        b.TrangThaiBooking != N'Tạm giữ'
                        OR (b.TrangThaiBooking = N'Tạm giữ' AND b.ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15)
                    )
                )
                GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo, 
                         chg.TenCauHinh, chg.SoGiuongDoi, chg.SoGiuongDon
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};

// Tao don dat phong
exports.createBooking = async (req, res) => {
    try {
        const {
            MaKS, MaPhong, NgayNhanPhong, NgayTraPhong,
            SoLuongKhach, YeuCauDacBiet, services, promotionCode
        } = req.body;
        const MaKH = req.user.MaKH;
        const pool = await poolPromise;

        // Kiểm tra số lượng khách với cấu hình giường
        const bedConfigResult = await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .query(`
                SELECT chg.SoGiuongDoi, chg.SoGiuongDon
                FROM Phong p
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE p.MaPhong = @MaPhong
            `);

        if (bedConfigResult.recordset.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông tin phòng" });
        }

        const { SoGiuongDoi, SoGiuongDon } = bedConfigResult.recordset[0];
        const maxGuests = (SoGiuongDoi * 2) + SoGiuongDon;

        if (SoLuongKhach > maxGuests) {
            return res.status(400).json({ 
                error: `Số lượng khách vượt quá sức chứa của phòng. Tối đa ${maxGuests} người.` 
            });
        }

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
                AND TrangThaiBooking != N'Đã hủy'
                AND (NgayNhanPhong <= @NgayTraPhong AND NgayTraPhong >= @NgayNhanPhong)
            `);

        if(check.recordset[0].count > 0) {
            return res.status(409).json({ error: "Phòng đã được đặt trong thời gian này" });
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
                .input('TrangThaiBooking', sql.NVarChar, 'Tạm giữ')
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
                message: 'Đặt phòng thành công',
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
    catch(err) {
        console.log(err);
        res.status(500).json({ error: "Lỗi hệ thống" });
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
    try {
        const { MaDat } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT 
                    b.*, 
                    p.SoPhong, 
                    ks.TenKS, 
                    nd.HoTen,
                    chg.TenCauHinh as CauHinhGiuong,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon
                FROM Booking b 
                JOIN Phong p ON b.MaPhong = p.MaPhong
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                JOIN NguoiDung nd ON b.MaKH = nd.MaKH
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE b.MaDat = @MaDat
            `);

        if(result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn đặt phòng' });
        }

        res.json(result.recordset[0]);
    }
    catch(err) {
        res.status(500).json({ error: 'Lỗi server' });
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
    try {
        const requestedMaKH = parseInt(req.params.MaKH);
        const currentUser = req.user;
        if (!requestedMaKH || isNaN(Number(requestedMaKH))) {
            return res.status(400).json({ error: 'MaKH không hợp lệ' });
        }
        if(currentUser.role !== 'QuanLyKS' && currentUser.role !== 'Admin') {
            if(currentUser.MaKH !== requestedMaKH) {
                return res.status(403).json({ error: 'Bạn không có quyền truy cập vào đơn đặt phòng của người khác' });
            }
        }
        const pool = await poolPromise;

        const result = await pool.request()
            .input('MaKH', sql.Int, requestedMaKH)
            .query(`
                SELECT 
                    b.MaDat, 
                    ks.TenKS, 
                    p.SoPhong, 
                    b.NgayNhanPhong, 
                    b.NgayTraPhong, 
                    b.TrangThaiBooking,
                    chg.TenCauHinh as CauHinhGiuong,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon
                FROM Booking b 
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                JOIN Phong p ON b.MaPhong = p.MaPhong
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE b.MaKH = @MaKH
                ORDER BY b.NgayDat DESC
            `);

        res.json(result.recordset);
    }
    catch(err) {
        console.error('Lỗi getBookingByUser:', err);
        res.status(500).json({ error: "Lỗi hệ thống" });
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

//API Hold booking
exports.holdBooking = async (req, res) => {
    try {
        const {
            MaKH, MaKS, MaPhong,
            NgayNhanPhong, NgayTraPhong,
            SoLuongKhach, YeuCauDacBiet,
            TongTienDuKien
        } = req.body;

        const pool = await poolPromise;

        // Kiểm tra số lượng khách với cấu hình giường
        const bedConfigResult = await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .query(`
                SELECT chg.SoGiuongDoi, chg.SoGiuongDon
                FROM Phong p
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE p.MaPhong = @MaPhong
            `);

        if (bedConfigResult.recordset.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông tin phòng" });
        }

        const { SoGiuongDoi, SoGiuongDon } = bedConfigResult.recordset[0];
        const maxGuests = (SoGiuongDoi * 2) + SoGiuongDon;

        if (SoLuongKhach > maxGuests) {
            return res.status(400).json({ 
                error: `Số lượng khách vượt quá sức chứa của phòng. Tối đa ${maxGuests} người.` 
            });
        }

        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .input('MaKS', sql.Int, MaKS)
            .input('MaPhong', sql.Int, MaPhong)
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .input('SoLuongKhach', sql.Int, SoLuongKhach)
            .input('YeuCauDacBiet', sql.NVarChar, YeuCauDacBiet || '')
            .input('TongTienDuKien', sql.Decimal(18, 2), TongTienDuKien)
            .input('TrangThaiBooking', sql.NVarChar, 'Tạm giữ')
            .query(`
                INSERT INTO Booking
                (MaKH, MaKS, MaPhong, NgayNhanPhong, NgayTraPhong, SoLuongKhach, YeuCauDacBiet, TongTienDuKien, TrangThaiBooking)
                OUTPUT INSERTED.MaDat
                VALUES
                (@MaKH, @MaKS, @MaPhong, @NgayNhanPhong, @NgayTraPhong, @SoLuongKhach, @YeuCauDacBiet, @TongTienDuKien, @TrangThaiBooking)
            `);

        const MaDat = result.recordset[0].MaDat;

        res.status(201).json({success: true, MaDat});
    }
    catch(err) {
        console.error('Lỗi holdBooking:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};

/**
 * Gợi ý các khoảng thời gian thay thế khi phòng không còn trống
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.suggestAlternativeDates = async (req, res) => {
    try {
        const { NgayNhanPhong, NgayTraPhong, MaLoaiPhong } = req.body;

        if (!NgayNhanPhong || !NgayTraPhong || !MaLoaiPhong) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng cung cấp đầy đủ thông tin: NgayNhanPhong, NgayTraPhong, MaLoaiPhong' 
            });
        }

        const pool = await poolPromise;

        // Tìm các khoảng thời gian trống trước và sau khoảng thời gian yêu cầu
        const result = await pool.request()
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .query(`
                WITH DateRange AS (
                    SELECT 
                        DATEADD(DAY, -7, @NgayNhanPhong) as StartDate,
                        DATEADD(DAY, 7, @NgayTraPhong) as EndDate
                ),
                BookedDates AS (
                    SELECT 
                        b.NgayNhanPhong,
                        b.NgayTraPhong
                    FROM Booking b
                    JOIN Phong p ON b.MaPhong = p.MaPhong
                    WHERE p.MaLoaiPhong = @MaLoaiPhong
                    AND b.TrangThaiBooking != N'Đã hủy'
                    AND (
                        b.TrangThaiBooking != N'Tạm Giữ'
                        OR DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15
                    )
                ),
                AvailableDates AS (
                    SELECT 
                        d.StartDate as CheckInDate,
                        d.EndDate as CheckOutDate,
                        CASE 
                            WHEN d.StartDate < @NgayNhanPhong THEN 'before'
                            ELSE 'after'
                        END as Period
                    FROM DateRange d
                    WHERE NOT EXISTS (
                        SELECT 1 FROM BookedDates b
                        WHERE (
                            b.NgayNhanPhong <= d.EndDate
                            AND b.NgayTraPhong >= d.StartDate
                        )
                    )
                )
                SELECT 
                    CheckInDate,
                    CheckOutDate,
                    Period,
                    DATEDIFF(DAY, CheckInDate, CheckOutDate) as Duration
                FROM AvailableDates
                ORDER BY 
                    CASE 
                        WHEN Period = 'before' THEN 1
                        ELSE 2
                    END,
                    ABS(DATEDIFF(DAY, CheckInDate, @NgayNhanPhong))
            `);

        const suggestions = result.recordset.map(date => ({
            checkIn: date.CheckInDate,
            checkOut: date.CheckOutDate,
            period: date.Period,
            duration: date.Duration
        }));

        res.json({
            success: true,
            data: {
                originalDates: {
                    checkIn: NgayNhanPhong,
                    checkOut: NgayTraPhong
                },
                suggestions
            }
        });
    } catch (err) {
        console.error('Lỗi suggestAlternativeDates:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi tìm kiếm thời gian thay thế' 
        });
    }
};


// Tim loai phong tren thanh Search Home Page
exports.searchAvailableRooms = async (req, res) => {
    try {
        const { location, startDate, endDate, numberOfGuests } = req.query;

        // Validate required parameters
        if (!location || !startDate || !endDate || !numberOfGuests) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: địa điểm, ngày nhận phòng, ngày trả phòng và số lượng khách'
            });
        }

        // Validate dates
        const checkIn = new Date(startDate);
        const checkOut = new Date(endDate);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng ngày không hợp lệ'
            });
        }

        if (checkIn >= checkOut) {
            return res.status(400).json({
                success: false,
                message: 'Ngày trả phòng phải sau ngày nhận phòng'
            });
        }

        // Validate number of guests
        const guests = parseInt(numberOfGuests);
        if (isNaN(guests) || guests < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng khách không hợp lệ'
            });
        }

        const pool = await poolPromise;

        // Search hotels with available rooms
        const result = await pool.request()
            .input('location', sql.NVarChar, `%${location}%`)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('numberOfGuests', sql.Int, guests)
            .query(`
                WITH AvailableRooms AS (
                    SELECT 
                        p.MaPhong,
                        p.MaKS,
                        p.MaLoaiPhong,
                        p.MaCauHinhGiuong,
                        chg.SoGiuongDoi,
                        chg.SoGiuongDon,
                        (chg.SoGiuongDoi * 2 + chg.SoGiuongDon) as MaxGuests
                    FROM Phong p
                    JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                    WHERE NOT EXISTS (
                        SELECT 1 FROM Booking b
                        WHERE b.MaPhong = p.MaPhong
                        AND b.TrangThaiBooking != N'Đã hủy'
                        AND (
                            b.NgayNhanPhong <= @endDate
                            AND b.NgayTraPhong >= @startDate
                        )
                        AND (
                            b.TrangThaiBooking != N'Tạm giữ'
                            OR (b.TrangThaiBooking = N'Tạm giữ' AND b.ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15)
                        )
                    )
                ),
                RoomTypesWithHoldStatus AS (
                    SELECT DISTINCT p.MaLoaiPhong
                    FROM Phong p
                    JOIN Booking b ON p.MaPhong = b.MaPhong
                    WHERE b.TrangThaiBooking = N'Tạm giữ'
                    AND b.ThoiGianGiuCho IS NOT NULL
                    AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15
                )
                SELECT DISTINCT
                    ks.MaKS,
                    ks.TenKS,
                    ks.DiaChi,
                    ks.HangSao,
                    ks.LoaiHinh,
                    ks.MoTaChung,
                    ks.Latitude,
                    ks.Longitude,
                    lp.MaLoaiPhong,
                    lp.TenLoaiPhong,
                    lp.GiaCoSo,
                    lp.DienTich,
                    lp.TienNghi,
                    chg.TenCauHinh as CauHinhGiuong,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon,
                    COUNT(ar.MaPhong) as SoPhongTrong
                FROM KhachSan ks
                JOIN AvailableRooms ar ON ks.MaKS = ar.MaKS
                JOIN LoaiPhong lp ON ar.MaLoaiPhong = lp.MaLoaiPhong
                JOIN CauHinhGiuong chg ON ar.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE 
                    (ks.DiaChi LIKE @location OR ks.TenKS LIKE @location)
                    AND ar.MaxGuests >= @numberOfGuests
                    AND lp.MaLoaiPhong NOT IN (SELECT MaLoaiPhong FROM RoomTypesWithHoldStatus)
                GROUP BY 
                    ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, 
                    ks.LoaiHinh, ks.MoTaChung, ks.Latitude, ks.Longitude,
                    lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo, lp.DienTich,
                    lp.TienNghi, chg.TenCauHinh, chg.SoGiuongDoi, chg.SoGiuongDon
                HAVING COUNT(ar.MaPhong) > 0
                ORDER BY ks.HangSao DESC, lp.GiaCoSo ASC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error searching available rooms:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            state: error.state,
            class: error.class,
            lineNumber: error.lineNumber,
            serverName: error.serverName,
            procName: error.procName
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm phòng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};