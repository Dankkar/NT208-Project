// backend/src/controllers/bookingController.js

const { poolPromise, sql } = require('../database/db');
const { sendReviewRequestEmail, sendBookingConfirmation } = require('../utils/emailService');
const PriceCalculationService = require('../services/priceCalculationService');



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
                AND (
                    TrangThaiBooking != N'Tạm giữ'
                    OR (TrangThaiBooking = N'Tạm giữ' AND ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) <= 15)
                )
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
                .input('TrangThaiBooking', sql.NVarChar, 'Đã Xác Nhận')
                .query(`
                    INSERT INTO Booking
                    (MaKH, MaKS, MaPhong, NgayDat, NgayNhanPhong, NgayTraPhong, SoLuongKhach, YeuCauDacBiet, TongTienDuKien, TrangThaiBooking)
                    OUTPUT INSERTED.MaDat
                    VALUES
                    (@MaKH, @MaKS, @MaPhong, @NgayDat, @NgayNhanPhong, @NgayTraPhong, @SoLuongKhach, @YeuCauDacBiet, @TongTienDuKien, @TrangThaiBooking)
                `);

            const MaDat = bookingResult.recordset[0].MaDat;

            // Lấy thông tin quản lý khách sạn
            const managerResult = await transaction.request()
                .input('MaKS', sql.Int, MaKS)
                .query(`
                    SELECT MaQL
                    FROM KhachSan
                    WHERE MaKS = @MaKS
                `);

            if (managerResult.recordset.length > 0) {
                const managerId = managerResult.recordset[0].MaQL;
                // Gửi thông báo qua Socket.IO
                global.emitBookingNotification(managerId, {
                    MaDat,
                    MaKS,
                    NgayNhanPhong,
                    NgayTraPhong,
                    SoLuongKhach,
                    TongTienDuKien
                });
            }

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


// Xem chi tiet don
exports.getBookingById = async (req, res) => {
    try {
        const { MaDat } = req.params;
        const currentUser = req.user;
        const pool = await poolPromise;

        // Kiểm tra quyền xem đơn đặt phòng
        const bookingResult = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT 
                    b.*, 
                    p.SoPhong, 
                    ks.TenKS, 
                    ks.MaKS,
                    ks.MaNguoiQuanLy,
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

        if (bookingResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn đặt phòng' });
        }

        const booking = bookingResult.recordset[0];

        // Kiểm tra quyền xem đơn đặt phòng
        const canView = 
            currentUser.LoaiUser === 'Admin' || // Admin có thể xem mọi đơn
            currentUser.MaKH === booking.MaKH || // Khách hàng xem đơn của mình
            (currentUser.LoaiUser === 'QuanLyKS' && currentUser.MaKH === booking.MaNguoiQuanLy); // Quản lý KS xem đơn của KS mình

        if (!canView) {
            return res.status(403).json({ error: 'Bạn không có quyền xem đơn đặt phòng này' });
        }

        res.json(booking);
    }
    catch(err) {
        console.error('Lỗi getBookingById:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Huy don
exports.cancelBooking = async (req, res) => {
    try {
        const { MaDat } = req.params;
        const { LyDoHuy } = req.body;
        const currentUser = req.user;
        const pool = await poolPromise;

        // Kiểm tra quyền hủy đặt phòng
        const bookingResult = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT b.MaKH, b.TrangThaiBooking, b.NgayNhanPhong, b.TongTienDuKien,
                       ks.MaKS, ks.MaNguoiQuanLy
                FROM Booking b
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                WHERE b.MaDat = @MaDat
            `);

        if (bookingResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn đặt phòng' });
        }

        const booking = bookingResult.recordset[0];
        
        // Kiểm tra quyền hủy đặt phòng
        const canCancel = 
            currentUser.MaKH === booking.MaKH || // Khách hàng hủy đơn của mình
            currentUser.LoaiUser === 'Admin' || // Admin có thể hủy mọi đơn
            (currentUser.LoaiUser === 'QuanLyKS' && currentUser.MaKH === booking.MaNguoiQuanLy); // Quản lý KS chỉ hủy đơn của KS mình

        if (!canCancel) {
            return res.status(403).json({ error: 'Bạn không có quyền hủy đơn đặt phòng này' });
        }

        // Kiểm tra trạng thái đặt phòng
        if (booking.TrangThaiBooking === 'Đã hủy') {
            return res.status(400).json({ error: 'Đơn đặt phòng đã bị hủy trước đó' });
        }

        if (booking.TrangThaiBooking === 'Đã trả phòng') {
            return res.status(400).json({ error: 'Không thể hủy đơn đã trả phòng' });
        }

        // Chỉ áp dụng chính sách hủy cho đơn đã xác nhận hoặc chờ thanh toán
        let TienHoanTra = 0;
        if (booking.TrangThaiBooking === 'Đã xác nhận' || booking.TrangThaiBooking === 'Chờ thanh toán') {
            const dayBefore = Math.floor((new Date(booking.NgayNhanPhong) - new Date()) / (1000 * 3600 * 24));
            TienHoanTra = dayBefore >= 7 ? booking.TongTienDuKien : 0;
        }

        // Cập nhật trạng thái đặt phòng
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

        res.json({ 
            message: 'Hủy đơn thành công', 
            TienHoanTra,
            refundPolicy: dayBefore >= 7 ? 'Hoàn tiền 100%' : 'Không hoàn tiền'
        });
    } catch (err) {
        console.error('Lỗi hủy đơn:', err);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
};

// Xem don dat phong theo MaKH
exports.getBookingByUser = async (req, res) => {
    try {
        const { MaKH } = req.params;
        const currentUser = req.user;

        // Kiểm tra quyền truy cập
        if (currentUser.LoaiUser !== 'Admin' && 
            currentUser.LoaiUser !== 'QuanLyKS' && 
            currentUser.MaKH !== parseInt(MaKH)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn không có quyền xem thông tin đặt phòng này' 
            });
        }

        const pool = await poolPromise;
        let query = `
            SELECT 
                b.*,
                ks.TenKS,
                ks.DiaChi,
                p.SoPhong,
                lp.TenLoaiPhong,
                lp.GiaCoSo,
                u.HoTen as TenKhachHang,
                u.Email as EmailKhachHang,
                u.SDT as SDTKhachHang,
                ks.MaNguoiQuanLy
            FROM Booking b
            JOIN KhachSan ks ON b.MaKS = ks.MaKS
            LEFT JOIN Phong p ON b.MaPhong = p.MaPhong
            LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
            JOIN NguoiDung u ON b.MaKH = u.MaKH
            WHERE b.MaKH = @MaKH
        `;

        // Nếu là QuanLyKS, chỉ xem được booking của khách sạn mình quản lý
        if (currentUser.LoaiUser === 'QuanLyKS') {
            query += ' AND ks.MaNguoiQuanLy = @MaNguoiQuanLy';
        }

        query += ' ORDER BY b.NgayDat DESC';

        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .input('MaNguoiQuanLy', sql.Int, currentUser.MaKH)
            .query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Lỗi getBookingByUser:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi lấy thông tin đặt phòng' 
        });
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
        const currentUser = req.user;

        // Kiểm tra quyền xem tất cả đơn
        if (currentUser.LoaiUser !== 'Admin' && currentUser.LoaiUser !== 'QuanLyKS') {
            return res.status(403).json({ error: 'Bạn không có quyền xem tất cả đơn đặt phòng' });
        }

        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const pool = await poolPromise;

        // Xây dựng điều kiện WHERE dựa trên quyền
        let whereClause = '';
        let params = [];

        if (currentUser.LoaiUser === 'QuanLyKS') {
            whereClause = 'WHERE b.MaKS = @MaKS';
            params.push({ name: 'MaKS', value: currentUser.MaKS });
        }

        // Đếm tổng số đơn
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM Booking b
            JOIN KhachSan ks ON b.MaKS = ks.MaKS
            JOIN Phong p ON b.MaPhong = p.MaPhong
            JOIN NguoiDung nd ON b.MaKH = nd.MaKH
            ${whereClause}
        `;
        const countRequest = pool.request();
        params.forEach(param => {
            countRequest.input(param.name, param.value);
        });
        const countResult = await countRequest.query(countQuery);

        // Lấy danh sách đơn
        const query = `
            SELECT 
                b.MaDat, b.NgayDat, b.NgayNhanPhong, b.NgayTraPhong, 
                b.TrangThaiBooking, b.TongTienDuKien,
                ks.TenKS, p.SoPhong, 
                nd.HoTen AS TenKhachHang, nd.Email, nd.SDT,
                chg.TenCauHinh as CauHinhGiuong,
                chg.SoGiuongDoi,
                chg.SoGiuongDon
            FROM Booking b
            JOIN KhachSan ks ON b.MaKS = ks.MaKS
            JOIN Phong p ON b.MaPhong = p.MaPhong
            JOIN NguoiDung nd ON b.MaKH = nd.MaKH
            JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
            ${whereClause}
            ORDER BY b.NgayDat DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const request = pool.request();
        params.forEach(param => {
            request.input(param.name, param.value);
        });
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset,
            pagination: {
                total: countResult.recordset[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.recordset[0].total / parseInt(limit))
            }
        });
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
        const check = await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .query(`
                SELECT COUNT(*) FROM Booking
                WHERE MaPhong = @MaPhong
                AND (NgayNhanPhong <= @NgayTraPhong AND NgayTraPhong >= @NgayNhanPhong)
                AND TrangThaiBooking != N'Đã hủy'
                AND (
                    TrangThaiBooking != N'Tạm giữ'
                    OR (TrangThaiBooking = N'Tạm giữ' AND ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) <= 15)
                )
            `);
        if(check.recordset[0].count > 0){
            return res.status(400).json({
                error: 'Phòng đã bị đặt trong khoảng thời gian này'
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
            .input('ThoiGianGiuCho', sql.DateTime, new Date())
            .query(`
                INSERT INTO Booking
                (MaKH, MaKS, MaPhong, NgayNhanPhong, NgayTraPhong, SoLuongKhach, YeuCauDacBiet, TongTienDuKien, TrangThaiBooking, ThoiGianGiuCho)
                OUTPUT INSERTED.MaDat
                VALUES
                (@MaKH, @MaKS, @MaPhong, @NgayNhanPhong, @NgayTraPhong, @SoLuongKhach, @YeuCauDacBiet, @TongTienDuKien, @TrangThaiBooking, @ThoiGianGiuCho)
            `);

        const MaDat = result.recordset[0].MaDat;

        res.status(201).json({
            success: true, 
            MaDat,
            message: 'Đã giữ phòng thành công. Bạn có 15 phút để hoàn tất đặt phòng.'
        });
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

        // Tìm các khoảng thời gian thay thế
        const result = await pool.request()
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .query(`
                WITH DateRange AS (
                    -- Tạo chuỗi ngày từ 7 ngày trước đến 7 ngày sau khoảng thời gian yêu cầu
                    SELECT 
                        DATEADD(DAY, -7, @NgayNhanPhong) as StartDate,
                        DATEADD(DAY, 7, @NgayTraPhong) as EndDate
                ),
                BookedDates AS (
                    -- Lấy tất cả các đặt phòng đã xác nhận hoặc đang giữ chỗ trong khoảng thời gian
                    SELECT 
                        b.NgayNhanPhong,
                        b.NgayTraPhong
                    FROM Booking b
                    JOIN Phong p ON b.MaPhong = p.MaPhong
                    WHERE p.MaLoaiPhong = @MaLoaiPhong
                    AND b.TrangThaiBooking != N'Đã hủy'
                    AND (
                        b.TrangThaiBooking != N'Tạm giữ'
                        OR (b.TrangThaiBooking = N'Tạm giữ' AND b.ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15)
                    )
                    AND (
                        (b.NgayNhanPhong <= @NgayTraPhong AND b.NgayTraPhong >= @NgayNhanPhong)
                        OR (b.NgayNhanPhong BETWEEN (SELECT StartDate FROM DateRange) AND (SELECT EndDate FROM DateRange))
                        OR (b.NgayTraPhong BETWEEN (SELECT StartDate FROM DateRange) AND (SELECT EndDate FROM DateRange))
                    )
                ),
                AvailableRanges AS (
                    -- Tìm các khoảng trống giữa các đặt phòng
                    SELECT 
                        DATEADD(DAY, 1, COALESCE(LAG(NgayTraPhong) OVER (ORDER BY NgayNhanPhong), (SELECT StartDate FROM DateRange))) as GapStart,
                        DATEADD(DAY, -1, NgayNhanPhong) as GapEnd
                    FROM BookedDates
                    UNION ALL
                    -- Xử lý trường hợp không có booking nào
                    SELECT 
                        StartDate,
                        EndDate
                    FROM DateRange
                    WHERE NOT EXISTS (SELECT 1 FROM BookedDates)
                ),
                ValidRanges AS (
                    -- Lọc các khoảng trống có đủ số ngày
                    SELECT 
                        GapStart,
                        GapEnd,
                        DATEDIFF(DAY, GapStart, GapEnd) as Duration
                    FROM AvailableRanges
                    WHERE DATEDIFF(DAY, GapStart, GapEnd) >= DATEDIFF(DAY, @NgayNhanPhong, @NgayTraPhong)
                ),
                SuggestedDates AS (
                    -- Tạo các gợi ý từ các khoảng trống
                    SELECT 
                        GapStart as CheckInDate,
                        DATEADD(DAY, DATEDIFF(DAY, @NgayNhanPhong, @NgayTraPhong), GapStart) as CheckOutDate,
                        CASE 
                            WHEN GapStart < @NgayNhanPhong THEN 'before'
                            ELSE 'after'
                        END as Period,
                        DATEDIFF(DAY, GapStart, GapEnd) as AvailableDuration,
                        ABS(DATEDIFF(DAY, GapStart, @NgayNhanPhong)) as DaysFromOriginal,
                        -- Thêm thông tin về khoảng thời gian có sẵn
                        CASE 
                            WHEN DATEDIFF(DAY, GapStart, GapEnd) >= DATEDIFF(DAY, @NgayNhanPhong, @NgayTraPhong) * 2 THEN 'extended'
                            ELSE 'standard'
                        END as AvailabilityType
                    FROM ValidRanges
                    WHERE DATEADD(DAY, DATEDIFF(DAY, @NgayNhanPhong, @NgayTraPhong), GapStart) <= GapEnd
                )
                SELECT 
                    CheckInDate,
                    CheckOutDate,
                    Period,
                    AvailableDuration,
                    DaysFromOriginal,
                    AvailabilityType
                FROM SuggestedDates
                ORDER BY 
                    CASE 
                        WHEN Period = 'before' THEN 1
                        ELSE 2
                    END,
                    DaysFromOriginal
            `);

        const suggestions = result.recordset.map(date => ({
            checkIn: date.CheckInDate,
            checkOut: date.CheckOutDate,
            period: date.Period,
            availableDuration: date.AvailableDuration,
            daysFromOriginal: date.DaysFromOriginal,
            availabilityType: date.AvailabilityType
        }));

        res.json({
            success: true,
            data: {
                originalDates: {
                    checkIn: NgayNhanPhong,
                    checkOut: NgayTraPhong,
                    duration: Math.ceil((new Date(NgayTraPhong) - new Date(NgayNhanPhong)) / (1000 * 60 * 60 * 24))
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
        const { startDate, endDate, numberOfGuests, location } = req.query;

        // Validate required parameters
        if (!startDate || !endDate || !numberOfGuests) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: ngày nhận phòng, ngày trả phòng và số lượng khách'
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
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('numberOfGuests', sql.Int, guests)
            .input('location', sql.NVarChar, location ? `%${location}%` : '%')
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
                    WHERE p.TrangThaiPhong != N'Bảo trì'  -- Chỉ loại bỏ phòng đang bảo trì
                    AND NOT EXISTS (
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
                    COUNT(ar.MaPhong) as SoPhongTrong,
                    MIN(lp.GiaCoSo) as GiaThapNhat
                FROM KhachSan ks
                JOIN AvailableRooms ar ON ks.MaKS = ar.MaKS
                JOIN LoaiPhong lp ON ar.MaLoaiPhong = lp.MaLoaiPhong
                JOIN CauHinhGiuong chg ON ar.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE 
                    (ks.DiaChi COLLATE Latin1_General_CI_AI LIKE @location OR ks.TenKS COLLATE Latin1_General_CI_AI LIKE @location)
                    AND ar.MaxGuests >= @numberOfGuests
                GROUP BY 
                    ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, 
                    ks.LoaiHinh, ks.MoTaChung, ks.Latitude, ks.Longitude,
                    lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo, lp.DienTich,
                    lp.TienNghi, chg.TenCauHinh, chg.SoGiuongDoi, chg.SoGiuongDon
                HAVING COUNT(ar.MaPhong) > 0
                ORDER BY ks.HangSao DESC, GiaThapNhat ASC
            `);

        // Format response
        const hotels = {};
        result.recordset.forEach(record => {
            if (!hotels[record.MaKS]) {
                hotels[record.MaKS] = {
                    MaKS: record.MaKS,
                    TenKS: record.TenKS,
                    DiaChi: record.DiaChi,
                    HangSao: record.HangSao,
                    LoaiHinh: record.LoaiHinh,
                    MoTaChung: record.MoTaChung,
                    Latitude: record.Latitude,
                    Longitude: record.Longitude,
                    roomTypes: []
                };
            }

            hotels[record.MaKS].roomTypes.push({
                MaLoaiPhong: record.MaLoaiPhong,
                TenLoaiPhong: record.TenLoaiPhong,
                GiaCoSo: record.GiaCoSo,
                DienTich: record.DienTich,
                TienNghi: record.TienNghi,
                CauHinhGiuong: record.CauHinhGiuong,
                SoGiuongDoi: record.SoGiuongDoi,
                SoGiuongDon: record.SoGiuongDon,
                SoPhongTrong: record.SoPhongTrong
            });
        });

        res.json({
            success: true,
            data: Object.values(hotels)
        });
    } catch (error) {
        console.error('Error searching available rooms:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm phòng'
        });
    }
};

// Check-in
exports.checkIn = async (req, res) => {
    try {
        const { MaDat } = req.params;
        const currentUser = req.user;
        const pool = await poolPromise;

        // Kiểm tra quyền check-in
        const bookingResult = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT b.TrangThaiBooking, b.NgayNhanPhong, b.MaPhong, b.MaKS,
                       ks.MaNguoiQuanLy
                FROM Booking b
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                WHERE b.MaDat = @MaDat
            `);

        if (bookingResult.recordset.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy đơn đặt phòng" });
        }

        const booking = bookingResult.recordset[0];
        
        // Kiểm tra quyền check-in
        const canCheckIn = 
            currentUser.LoaiUser === 'Admin' || // Admin có thể check-in mọi đơn
            (currentUser.LoaiUser === 'QuanLyKS' && currentUser.MaKH === booking.MaNguoiQuanLy); // Quản lý KS chỉ check-in đơn của KS mình

        if (!canCheckIn) {
            return res.status(403).json({ error: "Bạn không có quyền thực hiện check-in" });
        }

        // Kiểm tra điều kiện check-in
        if (booking.TrangThaiBooking !== 'Đã xác nhận') {
            return res.status(400).json({ error: "Chỉ có thể check-in đơn đã xác nhận" });
        }

        const checkInDate = new Date(booking.NgayNhanPhong);
        const today = new Date();
        if (today < checkInDate) {
            return res.status(400).json({ error: "Chưa đến ngày nhận phòng" });
        }

        // Bắt đầu transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Cập nhật trạng thái phòng
            await transaction.request()
                .input('MaPhong', sql.Int, booking.MaPhong)
                .input('TrangThaiPhong', sql.NVarChar, 'Đang ở')
                .query(`
                    UPDATE Phong
                    SET TrangThaiPhong = @TrangThaiPhong
                    WHERE MaPhong = @MaPhong
                `);

            // Cập nhật trạng thái booking
            await transaction.request()
                .input('MaDat', sql.Int, MaDat)
                .input('TrangThaiBooking', sql.NVarChar, 'Đã nhận phòng')
                .input('ThoiGianCheckIn', sql.DateTime, new Date())
                .query(`
                    UPDATE Booking
                    SET TrangThaiBooking = @TrangThaiBooking,
                        ThoiGianCheckIn = @ThoiGianCheckIn
                    WHERE MaDat = @MaDat
                `);

            await transaction.commit();
            res.json({ message: "Check-in thành công" });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};

// Check-out
exports.checkOut = async (req, res) => {
    try {
        const { MaDat } = req.params;
        const currentUser = req.user;
        const pool = await poolPromise;

        // Kiểm tra quyền check-out
        const bookingResult = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT b.TrangThaiBooking, b.NgayTraPhong, b.MaPhong, b.MaKS,
                       ks.MaNguoiQuanLy,
                       nd.Email, nd.HoTen, ks.TenKS
                FROM Booking b
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                JOIN NguoiDung nd ON b.MaKH = nd.MaKH
                WHERE b.MaDat = @MaDat
            `);

        if (bookingResult.recordset.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy đơn đặt phòng" });
        }

        const booking = bookingResult.recordset[0];
        
        // Kiểm tra quyền check-out
        const canCheckOut = 
            currentUser.LoaiUser === 'Admin' || // Admin có thể check-out mọi đơn
            (currentUser.LoaiUser === 'QuanLyKS' && currentUser.MaKH === booking.MaNguoiQuanLy); // Quản lý KS chỉ check-out đơn của KS mình

        if (!canCheckOut) {
            return res.status(403).json({ error: "Bạn không có quyền thực hiện check-out" });
        }
        
        // Kiểm tra điều kiện check-out
        if (booking.TrangThaiBooking !== 'Đã nhận phòng') {
            return res.status(400).json({ error: "Chỉ có thể check-out đơn đã nhận phòng" });
        }

        // Bắt đầu transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Cập nhật trạng thái phòng
            await transaction.request()
                .input('MaPhong', sql.Int, booking.MaPhong)
                .input('TrangThaiPhong', sql.NVarChar, 'Trống')
                .query(`
                    UPDATE Phong
                    SET TrangThaiPhong = @TrangThaiPhong
                    WHERE MaPhong = @MaPhong
                `);

            // Cập nhật trạng thái booking
            await transaction.request()
                .input('MaDat', sql.Int, MaDat)
                .input('TrangThaiBooking', sql.NVarChar, 'Đã trả phòng')
                .input('ThoiGianCheckOut', sql.DateTime, new Date())
                .query(`
                    UPDATE Booking
                    SET TrangThaiBooking = @TrangThaiBooking,
                        ThoiGianCheckOut = @ThoiGianCheckOut
                    WHERE MaDat = @MaDat
                `);

            await transaction.commit();

            // Gửi email mời đánh giá
            try {
                await sendReviewRequestEmail(booking.Email, {
                    guestName: booking.HoTen,
                    hotelName: booking.TenKS,
                    bookingId: MaDat
                });
            } catch (emailErr) {
                console.error("Lỗi gửi email:", emailErr);
            }

            res.json({ 
                message: "Check-out thành công"
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};