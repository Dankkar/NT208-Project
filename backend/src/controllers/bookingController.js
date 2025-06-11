// backend/src/controllers/bookingController.js
const { poolPromise, sql } = require('../database/db');
const { sendReviewRequestEmail, sendBookingConfirmation, sendBookingNotificationToManager } = require('../utils/emailService');
const PriceCalculationService = require('../services/priceCalculationService');



// Tao don dat phong
exports.createBooking = async (req, res) => {
    try {
        const {
            services, promotionCode,
            // Guest information (if not logged in)
            guestInfo,
            // Payment information
            paymentInfo
        } = req.body;

        const sessionId = req.session.id;
        const currentUser = req.user;
        const bookingInfo = req.session.bookingInfo;

        if (!bookingInfo) {
            return res.status(400).json({ error: "Không tìm thấy thông tin đặt phòng. Vui lòng thử lại." });
        }

        const pool = await poolPromise;

        // Verify the held booking is still valid
        const heldBookingResult = await pool.request()
            .input('MaDat', sql.Int, bookingInfo.MaDat)
            .query(`
                SELECT * FROM Booking
                WHERE MaDat = @MaDat
                AND TrangThaiBooking = N'Tạm giữ'
                AND ThoiGianGiuCho IS NOT NULL
                AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) <= 15
            `);

        if (heldBookingResult.recordset.length === 0) {
            return res.status(400).json({ error: "Phiên đặt phòng đã hết hạn. Vui lòng thử lại." });
        }

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            let MaKH = currentUser ? currentUser.MaKH : null;
            let MaKhach = null;

            // If user is not logged in, create guest record
            if (!currentUser) {
                if (!guestInfo) {
                    throw new Error("Thông tin khách hàng là bắt buộc");
                }

                const guestResult = await transaction.request()
                    .input('HoTen', sql.NVarChar, guestInfo.HoTen)
                    .input('Email', sql.NVarChar, guestInfo.Email)
                    .input('SDT', sql.NVarChar, guestInfo.SDT)
                    .input('CCCD', sql.NVarChar, guestInfo.CCCD || null)
                    .input('NgaySinh', sql.Date, guestInfo.NgaySinh || null)
                    .input('GioiTinh', sql.NVarChar, guestInfo.GioiTinh || null)
                    .query(`
                        INSERT INTO Guests (HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh)
                        OUTPUT INSERTED.MaKhach
                        VALUES (@HoTen, @Email, @SDT, @CCCD, @NgaySinh, @GioiTinh)
                    `);

                MaKhach = guestResult.recordset[0].MaKhach;
            }

            // Get room price and calculate total
            const roomPriceResult = await transaction.request()
                .input('MaPhong', sql.Int, bookingInfo.MaPhong)
                .query(`
                    SELECT lp.GiaCoSo
                    FROM Phong p
                    JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                    WHERE p.MaPhong = @MaPhong
                `);

            if(roomPriceResult.recordset.length === 0) {
                throw new Error("Không tìm thấy thông tin phòng");
            }

            const basePrice = roomPriceResult.recordset[0].GiaCoSo;

            // Check and get promotion info if any
            let promotion = null;
            if (promotionCode) {
                const promotionResult = await transaction.request()
                    .input('MaCodeKM', sql.NVarChar, promotionCode)
                    .input('currentDate', sql.DateTime, new Date())
                    .query(`
                        SELECT MaKM, TenKM, LoaiKM, GiaTriKM
                        FROM KhuyenMai
                        WHERE MaCodeKM = @MaCodeKM
                        AND IsActive = 1
                        AND @currentDate BETWEEN NgayBD AND NgayKT
                    `);

                if (promotionResult.recordset.length > 0) {
                    promotion = promotionResult.recordset[0];
                }
            }

            // Get service details if any
            let serviceDetails = [];
            if (services && services.length > 0) {
                const serviceIds = services.map(s => s.MaLoaiDV);
                const serviceResult = await transaction.request()
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

            // Calculate total price
            const bookingDetails = {
                basePrice,
                checkIn: bookingInfo.NgayNhanPhong,
                checkOut: bookingInfo.NgayTraPhong,
                services: serviceDetails,
                promotion: promotion ? {
                    type: promotion.LoaiKM === 'Giảm %' ? 'PERCENTAGE' : 'FIXED',
                    value: promotion.GiaTriKM,
                    code: promotionCode,
                    id: promotion.MaKM,
                    name: promotion.TenKM
                } : null
            };

            console.log('Booking details for price calculation:', {
                basePrice,
                checkIn: bookingInfo.NgayNhanPhong,
                checkOut: bookingInfo.NgayTraPhong,
                services: serviceDetails,
                promotion: promotion
            });

            const priceDetails = PriceCalculationService.calculateTotalPrice(bookingDetails);
            console.log('Price calculation result:', priceDetails);
            
            const TongTienDuKien = priceDetails.finalPrice;
            console.log('TongTienDuKien:', TongTienDuKien);

            // Create guest account representative for all guests if not exists
            let guestRepresentativeResult = await transaction.request()
                .query(`
                    SELECT MaKH FROM NguoiDung 
                    WHERE LoaiUser = 'Guest' AND Email = 'guest@system.internal'
                `);

            if (guestRepresentativeResult.recordset.length === 0) {
                // Create guest representative account if it doesn't exist
                guestRepresentativeResult = await transaction.request()
                    .input('LoaiUser', sql.NVarChar, 'Guest')
                    .input('HoTen', sql.NVarChar, 'Guest Representative Account')
                    .input('Email', sql.NVarChar, 'guest@system.internal')
                    .input('MatKhauHash', sql.NVarChar, 'GUEST_REPRESENTATIVE_NO_LOGIN')
                    .query(`
                        INSERT INTO NguoiDung (LoaiUser, HoTen, Email, MatKhauHash)
                        OUTPUT INSERTED.MaKH
                        VALUES (@LoaiUser, @HoTen, @Email, @MatKhauHash)
                    `);
            }
            
            const guestRepresentativeId = guestRepresentativeResult.recordset[0].MaKH;

            // Determine which MaKH to use for the booking and invoice
            let bookingMaKH, bookingMaKhach;
            if (currentUser) {
                // If user is logged in, use their MaKH
                bookingMaKH = currentUser.MaKH;
                bookingMaKhach = null;
            } else {
                // If user is guest, use the guest representative account for MaKH
                // and actual guest info for MaKhach
                bookingMaKH = guestRepresentativeId;
                bookingMaKhach = MaKhach; // Guest record created earlier
            }

            // Update booking status to confirmed
            await transaction.request()
                .input('MaDat', sql.Int, bookingInfo.MaDat)
                .input('MaKH', sql.Int, bookingMaKH)
                .input('MaKhach', sql.Int, bookingMaKhach)
                .input('TrangThaiBooking', sql.NVarChar, 'Đã xác nhận')
                .input('TongTienDuKien', sql.Decimal(18, 2), TongTienDuKien)
                .query(`
                    UPDATE Booking
                    SET MaKH = @MaKH,
                        MaKhach = @MaKhach,
                        TrangThaiBooking = @TrangThaiBooking,
                        ThoiGianGiuCho = NULL,
                        TongTienDuKien = @TongTienDuKien
                    WHERE MaDat = @MaDat
                `);

            // Add services if any
            if (serviceDetails.length > 0) {
                for (const service of serviceDetails) {
                    await transaction.request()
                        .input('MaDat', sql.Int, bookingInfo.MaDat)
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

            // Get guest account ID
            // const guestAccountResult = await transaction.request()
            //     .query('SELECT MaKH FROM GuestAccount');
            // const guestAccountId = guestAccountResult.recordset[0].MaKH;

            // Create invoice
            const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
            const invoiceResult = await transaction.request()
                .input('MaDat', sql.Int, bookingInfo.MaDat)
                .input('MaKH', sql.Int, bookingMaKH)
                .input('MaKM', sql.Int, promotion?.MaKM || null)
                .input('TongTienPhong', sql.Decimal(18, 2), TongTienDuKien)
                .input('HinhThucTT', sql.NVarChar, paymentInfo.HinhThucTT)
                .input('TrangThaiThanhToan', sql.NVarChar, 'Đã thanh toán')
                .input('NgayThanhToan', sql.DateTime, nowVN)
                .query(`
                    INSERT INTO HoaDon
                    (MaDat, MaKH, MaKM, TongTienPhong, HinhThucTT, TrangThaiThanhToan, NgayThanhToan)
                    OUTPUT INSERTED.MaHD
                    VALUES
                    (@MaDat, @MaKH, @MaKM, @TongTienPhong, @HinhThucTT, @TrangThaiThanhToan, @NgayThanhToan)
                `);

            await transaction.commit();

            // Get room information for email
            const roomInfoResult = await pool.request()
                .input('MaDat', sql.Int, bookingInfo.MaDat)
                .query(`
                    SELECT p.SoPhong, ks.TenKS
                    FROM Booking b
                    JOIN Phong p ON b.MaPhong = p.MaPhong
                    JOIN KhachSan ks ON b.MaKS = ks.MaKS
                    WHERE b.MaDat = @MaDat
                `);

            const roomInfo = roomInfoResult.recordset[0];

            // Send confirmation email
            try {
                const emailInfo = {
                    guestEmail: currentUser ? currentUser.Email : guestInfo.Email,
                    guestName: currentUser ? currentUser.HoTen : guestInfo.HoTen,
                    bookingId: bookingInfo.MaDat,
                    hotelName: roomInfo.TenKS,
                    roomNumber: roomInfo.SoPhong,
                    checkIn: bookingInfo.NgayNhanPhong,
                    checkOut: bookingInfo.NgayTraPhong,
                    totalPrice: TongTienDuKien
                };
                await sendBookingConfirmation(emailInfo);
            } catch (emailErr) {
                console.error('Error sending confirmation email:', emailErr);
            }

            // Send email notification to hotel manager
            try {
                const hotelManagerResult = await pool.request()
                    .input('MaKS', sql.Int, bookingInfo.MaKS)
                    .query(`
                        SELECT ks.MaNguoiQuanLy, nd.HoTen as TenQuanLy, nd.Email as EmailQuanLy
                        FROM KhachSan ks
                        LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
                        WHERE ks.MaKS = @MaKS AND nd.Email IS NOT NULL
                    `);

                if (hotelManagerResult.recordset.length > 0 && hotelManagerResult.recordset[0].MaNguoiQuanLy) {
                    const managerInfo = hotelManagerResult.recordset[0];
                    
                    // Get guest name - either from currentUser database or guestInfo
                    let guestName;
                    if (currentUser) {
                        // For logged-in users, get name from database to ensure accuracy
                        const userInfoResult = await pool.request()
                            .input('MaKH', sql.Int, currentUser.MaKH)
                            .query(`SELECT HoTen FROM NguoiDung WHERE MaKH = @MaKH`);
                        guestName = userInfoResult.recordset.length > 0 ? 
                                   userInfoResult.recordset[0].HoTen : 
                                   (currentUser.HoTen || 'Khách hàng');
                    } else {
                        guestName = guestInfo.HoTen;
                    }
                    
                    // Send email notification to hotel manager
                    const managerEmailInfo = {
                        managerEmail: managerInfo.EmailQuanLy,
                        managerName: managerInfo.TenQuanLy,
                        bookingId: bookingInfo.MaDat,
                        hotelName: roomInfo.TenKS,
                        roomNumber: roomInfo.SoPhong,
                        guestName: guestName,
                        checkIn: bookingInfo.NgayNhanPhong,
                        checkOut: bookingInfo.NgayTraPhong,
                        totalPrice: TongTienDuKien,
                    };
                    
                    await sendBookingNotificationToManager(managerEmailInfo);
                    console.log(`Email notification sent to hotel manager ${managerInfo.TenQuanLy} for booking ${bookingInfo.MaDat}`);
                }
            } catch (notificationErr) {
                console.error('Error sending email notification to hotel manager:', notificationErr);
            }

            // Clear booking info from session
            delete req.session.bookingInfo;

            res.status(201).json({
                success: true,
                message: 'Đặt phòng thành công',
                data: {
                    MaDat: bookingInfo.MaDat,
                    MaHD: invoiceResult.recordset[0].MaHD,
                    guestInfo: currentUser ? null : guestInfo,
                    services: serviceDetails,
                    paymentInfo,
                    priceDetails
                }
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Lỗi createBooking:', err);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};


// Xem chi tiet don
exports.getBookingById = async (req, res) => {
    try {
        const { MaDat } = req.params;
        const currentUser = req.user;
        const pool = await poolPromise;

        // Lấy thông tin booking với image URLs
        const bookingResult = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT 
                    b.*, 
                    p.SoPhong, 
                    ks.TenKS, 
                    ks.DiaChi,
                    ks.MaKS,
                    ks.MaNguoiQuanLy,
                    nd.HoTen,
                    lp.TenLoaiPhong,
                    chg.TenCauHinh as CauHinhGiuong,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon,
                    aks.DuongDanAnh as AnhKhachSan
                FROM Booking b 
                JOIN Phong p ON b.MaPhong = p.MaPhong
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                JOIN NguoiDung nd ON b.MaKH = nd.MaKH
                JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                LEFT JOIN AnhKhachSan aks ON ks.MaKS = aks.MaKS AND aks.LoaiAnh = 'main'
                WHERE b.MaDat = @MaDat
            `);

        if (bookingResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn đặt phòng' });
        }

        const booking = bookingResult.recordset[0];

        // Kiểm tra quyền xem đơn đặt phòng
        if (currentUser) {
            // User đã đăng nhập - kiểm tra quyền như cũ
            const canView = 
                currentUser.role === 'Admin' || // Admin có thể xem mọi đơn
                currentUser.MaKH === booking.MaKH || // Khách hàng xem đơn của mình
                (currentUser.role === 'QuanLyKS' && currentUser.MaKH === booking.MaNguoiQuanLy); // Quản lý KS xem đơn của KS mình

            if (!canView) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Bạn không có quyền xem đơn đặt phòng này' 
                });
            }
        } else {
            // Guest (không đăng nhập) - chỉ cho xem booking đã hoàn thành để đánh giá
            if (booking.TrangThaiBooking !== 'Đã trả phòng') {
                return res.status(403).json({ 
                    success: false,
                    message: 'Chỉ có thể xem thông tin booking đã hoàn thành để đánh giá' 
                });
            }
        }

        // Thêm thông tin bổ sung - image URLs
        booking.AnhKhachSanUrl = booking.AnhKhachSan 
            ? `${req.protocol}://${req.get('host')}/${booking.AnhKhachSan}`
            : null;

        res.json({
            success: true,
            data: booking
        });
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
            currentUser.role === 'Admin' || // Admin có thể hủy mọi đơn
            (currentUser.role === 'QuanLyKS' && currentUser.MaKH === booking.MaNguoiQuanLy); // Quản lý KS chỉ hủy đơn của KS mình

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
        let refundPolicy = 'Không hoàn tiền';
        
        if (booking.TrangThaiBooking === 'Đã xác nhận' || booking.TrangThaiBooking === 'Chờ thanh toán') {
            const dayBefore = Math.floor((new Date(booking.NgayNhanPhong) - new Date()) / (1000 * 3600 * 24));
            if (dayBefore >= 7) {
                TienHoanTra = booking.TongTienDuKien;
                refundPolicy = 'Hoàn tiền 100%';
            } else {
                TienHoanTra = 0;
                refundPolicy = 'Không hoàn tiền';
            }
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
            refundPolicy
        });
    } catch (err) {
        console.error('Lỗi hủy đơn:', err);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
};

// Xem don dat phong theo MaKH - cho Admin/QuanLyKS xem của user khác
exports.getBookingByUser = async (req, res) => {
    try {
        const { MaKH } = req.params;
        const currentUser = req.user;

        // Kiểm tra quyền truy cập
        if (currentUser.role !== 'Admin' && 
            currentUser.role !== 'QuanLyKS') {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn không có quyền xem thông tin đặt phòng của user khác' 
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
        if (currentUser.role === 'QuanLyKS') {
            query += ' AND ks.MaNguoiQuanLy = @MaNguoiQuanLy';
        }

        query += ' ORDER BY b.NgayDat DESC';

        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .input('MaNguoiQuanLy', sql.Int, currentUser.MaKH)
            .query(query);

        // Lấy thông tin dịch vụ cho từng booking
        if (result.recordset.length > 0) {
            const bookingIds = result.recordset.map(booking => booking.MaDat);
            
            const servicesResult = await pool.request()
                .input('BookingIds', sql.NVarChar, bookingIds.join(','))
                .query(`
                    SELECT 
                        sdv.MaDat,
                        sdv.MaSuDungDV,
                        sdv.SoLuong,
                        sdv.ThoiGianSuDung,
                        sdv.GiaTaiThoiDiemSuDung,
                        sdv.ThanhTien,
                        sdv.GhiChu,
                        ldv.TenLoaiDV,
                        ldv.MoTaDV,
                        ldv.GiaDV as GiaHienTai
                    FROM SuDungDichVu sdv
                    JOIN LoaiDichVu ldv ON sdv.MaLoaiDV = ldv.MaLoaiDV
                    WHERE sdv.MaDat IN (SELECT value FROM STRING_SPLIT(@BookingIds, ','))
                    ORDER BY sdv.ThoiGianSuDung DESC
                `);

            // Gom nhóm dịch vụ theo booking
            const servicesByBooking = {};
            servicesResult.recordset.forEach(service => {
                if (!servicesByBooking[service.MaDat]) {
                    servicesByBooking[service.MaDat] = [];
                }
                servicesByBooking[service.MaDat].push(service);
            });

            // Thêm thông tin dịch vụ vào mỗi booking
            result.recordset.forEach(booking => {
                booking.DichVuSuDung = servicesByBooking[booking.MaDat] || [];
                booking.TongTienDichVu = booking.DichVuSuDung.reduce((total, service) => total + (service.ThanhTien || 0), 0);
            });
        }

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

// Xem booking của chính mình (sử dụng MaKH từ session)
exports.getMyBookings = async (req, res) => {
    try {
        const currentUser = req.user;
        console.log('🔍 DEBUG getMyBookings - User from session:', currentUser);
        
        if (!currentUser || !currentUser.MaKH) {
            console.log('❌ DEBUG getMyBookings - No user in session');
            return res.status(401).json({ 
                success: false, 
                message: 'Không tìm thấy thông tin người dùng trong session' 
            });
        }

        // Lấy thông tin phân trang từ query parameters
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Sử dụng MaKH từ session thay vì từ params
        const MaKH = currentUser.MaKH;
        console.log('🔍 DEBUG getMyBookings - Searching for bookings with MaKH:', MaKH);
        const pool = await poolPromise;

        // Đếm tổng số đơn đặt phòng của user
        const countQuery = `
            SELECT COUNT(*) as total
            FROM Booking b
            WHERE b.MaKH = @MaKH
        `;
        
        const countResult = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .query(countQuery);
        
        const query = `
            SELECT 
                b.*,
                ks.TenKS,
                ks.DiaChi,
                ks.HangSao,
                p.SoPhong,
                lp.TenLoaiPhong,
                lp.GiaCoSo,
                lp.DuongDanAnh as AnhLoaiPhong,
                u.HoTen as TenKhachHang,
                u.Email as EmailKhachHang,
                u.SDT as SDTKhachHang,
                ak.DuongDanAnh as AnhKhachSan
            FROM Booking b
            JOIN KhachSan ks ON b.MaKS = ks.MaKS
            LEFT JOIN Phong p ON b.MaPhong = p.MaPhong
            LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
            JOIN NguoiDung u ON b.MaKH = u.MaKH
            LEFT JOIN AnhKhachSan ak ON ks.MaKS = ak.MaKS
                AND ak.LoaiAnh = 'main'
                AND ak.IsActive = 1
                AND ak.MaAnh = (
                    SELECT TOP 1 MaAnh 
                    FROM AnhKhachSan 
                    WHERE MaKS = ks.MaKS AND IsActive = 1 AND LoaiAnh = 'main'
                    ORDER BY ThuTu ASC, NgayThem ASC
                )
            WHERE b.MaKH = @MaKH
            ORDER BY 
                b.NgayDat DESC,  -- Sắp xếp theo ngày đặt gần nhất trước
                CASE 
                    WHEN b.TrangThaiBooking = N'Đã xác nhận' THEN 1
                    WHEN b.TrangThaiBooking = N'Đã nhận phòng' THEN 2
                    ELSE 3
                END,
                b.NgayNhanPhong ASC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, parseInt(limit))
            .query(query);
            
        console.log('🔍 DEBUG getMyBookings - Found bookings:', result.recordset.length);
        console.log('🔍 DEBUG getMyBookings - Booking details:', result.recordset.map(b => ({MaDat: b.MaDat, MaKH: b.MaKH, TrangThaiBooking: b.TrangThaiBooking})));

        // Lấy thông tin dịch vụ cho từng booking
        if (result.recordset.length > 0) {
            const bookingIds = result.recordset.map(booking => booking.MaDat);
            
            const servicesResult = await pool.request()
                .input('BookingIds', sql.NVarChar, bookingIds.join(','))
                .query(`
                    SELECT 
                        sdv.MaDat,
                        sdv.MaSuDungDV,
                        sdv.SoLuong,
                        sdv.ThoiGianSuDung,
                        sdv.GiaTaiThoiDiemSuDung,
                        sdv.ThanhTien,
                        sdv.GhiChu,
                        ldv.TenLoaiDV,
                        ldv.MoTaDV,
                        ldv.GiaDV as GiaHienTai
                    FROM SuDungDichVu sdv
                    JOIN LoaiDichVu ldv ON sdv.MaLoaiDV = ldv.MaLoaiDV
                    WHERE sdv.MaDat IN (SELECT value FROM STRING_SPLIT(@BookingIds, ','))
                    ORDER BY sdv.ThoiGianSuDung DESC
                `);

            // Gom nhóm dịch vụ theo booking
            const servicesByBooking = {};
            servicesResult.recordset.forEach(service => {
                if (!servicesByBooking[service.MaDat]) {
                    servicesByBooking[service.MaDat] = [];
                }
                servicesByBooking[service.MaDat].push(service);
            });

            // Thêm thông tin dịch vụ và xử lý đường dẫn ảnh vào mỗi booking
            result.recordset.forEach(booking => {
                booking.DichVuSuDung = servicesByBooking[booking.MaDat] || [];
                booking.TongTienDichVu = booking.DichVuSuDung.reduce((total, service) => total + (service.ThanhTien || 0), 0);
                booking.TongSoDichVu = booking.DichVuSuDung.length;
                
                // Tạo đường dẫn đầy đủ cho ảnh khách sạn
                booking.AnhKhachSanUrl = booking.AnhKhachSan 
                    ? `${req.protocol}://${req.get('host')}/${booking.AnhKhachSan}`
                    : null;
                    
                // Tạo đường dẫn đầy đủ cho ảnh loại phòng
                booking.AnhLoaiPhongUrl = booking.AnhLoaiPhong 
                    ? `${req.protocol}://${req.get('host')}/${booking.AnhLoaiPhong}`
                    : null;
            });
        } else {
            // Xử lý đường dẫn ảnh cho trường hợp không có booking nào
            result.recordset.forEach(booking => {
                booking.DichVuSuDung = [];
                booking.TongTienDichVu = 0;
                booking.TongSoDichVu = 0;
                
                // Tạo đường dẫn đầy đủ cho ảnh khách sạn
                booking.AnhKhachSanUrl = booking.AnhKhachSan 
                    ? `${req.protocol}://${req.get('host')}/${booking.AnhKhachSan}`
                    : null;
                    
                // Tạo đường dẫn đầy đủ cho ảnh loại phòng
                booking.AnhLoaiPhongUrl = booking.AnhLoaiPhong 
                    ? `${req.protocol}://${req.get('host')}/${booking.AnhLoaiPhong}`
                    : null;
            });
        }

        res.json({
            success: true,
            data: result.recordset,
            pagination: {
                total: countResult.recordset[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.recordset[0].total / parseInt(limit)),
                hasNextPage: parseInt(page) < Math.ceil(countResult.recordset[0].total / parseInt(limit)),
                hasPrevPage: parseInt(page) > 1
            },
            message: `Tìm thấy ${result.recordset.length} đơn đặt phòng trên trang ${page}`
        });
    } catch (err) {
        console.error('Lỗi getMyBookings:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi lấy thông tin đặt phòng của bạn' 
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
        console.log("[getAllBookings] Requesting User:", JSON.stringify(currentUser, null, 2));

        // 1. Sửa Kiểm Tra Quyền (dùng 'role')
        if (!currentUser || !currentUser.role || (currentUser.role !== 'Admin' && currentUser.role !== 'QuanLyKS')) {
            console.error("[getAllBookings] Permission Denied. Role not Admin or QuanLyKS. Actual role:", currentUser ? currentUser.role : 'N/A');
            return res.status(403).json({ error: 'Bạn không có quyền xem danh sách đặt phòng này.' });
        }

        const { page = 1, limit = 10 } = req.query;
        const numericPage = parseInt(page, 10);
        const numericLimit = parseInt(limit, 10);
        const offset = (numericPage - 1) * numericLimit;

        const pool = await poolPromise;
        const request = pool.request(); // Tạo request một lần để thêm input

        let whereConditions = []; // Mảng các điều kiện WHERE
        let countWhereConditions = []; // Điều kiện cho count query

        // 2. Sửa Filter theo Role
        if (currentUser.role === 'QuanLyKS') {
            if (currentUser.MaKS) { // Đảm bảo QuanLyKS có MaKS trong token
                whereConditions.push('b.MaKS = @MaKS_Filter');
                countWhereConditions.push('b.MaKS = @MaKS_Filter'); // Tương tự cho count
                request.input('MaKS_Filter', sql.Int, currentUser.MaKS);
                console.log(`[getAllBookings] Filtering for QuanLyKS - MaKS: ${currentUser.MaKS}`);
            } else {
                console.error("[getAllBookings] QuanLyKS user does not have MaKS property in token.");
                return res.status(403).json({ error: 'Thông tin tài khoản quản lý không đầy đủ để lọc khách sạn.' });
            }
        }
        // Nếu là 'Admin', whereConditions sẽ rỗng, lấy tất cả.

        // Xây dựng mệnh đề WHERE hoàn chỉnh
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const countWhereClause = countWhereConditions.length > 0 ? `WHERE ${countWhereConditions.join(' AND ')}` : '';

        // 3. Đếm tổng số đơn (có thể tối ưu JOIN nếu chỉ filter theo Booking.MaKS)
        const countQuery = `
            SELECT COUNT(b.MaDat) as total
            FROM Booking b
            -- Chỉ JOIN nếu thực sự cần thiết cho điều kiện WHERE hoặc COUNT.
            -- Nếu QuanLyKS filter bằng b.MaKS thì các JOIN này không cần cho COUNT.
            -- LEFT JOIN KhachSan ks ON b.MaKS = ks.MaKS
            -- LEFT JOIN Phong p ON b.MaPhong = p.MaPhong
            -- LEFT JOIN NguoiDung nd ON b.MaKH = nd.MaKH
            ${countWhereClause}
        `;
        // Log count query để kiểm tra
        console.log("[getAllBookings] Count Query:", countQuery.replace(/\s+/g, ' ').trim());
        // Input cho count query đã được thêm vào request ở trên nếu là QuanLyKS

        const countResult = await request.query(countQuery); // Sử dụng lại request đã có input (nếu có)
        const totalBookings = countResult.recordset[0].total;

        // 4. Lấy danh sách đơn (thêm TenLoaiPhong, xử lý các JOIN)
        const dataQuery = `
            SELECT
                b.MaDat, b.NgayDat, b.NgayNhanPhong, b.NgayTraPhong,
                b.TrangThaiBooking, b.TongTienDuKien,
                ks.TenKS, p.SoPhong,
                lp.TenLoaiPhong, -- Thêm tên loại phòng
                nd.HoTen AS TenKhachHang, nd.Email AS EmailKhachHang, nd.SDT AS SdtKhachHang
                -- Các cột CauHinhGiuong có thể thêm lại nếu cần
            FROM Booking b
            JOIN KhachSan ks ON b.MaKS = ks.MaKS
            JOIN Phong p ON b.MaPhong = p.MaPhong
            JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong -- JOIN để lấy TenLoaiPhong
            JOIN NguoiDung nd ON b.MaKH = nd.MaKH
            -- LEFT JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
            ${whereClause} -- Áp dụng filter cho QuanLyKS ở đây
            ORDER BY 
                CASE 
                    WHEN b.TrangThaiBooking = N'Đã xác nhận' THEN 1
                    WHEN b.TrangThaiBooking = N'Đã nhận phòng' THEN 2
                    ELSE 3
                END,
                ABS(DATEDIFF(DAY, GETDATE(), b.NgayNhanPhong)) ASC,
                b.NgayNhanPhong ASC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        // Thêm input cho pagination
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, numericLimit);

        const result = await request.query(dataQuery);

        res.json({
            success: true,
            data: result.recordset,
            pagination: {
                total: totalBookings,
                page: numericPage,
                limit: numericLimit,
                totalPages: Math.ceil(totalBookings / numericLimit) || 1 // Đảm bảo không phải 0 nếu total 0
            }
        });
    }
    catch (err) {
        console.error('Lỗi getAllBookings:', err.message, err.stack);
        res.status(500).json({error: 'Lỗi server', details: err.message});
    }
};

//API Hold booking
exports.holdBooking = async (req, res) => {
    try {
        const {
            MaKS, MaPhong, MaLoaiPhong, // Accept both MaPhong and MaLoaiPhong
            NgayNhanPhong, NgayTraPhong,
            SoLuongKhach, YeuCauDacBiet,
            TongTienDuKien
        } = req.body;

        console.log('holdBooking - Received data:', { MaKS, MaPhong, MaLoaiPhong, NgayNhanPhong, NgayTraPhong, SoLuongKhach });

        const currentUser = req.user; // Will be undefined for guests

        // Check if this session already has a held booking
        if (req.session.bookingInfo) {
            // Verify booking is still valid in database before blocking new booking
            const pool = await poolPromise;
            const checkValid = await pool.request()
                .input('MaDat', sql.Int, req.session.bookingInfo.MaDat)
                .query(`
                    SELECT * FROM Booking 
                    WHERE MaDat = @MaDat 
                    AND TrangThaiBooking = N'Tạm giữ' 
                    AND ThoiGianGiuCho IS NOT NULL 
                    AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) <= 15
                `);
            
            if (checkValid.recordset.length === 0) {
                // Booking has expired or been cancelled, clear session
                delete req.session.bookingInfo;
                console.log('Cleared expired booking from session:', req.session.bookingInfo?.MaDat);
            } else {
                // Booking is still valid, block new booking
                return res.status(400).json({
                    error: 'Bạn đã có một đơn đặt phòng đang được giữ. Vui lòng hoàn tất đơn đó trước khi tạo đơn mới.'
                });
            }
        }

        const pool = await poolPromise;

        // Prioritize room type selection - auto-assign available room
        let selectedMaPhong = null;
        
        if (MaLoaiPhong) {
            // Room type provided - find available room of this type
            console.log(`Finding available room for room type: ${MaLoaiPhong}`);
            const availableRoomResult = await pool.request()
                .input('MaKS', sql.Int, MaKS)
                .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
                .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
                .input('NgayTraPhong', sql.Date, NgayTraPhong)
                .query(`
                    SELECT TOP 1 p.MaPhong
                    FROM Phong p
                    WHERE p.MaKS = @MaKS 
                    AND p.MaLoaiPhong = @MaLoaiPhong
                    AND p.TrangThaiPhong != N'Bảo trì'
                    AND p.MaPhong NOT IN (
                        SELECT b.MaPhong FROM Booking b
                        WHERE (b.NgayNhanPhong < @NgayTraPhong AND b.NgayTraPhong > @NgayNhanPhong)
                        AND b.TrangThaiBooking != N'Đã hủy'
                        AND (
                            b.TrangThaiBooking != N'Tạm giữ'
                            OR (b.TrangThaiBooking = N'Tạm giữ' AND b.ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15)
                        )
                    )
                    ORDER BY p.MaPhong
                `);

            if (availableRoomResult.recordset.length === 0) {
                return res.status(400).json({ 
                    error: "Không có phòng trống cho loại phòng này trong khoảng thời gian bạn chọn" 
                });
            }
            
            selectedMaPhong = availableRoomResult.recordset[0].MaPhong;
            console.log(`Auto-assigned room ${selectedMaPhong} for room type ${MaLoaiPhong}`);
        } else if (MaPhong) {
            // Specific room provided - use it directly
            selectedMaPhong = MaPhong;
            console.log(`Using specific room ${selectedMaPhong}`);
        } else {
            return res.status(400).json({ error: "Vui lòng cung cấp MaPhong hoặc MaLoaiPhong" });
        }

        // Kiểm tra số lượng khách với cấu hình giường
        const bedConfigResult = await pool.request()
            .input('MaPhong', sql.Int, selectedMaPhong)
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

        // Check room availability (redundant check for safety, since we already filtered above)
        const check = await pool.request()
            .input('MaPhong', sql.Int, selectedMaPhong)
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .query(`
                SELECT COUNT(*) as count FROM Booking
                WHERE MaPhong = @MaPhong
                AND (NgayNhanPhong < @NgayTraPhong AND NgayTraPhong > @NgayNhanPhong)
                AND TrangThaiBooking != N'Đã hủy'
                AND (
                    TrangThaiBooking != N'Tạm giữ'
                    OR (TrangThaiBooking = N'Tạm giữ' AND ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) <= 15)
                )
            `);

        if(check.recordset[0].count > 0) {
            return res.status(400).json({
                error: 'Phòng đã bị đặt trong khoảng thời gian này'
            });
        }

        // Create held booking
        const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);

        const result = await pool.request()
            .input('MaKH', sql.Int, currentUser ? currentUser.MaKH : null)
            .input('MaKhach', sql.Int, currentUser ? null : req.session.guestId || null)        
            .input('MaKS', sql.Int, MaKS)
            .input('MaPhong', sql.Int, selectedMaPhong)
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .input('SoLuongKhach', sql.Int, SoLuongKhach)
            .input('YeuCauDacBiet', sql.NVarChar, YeuCauDacBiet || '')
            .input('TongTienDuKien', sql.Decimal(18, 2), TongTienDuKien)
            .input('TrangThaiBooking', sql.NVarChar, 'Tạm giữ')
            .input('ThoiGianGiuCho', sql.DateTime, nowVN)
            .query(`
                INSERT INTO Booking
                (MaKH, MaKhach, MaKS, MaPhong, NgayNhanPhong, NgayTraPhong, SoLuongKhach, YeuCauDacBiet, TongTienDuKien, TrangThaiBooking, ThoiGianGiuCho)
                OUTPUT INSERTED.MaDat
                VALUES
                (@MaKH, @MaKhach, @MaKS, @MaPhong, @NgayNhanPhong, @NgayTraPhong, @SoLuongKhach, @YeuCauDacBiet, @TongTienDuKien, @TrangThaiBooking, @ThoiGianGiuCho)
            `);

        const MaDat = result.recordset[0].MaDat;

        // Store booking info in session
        req.session.bookingInfo = {
            MaDat,
            MaKS,
            MaPhong: selectedMaPhong, // Use the selected room ID
            NgayNhanPhong,
            NgayTraPhong,
            SoLuongKhach,
            YeuCauDacBiet,
            TongTienDuKien,
            holdTime: new Date() // Lưu thời điểm giữ chỗ
        };

        res.status(201).json({
            success: true, 
            MaDat,
            assignedRoomId: selectedMaPhong, // Trả về ID phòng đã được assign
            message: `Đã giữ phòng ${selectedMaPhong} thành công. Bạn có 15 phút để hoàn tất đặt phòng.`
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
            const response = { 
                success: false, 
                message: 'Vui lòng cung cấp đầy đủ thông tin: NgayNhanPhong, NgayTraPhong, MaLoaiPhong' 
            };
            if (res && res.json) {
                return res.status(400).json(response);
            }
            return response;
        }

        const pool = await poolPromise;
        const originalDuration = Math.ceil((new Date(NgayTraPhong) - new Date(NgayNhanPhong)) / (1000 * 60 * 60 * 24));

        // Tìm các khoảng thời gian thay thế
        console.log('[bookingController] suggestAlternativeDates - Input parameters:', {
            NgayNhanPhong,
            NgayTraPhong,
            MaLoaiPhong,
            originalDuration
        });

        const result = await pool.request()
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .input('originalDuration', sql.Int, originalDuration)
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
                    AND p.TrangThaiPhong != N'Bảo trì'
                    AND (
                        b.TrangThaiBooking != N'Tạm giữ'
                        OR (b.TrangThaiBooking = N'Tạm giữ' AND b.ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15)
                    )
                    AND b.NgayNhanPhong < (SELECT EndDate FROM DateRange)
                    AND b.NgayTraPhong > (SELECT StartDate FROM DateRange)
                ),
                AvailableRanges AS (
                    -- Khoảng trống trước booking đầu tiên
                    SELECT 
                        (SELECT StartDate FROM DateRange) as GapStart,
                        DATEADD(DAY, -1, MIN(NgayNhanPhong)) as GapEnd
                    FROM BookedDates
                    WHERE NOT EXISTS (
                        SELECT 1 FROM BookedDates b2 
                        WHERE b2.NgayNhanPhong < BookedDates.NgayNhanPhong
                    )
                    UNION ALL
                    -- Khoảng trống giữa các booking
                    SELECT 
                        DATEADD(DAY, 1, NgayTraPhong) as GapStart,
                        DATEADD(DAY, -1, NextCheckIn) as GapEnd
                    FROM (
                        SELECT 
                            NgayNhanPhong,
                            NgayTraPhong,
                            LEAD(NgayNhanPhong) OVER (ORDER BY NgayNhanPhong) as NextCheckIn
                        FROM BookedDates
                    ) AS BookedDatesWithNext
                    WHERE NextCheckIn IS NOT NULL
                    UNION ALL
                    -- Khoảng trống sau booking cuối cùng
                    SELECT 
                        DATEADD(DAY, 1, MAX(NgayTraPhong)) as GapStart,
                        (SELECT EndDate FROM DateRange) as GapEnd
                    FROM BookedDates
                    WHERE NOT EXISTS (
                        SELECT 1 FROM BookedDates b2 
                        WHERE b2.NgayNhanPhong > BookedDates.NgayNhanPhong
                    )
                    UNION ALL
                    -- Trường hợp không có booking nào
                    SELECT 
                        StartDate,
                        EndDate
                    FROM DateRange
                    WHERE NOT EXISTS (SELECT 1 FROM BookedDates)
                ),
                ValidRanges AS (
                    SELECT 
                        GapStart,
                        GapEnd,
                        DATEDIFF(DAY, GapStart, GapEnd) + 1 as AvailableDuration
                    FROM AvailableRanges
                    WHERE DATEDIFF(DAY, GapStart, GapEnd) + 1 >= @originalDuration
                ),
                SuggestedDates AS (
                    -- Before suggestions
                    SELECT 
                        DATEADD(DAY, -@originalDuration, GapEnd) as CheckInDate,
                        GapEnd as CheckOutDate,
                        'before' as Period,
                        @originalDuration as Duration,
                        ABS(DATEDIFF(DAY, DATEADD(DAY, -@originalDuration, GapEnd), @NgayNhanPhong)) as DaysFromOriginal
                    FROM ValidRanges
                    WHERE GapEnd <= @NgayNhanPhong
                    AND DATEDIFF(DAY, GapStart, GapEnd) >= @originalDuration
                    AND NOT EXISTS (
                        SELECT 1 FROM BookedDates b
                        WHERE b.NgayNhanPhong < GapEnd
                        AND b.NgayTraPhong > DATEADD(DAY, -@originalDuration, GapEnd)
                    )
                    UNION ALL
                    -- After suggestions
                    SELECT 
                        GapStart as CheckInDate,
                        DATEADD(DAY, @originalDuration, GapStart) as CheckOutDate,
                        'after' as Period,
                        @originalDuration as Duration,
                        ABS(DATEDIFF(DAY, GapStart, @NgayNhanPhong)) as DaysFromOriginal
                    FROM ValidRanges
                    WHERE DATEADD(DAY, @originalDuration, GapStart) <= GapEnd
                    AND GapStart > @NgayTraPhong
                    AND NOT EXISTS (
                        SELECT 1 FROM BookedDates b
                        WHERE b.NgayNhanPhong < DATEADD(DAY, @originalDuration, GapStart)
                        AND b.NgayTraPhong > GapStart
                    )
                )
                SELECT 
                    CheckInDate,
                    CheckOutDate,
                    Period,
                    Duration,
                    DaysFromOriginal
                FROM SuggestedDates
                ORDER BY 
                    CASE 
                        WHEN Period = 'after' THEN 1
                        ELSE 2
                    END,
                    DaysFromOriginal
            `);

        console.log('[bookingController] suggestAlternativeDates - Query result:', result.recordset);

        const suggestions = result.recordset.map(date => ({
            checkIn: date.CheckInDate,
            checkOut: date.CheckOutDate,
            period: date.Period,
            duration: date.Duration,
            daysFromOriginal: date.DaysFromOriginal
        }));

        const response = {
            success: true,
            data: {
                originalDates: {
                    checkIn: NgayNhanPhong,
                    checkOut: NgayTraPhong,
                    duration: originalDuration
                },
                suggestions
            }
        };

        if (res && res.json) {
            return res.json(response);
        }
        return response;
    } catch (err) {
        console.error('Lỗi suggestAlternativeDates:', err);
        const errorResponse = { 
            success: false, 
            message: 'Lỗi server khi tìm kiếm thời gian thay thế' 
        };
        if (res && res.json) {
            return res.status(500).json(errorResponse);
        }
        return errorResponse;
    }
};




// Tim loai phong trong trang booking (tất cả khách sạn)
exports.searchAvailableRooms = async (req, res) => {
    try {
        const { startDate, endDate, numberOfGuests } = req.query;

        // Validate required parameters
        if (!startDate || !endDate || !numberOfGuests) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: ngày nhận phòng, ngày trả phòng và số lượng khách'
            });
        }

        // Validate dates and guests
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

        const guests = parseInt(numberOfGuests);
        if (isNaN(guests) || guests < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng khách không hợp lệ'
            });
        }

        const pool = await poolPromise;

        // First, get all hotels and their room types with images
        const hotelsResult = await pool.request()
            .input('numberOfGuests', sql.Int, guests)
            .query(`
                SELECT DISTINCT
                    ks.MaKS,
                    ks.TenKS,
                    ks.DiaChi,
                    ks.HangSao,
                    ks.LoaiHinh,
                    ks.MoTaChung,
                    ks.Latitude,
                    ks.Longitude,
                    ak.DuongDanAnh as MainImagePath,
                    lp.MaLoaiPhong,
                    lp.TenLoaiPhong,
                    lp.GiaCoSo,
                    lp.DienTich,
                    lp.TienNghi,
                    lp.DuongDanAnh as RoomImagePath,
                    chg.TenCauHinh as CauHinhGiuong,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon
                FROM KhachSan ks
                JOIN LoaiPhong lp ON ks.MaKS = lp.MaKS
                JOIN Phong p ON lp.MaLoaiPhong = p.MaLoaiPhong
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                LEFT JOIN AnhKhachSan ak ON ks.MaKS = ak.MaKS
                    AND ak.LoaiAnh = 'main'
                    AND ak.IsActive = 1
                    AND ak.MaAnh = (
                        SELECT TOP 1 MaAnh 
                        FROM AnhKhachSan 
                        WHERE MaKS = ks.MaKS AND IsActive = 1 AND LoaiAnh = 'main'
                        ORDER BY ThuTu ASC, NgayThem ASC
                    )
                WHERE (chg.SoGiuongDoi * 2 + chg.SoGiuongDon) >= @numberOfGuests
                ORDER BY ks.HangSao DESC, lp.GiaCoSo ASC;
            `);

        // Then, check availability for each room type
        const availableRoomsResult = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('numberOfGuests', sql.Int, guests)
            .query(`
                WITH AvailableRooms AS (
                    SELECT
                        p.MaKS,
                        p.MaLoaiPhong,
                        COUNT(*) as SoPhongTrong
                    FROM Phong p
                    JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                    WHERE p.TrangThaiPhong != N'Bảo trì'
                    AND (chg.SoGiuongDoi * 2 + chg.SoGiuongDon) >= @numberOfGuests
                    AND NOT EXISTS (
                        SELECT 1 FROM Booking b
                        WHERE b.MaPhong = p.MaPhong
                        AND b.TrangThaiBooking != N'Đã hủy'
                        AND (
                            b.NgayNhanPhong < @endDate
                            AND b.NgayTraPhong > @startDate
                        )
                        AND (
                            b.TrangThaiBooking != N'Tạm giữ'
                            OR (b.TrangThaiBooking = N'Tạm giữ' AND b.ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15)
                        )
                    )
                    GROUP BY p.MaKS, p.MaLoaiPhong
                )
                SELECT * FROM AvailableRooms;
            `);

        // Create a map of available rooms
        const availableRoomsMap = new Map();
        availableRoomsResult.recordset.forEach(room => {
            availableRoomsMap.set(`${room.MaKS}-${room.MaLoaiPhong}`, room.SoPhongTrong);
        });

        // Format response - Group by room type to avoid duplicates
        const hotels = {};
        const roomTypeMap = new Map(); // Track processed room types to avoid duplicates

        for (const record of hotelsResult.recordset) {
            // Initialize hotel if not exists
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
                    MainImagePath: record.MainImagePath
                        ? `${req.protocol}://${req.get('host')}/${record.MainImagePath}`
                        : null,
                    roomTypes: []
                };
            }

            const roomTypeKey = `${record.MaKS}-${record.MaLoaiPhong}`;
            
            // Check if this room type is already processed
            if (roomTypeMap.has(roomTypeKey)) {
                // Add bed configuration to existing room type
                const existingRoomType = roomTypeMap.get(roomTypeKey);
                if (!existingRoomType.bedConfigurations) {
                    existingRoomType.bedConfigurations = [existingRoomType.CauHinhGiuong];
                }
                if (!existingRoomType.bedConfigurations.includes(record.CauHinhGiuong)) {
                    existingRoomType.bedConfigurations.push(record.CauHinhGiuong);
                }
                continue;
            }

            const availableRooms = availableRoomsMap.get(roomTypeKey) || 0;

            const roomType = {
                MaLoaiPhong: record.MaLoaiPhong,
                TenLoaiPhong: record.TenLoaiPhong,
                GiaCoSo: record.GiaCoSo,
                DienTich: record.DienTich,
                TienNghi: record.TienNghi,
                RoomImagePath: record.RoomImagePath
                    ? `${req.protocol}://${req.get('host')}/${record.RoomImagePath}`
                    : null,
                CauHinhGiuong: record.CauHinhGiuong, // Keep first bed config for compatibility
                SoGiuongDoi: record.SoGiuongDoi,
                SoGiuongDon: record.SoGiuongDon,
                SoPhongTrong: availableRooms,
                bedConfigurations: [record.CauHinhGiuong] // Array of all bed configurations
            };

            // If no rooms available, get alternative dates
            if (availableRooms === 0) {
                console.log(`[searchAvailableRooms] No rooms available for room type ${record.MaLoaiPhong}, getting alternative dates...`);
                try {
                    const alternativeDatesResult = await exports.suggestAlternativeDates({
                        body: {
                            NgayNhanPhong: startDate,
                            NgayTraPhong: endDate,
                            MaLoaiPhong: record.MaLoaiPhong
                        }
                    });

                    console.log('[searchAvailableRooms] Alternative dates result:', alternativeDatesResult);

                    if (alternativeDatesResult && alternativeDatesResult.success) {
                        roomType.alternativeDates = alternativeDatesResult.data.suggestions;
                        console.log(`[searchAvailableRooms] Added ${alternativeDatesResult.data.suggestions.length} alternative dates to room type ${record.MaLoaiPhong}`);
                    }
                } catch (error) {
                    console.error('[searchAvailableRooms] Error getting alternative dates:', error);
                }
            }

            // Store in map to track processed room types
            roomTypeMap.set(roomTypeKey, roomType);
            
            // Add to hotel's room types array
            hotels[record.MaKS].roomTypes.push(roomType);
        }

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
            currentUser.role === 'Admin' || // Admin có thể check-in mọi đơn
            (currentUser.role === 'QuanLyKS' && currentUser.MaKH === booking.MaNguoiQuanLy); // Quản lý KS chỉ check-in đơn của KS mình

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

            // Cập nhật trạng thái booking và ngày nhận phòng thực tế
            await transaction.request()
                .input('MaDat', sql.Int, MaDat)
                .input('TrangThaiBooking', sql.NVarChar, 'Đã nhận phòng')
                .input('NgayNhanPhong', sql.DateTime, new Date())
                .query(`
                    UPDATE Booking
                    SET TrangThaiBooking = @TrangThaiBooking,
                        NgayNhanPhong = @NgayNhanPhong
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
            currentUser.role === 'Admin' || // Admin có thể check-out mọi đơn
            (currentUser.role === 'QuanLyKS' && currentUser.MaKH === booking.MaNguoiQuanLy); // Quản lý KS chỉ check-out đơn của KS mình

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

            // Cập nhật trạng thái booking và ngày trả phòng thực tế
            await transaction.request()
                .input('MaDat', sql.Int, MaDat)
                .input('TrangThaiBooking', sql.NVarChar, 'Đã trả phòng')
                .input('NgayTraPhong', sql.DateTime, new Date())
                .query(`
                    UPDATE Booking
                    SET TrangThaiBooking = @TrangThaiBooking,
                        NgayTraPhong = @NgayTraPhong
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

/**
 * Update booking with customer and service details
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.updateBookingDetails = async (req, res) => {
    console.log('User:', req.user);
    console.log('SESSION ID:', req.session.id);
    console.log('req.session.bookingInfo:', req.session.bookingInfo);

    try {
        const {
            guestInfo, // For guest users
            services, // Selected services
            paymentInfo // Payment information
        } = req.body;

        const sessionId = req.session.id;
        const currentUser = req.user;
        const bookingInfo = req.session.bookingInfo;

        if (!bookingInfo) {
            return res.status(400).json({ 
                success: false,
                message: "Không tìm thấy thông tin đặt phòng. Vui lòng thử lại." 
            });
        }

        const pool = await poolPromise;

        // Verify the held booking is still valid
        const heldBookingResult = await pool.request()
            .input('MaDat', sql.Int, bookingInfo.MaDat)
            .query(`
                SELECT * FROM Booking
                WHERE MaDat = @MaDat
                AND TrangThaiBooking = N'Tạm giữ'
                AND ThoiGianGiuCho IS NOT NULL
                AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) <= 15
            `);

        if (heldBookingResult.recordset.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: "Phiên đặt phòng đã hết hạn. Vui lòng thử lại." 
            });
        }

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            let MaKhach = bookingInfo?.MaKhach || null;

            // If user is not logged in, create guest record
            if (!currentUser) {
                if (!bookingInfo.guestInfo) {
                    throw new Error("Thông tin khách hàng là bắt buộc");
                }

                const guestResult = await transaction.request()
                    .input('HoTen', sql.NVarChar, bookingInfo.guestInfo.HoTen)
                    .input('Email', sql.NVarChar, bookingInfo.guestInfo.Email)
                    .input('SDT', sql.NVarChar, bookingInfo.guestInfo.SDT)
                    .input('CCCD', sql.NVarChar, bookingInfo.guestInfo.CCCD || null)
                    .input('NgaySinh', sql.Date, bookingInfo.guestInfo.NgaySinh || null)
                    .input('GioiTinh', sql.NVarChar, bookingInfo.guestInfo.GioiTinh || null)
                    .query(`
                        INSERT INTO Guests (HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh)
                        OUTPUT INSERTED.MaKhach
                        VALUES (@HoTen, @Email, @SDT, @CCCD, @NgaySinh, @GioiTinh)
                    `);

                MaKhach = guestResult.recordset[0].MaKhach;
            }

            // Create guest account representative for all guests if not exists
            let guestRepresentativeResult = await transaction.request()
                .query(`
                    SELECT MaKH FROM NguoiDung 
                    WHERE LoaiUser = 'Guest' AND Email = 'guest@system.internal'
                `);

            if (guestRepresentativeResult.recordset.length === 0) {
                // Create guest representative account if it doesn't exist
                guestRepresentativeResult = await transaction.request()
                    .input('LoaiUser', sql.NVarChar, 'Guest')
                    .input('HoTen', sql.NVarChar, 'Guest Representative Account')
                    .input('Email', sql.NVarChar, 'guest@system.internal')
                    .input('MatKhauHash', sql.NVarChar, 'GUEST_REPRESENTATIVE_NO_LOGIN')
                    .query(`
                        INSERT INTO NguoiDung (LoaiUser, HoTen, Email, MatKhauHash)
                        OUTPUT INSERTED.MaKH
                        VALUES (@LoaiUser, @HoTen, @Email, @MatKhauHash)
                    `);
            }
            
            const guestRepresentativeId = guestRepresentativeResult.recordset[0].MaKH;

            // Determine which MaKH to use for the booking and invoice
            let bookingMaKH, bookingMaKhach;
            if (currentUser) {
                // If user is logged in, use their MaKH
                bookingMaKH = currentUser.MaKH;
                bookingMaKhach = null;
            } else {
                // If user is guest, use the guest representative account for MaKH
                // and actual guest info for MaKhach
                bookingMaKH = guestRepresentativeId;
                bookingMaKhach = MaKhach; // Guest record created above
            }

            // Update booking status to confirmed
            await transaction.request()
                .input('MaDat', sql.Int, bookingInfo.MaDat)
                .input('MaKH', sql.Int, bookingMaKH)
                .input('MaKhach', sql.Int, bookingMaKhach)
                .input('TrangThaiBooking', sql.NVarChar, 'Đã xác nhận')
                .query(`
                    UPDATE Booking
                    SET MaKH = @MaKH,
                        MaKhach = @MaKhach,
                        TrangThaiBooking = @TrangThaiBooking,
                        ThoiGianGiuCho = NULL
                    WHERE MaDat = @MaDat
                `);

            // Add services if any
            if (bookingInfo.services && bookingInfo.services.length > 0) {
                for (const service of bookingInfo.services) {
                    await transaction.request()
                        .input('MaDat', sql.Int, bookingInfo.MaDat)
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

            // Update session with additional info
            req.session.bookingInfo = {
                ...bookingInfo,
                guestInfo: guestInfo || null,
                services: services || [],
                paymentInfo: paymentInfo || null
            };

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin đặt phòng thành công',
                data: {
                    MaDat: bookingInfo.MaDat,
                    guestInfo: guestInfo || null,
                    services: services || [],
                    paymentInfo: paymentInfo || null
                }
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Lỗi updateBookingDetails:', err);
        res.status(500).json({ 
            success: false,
            message: "Lỗi hệ thống" 
        });
    }
};

/**
 * Confirm and finalize the booking
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.confirmBooking = async (req, res) => {
    try {
        const { MaDat } = req.params;
        const { paymentInfo } = req.body;
        const sessionId = req.session.id;
        const currentUser = req.user;
        const bookingInfo = req.session.bookingInfo;

        if (!bookingInfo || bookingInfo.MaDat !== parseInt(MaDat)) {
            return res.status(400).json({ 
                success: false,
                message: "Không tìm thấy thông tin đặt phòng. Vui lòng thử lại." 
            });
        }

        const pool = await poolPromise;

        // Verify the held booking is still valid
        const heldBookingResult = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .input('sessionId', sql.NVarChar, sessionId)
            .query(`
                SELECT * FROM Booking
                WHERE MaDat = @MaDat
                AND TrangThaiBooking = N'Tạm giữ'
                AND ThoiGianGiuCho IS NOT NULL
                AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) <= 15
            `);

        if (heldBookingResult.recordset.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: "Phiên đặt phòng đã hết hạn. Vui lòng thử lại." 
            });
        }

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            let MaKhach = bookingInfo?.MaKhach || null;

            // If user is not logged in, create guest record
            if (!currentUser) {
                if (!bookingInfo.guestInfo) {
                    throw new Error("Thông tin khách hàng là bắt buộc");
                }

                const guestResult = await transaction.request()
                    .input('HoTen', sql.NVarChar, bookingInfo.guestInfo.HoTen)
                    .input('Email', sql.NVarChar, bookingInfo.guestInfo.Email)
                    .input('SDT', sql.NVarChar, bookingInfo.guestInfo.SDT)
                    .input('CCCD', sql.NVarChar, bookingInfo.guestInfo.CCCD || null)
                    .input('NgaySinh', sql.Date, bookingInfo.guestInfo.NgaySinh || null)
                    .input('GioiTinh', sql.NVarChar, bookingInfo.guestInfo.GioiTinh || null)
                    .query(`
                        INSERT INTO Guests (HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh)
                        OUTPUT INSERTED.MaKhach
                        VALUES (@HoTen, @Email, @SDT, @CCCD, @NgaySinh, @GioiTinh)
                    `);

                MaKhach = guestResult.recordset[0].MaKhach;
            }

            // Create guest account representative for all guests if not exists
            let guestRepresentativeResult = await transaction.request()
                .query(`
                    SELECT MaKH FROM NguoiDung 
                    WHERE LoaiUser = 'Guest' AND Email = 'guest@system.internal'
                `);

            if (guestRepresentativeResult.recordset.length === 0) {
                // Create guest representative account if it doesn't exist
                guestRepresentativeResult = await transaction.request()
                    .input('LoaiUser', sql.NVarChar, 'Guest')
                    .input('HoTen', sql.NVarChar, 'Guest Representative Account')
                    .input('Email', sql.NVarChar, 'guest@system.internal')
                    .input('MatKhauHash', sql.NVarChar, 'GUEST_REPRESENTATIVE_NO_LOGIN')
                    .query(`
                        INSERT INTO NguoiDung (LoaiUser, HoTen, Email, MatKhauHash)
                        OUTPUT INSERTED.MaKH
                        VALUES (@LoaiUser, @HoTen, @Email, @MatKhauHash)
                    `);
            }
            
            const guestRepresentativeId = guestRepresentativeResult.recordset[0].MaKH;

            // Determine which MaKH to use for the booking and invoice
            let bookingMaKH, bookingMaKhach;
            if (currentUser) {
                // If user is logged in, use their MaKH
                bookingMaKH = currentUser.MaKH;
                bookingMaKhach = null;
            } else {
                // If user is guest, use the guest representative account for MaKH
                // and actual guest info for MaKhach
                bookingMaKH = guestRepresentativeId;
                bookingMaKhach = MaKhach; // Guest record created above
            }

            // Update booking status to confirmed
            await transaction.request()
                .input('MaDat', sql.Int, MaDat)
                .input('MaKH', sql.Int, bookingMaKH)
                .input('MaKhach', sql.Int, bookingMaKhach)
                .input('TrangThaiBooking', sql.NVarChar, 'Đã xác nhận')
                .query(`
                    UPDATE Booking
                    SET MaKH = @MaKH,
                        MaKhach = @MaKhach,
                        TrangThaiBooking = @TrangThaiBooking,
                        ThoiGianGiuCho = NULL
                    WHERE MaDat = @MaDat
                `);

            // Add services if any
            if (bookingInfo.services && bookingInfo.services.length > 0) {
                for (const service of bookingInfo.services) {
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

            // Create invoice using the same MaKH as booking
            const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
            const invoiceResult = await transaction.request()
                .input('MaDat', sql.Int, MaDat)
                .input('MaKH', sql.Int, bookingMaKH)
                .input('MaKM', sql.Int, bookingInfo.promotionCode || null)
                .input('TongTienPhong', sql.Decimal(18, 2), bookingInfo.TongTienDuKien)
                .input('HinhThucTT', sql.NVarChar, paymentInfo.HinhThucTT)
                .input('TrangThaiThanhToan', sql.NVarChar, 'Đã thanh toán')
                .input('NgayThanhToan', sql.DateTime, nowVN)
                .query(`
                    INSERT INTO HoaDon
                    (MaDat, MaKH, MaKM, TongTienPhong, HinhThucTT, TrangThaiThanhToan, NgayThanhToan)
                    OUTPUT INSERTED.MaHD
                    VALUES
                    (@MaDat, @MaKH, @MaKM, @TongTienPhong, @HinhThucTT, @TrangThaiThanhToan, @NgayThanhToan)
                `);

            await transaction.commit();

            // Clear booking info from session
            delete req.session.bookingInfo;

            // Get room information for email
            const roomInfoResult = await pool.request()
                .input('MaDat', sql.Int, MaDat)
                .query(`
                    SELECT p.SoPhong, ks.TenKS, nd.HoTen, nd.Email
                    FROM Booking b
                    JOIN Phong p ON b.MaPhong = p.MaPhong
                    JOIN KhachSan ks ON b.MaKS = ks.MaKS
                    LEFT JOIN NguoiDung nd ON b.MaKH = nd.MaKH
                    WHERE b.MaDat = @MaDat
                `);

            const roomInfo = roomInfoResult.recordset[0];

            // Send confirmation email
            try {
                const emailInfo = {
                    guestEmail: currentUser ? currentUser.Email : bookingInfo.guestInfo.Email,
                    guestName: currentUser ? roomInfo.HoTen : bookingInfo.guestInfo.HoTen,
                    bookingId: MaDat,
                    hotelName: roomInfo.TenKS,
                    roomNumber: roomInfo.SoPhong,
                    checkIn: bookingInfo.NgayNhanPhong,
                    checkOut: bookingInfo.NgayTraPhong,
                    totalPrice: bookingInfo.TongTienDuKien
                };
                await sendBookingConfirmation(emailInfo);
            } catch (emailErr) {
                console.error('Error sending confirmation email:', emailErr);
            }

            // Send email notification to hotel manager
            try {
                const hotelManagerResult = await pool.request()
                    .input('MaKS', sql.Int, bookingInfo.MaKS)
                    .query(`
                        SELECT ks.MaNguoiQuanLy, nd.HoTen as TenQuanLy, nd.Email as EmailQuanLy
                        FROM KhachSan ks
                        LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
                        WHERE ks.MaKS = @MaKS AND nd.Email IS NOT NULL
                    `);

                if (hotelManagerResult.recordset.length > 0 && hotelManagerResult.recordset[0].MaNguoiQuanLy) {
                    const managerInfo = hotelManagerResult.recordset[0];
                    
                    // Get guest name - either from currentUser database or guestInfo
                    let guestName;
                    if (currentUser) {
                        // For logged-in users, get name from database to ensure accuracy
                        const userInfoResult = await pool.request()
                            .input('MaKH', sql.Int, currentUser.MaKH)
                            .query(`SELECT HoTen FROM NguoiDung WHERE MaKH = @MaKH`);
                        guestName = userInfoResult.recordset.length > 0 ? 
                                   userInfoResult.recordset[0].HoTen : 
                                   (currentUser.HoTen || 'Khách hàng');
                    } else {
                        guestName = guestInfo.HoTen;
                    }
                    
                    // Send email notification to hotel manager
                    const managerEmailInfo = {
                        managerEmail: managerInfo.EmailQuanLy,
                        managerName: managerInfo.TenQuanLy,
                        bookingId: bookingInfo.MaDat,
                        hotelName: roomInfo.TenKS,
                        roomNumber: roomInfo.SoPhong,
                        guestName: guestName,
                        checkIn: bookingInfo.NgayNhanPhong,
                        checkOut: bookingInfo.NgayTraPhong,
                        totalPrice: bookingInfo.TongTienDuKien,
                    };
                    
                    await sendBookingNotificationToManager(managerEmailInfo);
                    console.log(`Email notification sent to hotel manager ${managerInfo.TenQuanLy} for booking ${bookingInfo.MaDat}`);
                }
            } catch (notificationErr) {
                console.error('Error sending email notification to hotel manager:', notificationErr);
            }

            res.status(200).json({
                success: true,
                message: 'Đặt phòng thành công',
                data: {
                    MaDat,
                    MaHD: invoiceResult.recordset[0].MaHD,
                    guestInfo: currentUser ? null : bookingInfo.guestInfo,
                    services: bookingInfo.services || [],
                    paymentInfo
                }
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Lỗi confirmBooking:', err);
        res.status(500).json({ 
            success: false,
            message: "Lỗi hệ thống" 
        });
    }
}
