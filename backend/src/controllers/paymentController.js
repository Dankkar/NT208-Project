const qs = require('qs');
const crypto = require('crypto');
const moment = require('moment');
const { sendBookingConfirmation, sendNewBookingToManager } = require('../utils/emailService');
const { poolPromise, sql } = require('../database/db');

exports.createPaymentUrl = async (req, res) => {
    const {
        MaDat,
        orderDescription,
        bankCode,
        amount,
    } = req.body;

    // Validate required fields
    if (!MaDat || !amount) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin cần thiết'
        });
    }

    try {
        // Verify booking exists and amount matches
        const pool = await poolPromise;
        const bookingResult = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT TongTienDuKien, TrangThaiBooking
                FROM Booking
                WHERE MaDat = @MaDat
            `);

        if (bookingResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn đặt phòng'
            });
        }

        const booking = bookingResult.recordset[0];
        if (booking.TrangThaiBooking === 'Đã thanh toán') {
            return res.status(400).json({
                success: false,
                message: 'Đơn đặt phòng đã được thanh toán'
            });
        }

        if (booking.TongTienDuKien !== amount) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền thanh toán không khớp với đơn đặt phòng'
            });
        }

        const tmnCode = process.env.VNPAY_TMNCODE;
        const secretKey = process.env.VNPAY_SECRET_KEY;
        const returnUrl = process.env.VNPAY_RETURN_URL;
        
        if (!tmnCode || !secretKey || !returnUrl) {
            return res.status(500).json({
                success: false,
                message: 'Cấu hình thanh toán không hợp lệ'
            });
        }

        const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip;

        const createDate = moment().format('YYYYMMDDHHmmss');
        const amountVND = amount * 100;

        let vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: MaDat,
            vnp_OrderInfo: orderDescription || `Thanh toan don dat phong ${MaDat}`,
            vnp_OrderType: 'other',
            vnp_Amount: amountVND,
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_IpnUrl: process.env.VNPAY_IPN_URL,     
        };

        if (bankCode) {
            vnpParams.vnp_BankCode = bankCode;
        }

        //B1:Sort key
        vnpParams = sortObject(vnpParams);
        
        //B2: Create query + hash
        const signData = qs.stringify(vnpParams, {encode: false});
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnpParams.vnp_SecureHash = signed;

        //B3: Redirect link
        const paymentUrl = vnpUrl + '?' + qs.stringify(vnpParams, { encode: true });

        res.json({ paymentUrl });
    } catch (error) {
        console.error('Lỗi tạo URL thanh toán:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// Hàm sắp xếp key theo alphabet (bắt buộc theo quy định VNPay)
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (let key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
}

exports.vnpayIpn = async (req, res) => {
    const vnpParams = req.body;
    const secureHash = vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const secretKey = process.env.VNPAY_SECRET_KEY;

    if (!secretKey) {
        return res.status(500).json({
            success: false,
            message: 'Cấu hình thanh toán không hợp lệ'
        });
    }

    const sortedParams = sortObject(vnpParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
        const responseCode = vnpParams['vnp_ResponseCode'];
        if (responseCode === '00') {
            // THANH TOÁN THÀNH CÔNG
            const MaDat = vnpParams['vnp_TxnRef'];
            try {
                const pool = await poolPromise;
                const result = await pool.request()
                    .input('MaDat', sql.Int, MaDat)
                    .input('TrangThaiBooking', sql.NVarChar, 'Đã thanh toán')
                    .query(`
                        UPDATE Booking
                        SET TrangThaiBooking = @TrangThaiBooking
                        WHERE MaDat = @MaDat
                        `);
                if (result.rowsAffected[0] === 0) {
                    return res.status(404).json({ RspCode: '01', Message: 'Đơn đặt phòng không tồn tại' });
                }
                const infoResult = await pool.request()
                    .input('MaDat', sql.Int, MaDat)
                    .query(`
                        SELECT nd.Email AS UserEmail, nd.HoTen, ks.TenKS, ql.Email AS ManagerEmail
                        FROM Booking b
                        JOIN NguoiDung nd ON b.MaKH = nd.MaKH
                        JOIN KhachSan ks ON b.MaKS = ks.MaKS
                        JOIN NguoiDung ql ON ks.MaNguoiQuanLy = ql.MaKH
                        WHERE b.MaDat = @MaDat
                    `);
                if(infoResult.recordset.length > 0) {
                    const {UserEmail, HoTen, TenKS, ManagerEmail} = infoResult.recordset[0];
                    await sendBookingConfirmation(UserEmail, HoTen, MaDat);
                    await sendNewBookingToManager(ManagerEmail, TenKS, MaDat);
                }

                res.status(200).json({ RspCode: '00', Message: 'Success' });
            } catch(err) {
                console.error('Lỗi update trạng thái đơn đặt phòng:', err);
                return res.status(500).json({ RspCode: '01', Message: 'Lỗi server' });
            }
        } else {
            res.status(200).json({ RspCode: '01', Message: 'Thanh toán thất bại' });
        }
    } else {
        res.status(400).json({ RspCode: '97', Message: 'Checksum sai' });
    }
};

exports.getPaymentHistory = async (req, res) => {
    try {
        const { MaKH } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .query(`
                SELECT 
                    hd.MaHD,
                    hd.NgayLapHD,
                    hd.TongTienThanhToan as SoTien,
                    hd.TrangThaiThanhToan as TrangThai,
                    hd.HinhThucTT as PhuongThucThanhToan,
                    hd.NgayThanhToan,
                    b.MaDat,
                    ks.TenKS,
                    p.SoPhong,
                    lp.TenLoaiPhong
                FROM HoaDon hd
                JOIN Booking b ON hd.MaDat = b.MaDat
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                JOIN Phong p ON b.MaPhong = p.MaPhong
                JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                WHERE hd.MaKH = @MaKH
                ORDER BY hd.NgayLapHD DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.getPaymentDetails = async (req, res) => {
    try {
        const { MaHD } = req.params;
        
        // Validate MaHD parameter
        if (!MaHD || isNaN(parseInt(MaHD))) {
            return res.status(400).json({
                success: false,
                message: 'Mã hóa đơn không hợp lệ'
            });
        }

        const pool = await poolPromise;
        
        // First get the invoice details
        const result = await pool.request()
            .input('MaHD', sql.Int, parseInt(MaHD))
            .query(`
                SELECT 
                    hd.*,
                    b.MaDat,
                    b.NgayNhanPhong,
                    b.NgayTraPhong,
                    b.SoLuongKhach,
                    ks.TenKS,
                    p.SoPhong,
                    lp.TenLoaiPhong,
                    chg.TenCauHinh as CauHinhGiuong,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon,
                    nd.HoTen as TenKhachHang,
                    nd.Email,
                    nd.SDT,
                    km.MaCodeKM,
                    km.TenKM,
                    km.LoaiKM,
                    km.GiaTriKM
                FROM HoaDon hd
                JOIN Booking b ON hd.MaDat = b.MaDat
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                JOIN Phong p ON b.MaPhong = p.MaPhong
                JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                JOIN NguoiDung nd ON hd.MaKH = nd.MaKH
                LEFT JOIN KhuyenMai km ON hd.MaKM = km.MaKM
                WHERE hd.MaHD = @MaHD
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin thanh toán'
            });
        }

        const invoiceData = result.recordset[0];

        // Only query for services if we have a valid MaDat
        let serviceData = [];
        if (invoiceData.MaDat) {
            const serviceResult = await pool.request()
                .input('MaDat', sql.Int, parseInt(invoiceData.MaDat))
                .query(`
                    SELECT 
                        sdv.*,
                        ldv.TenLoaiDV
                    FROM SuDungDichVu sdv
                    JOIN LoaiDichVu ldv ON sdv.MaLoaiDV = ldv.MaLoaiDV
                    WHERE sdv.MaDat = @MaDat
                `);
            serviceData = serviceResult.recordset;
        }

        res.json({
            success: true,
            data: {
                ...invoiceData,
                services: serviceData
            }
        });
    } catch (error) {
        console.error('Error getting payment details:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin thanh toán'
        });
    }
};