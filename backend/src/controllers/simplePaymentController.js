const sql = require('mssql');
const { poolPromise } = require('../database/db');

// Process simple payment (just validate and show booking info)
exports.processSimplePayment = async (req, res) => {
    const { MaDat, MaKH } = req.body;

    try {
        const pool = await poolPromise;
        
        // Get booking details
        const bookingResult = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .input('MaKH', sql.Int, MaKH)
            .query(`
                SELECT 
                    b.*,
                    ks.TenKS,
                    ks.DiaChi,
                    p.SoPhong,
                    chg.TenCauHinh as CauHinhGiuong,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon,
                    lp.GiaCoSo,
                    nd.HoTen as TenKhachHang,
                    nd.Email,
                    nd.SDT
                FROM Booking b
                JOIN KhachSan ks ON b.MaKS = ks.MaKS
                JOIN Phong p ON b.MaPhong = p.MaPhong
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                JOIN NguoiDung nd ON b.MaKH = nd.MaKH
                WHERE b.MaDat = @MaDat
                AND b.MaKH = @MaKH
                AND b.TrangThaiBooking = N'Tạm giữ'
                AND b.SoLuongKhach > 0 
                AND b.SoLuongKhach <= (chg.SoGiuongDoi * 2 + chg.SoGiuongDon)
            `);

        if (bookingResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin đặt phòng hoặc đơn đã được xử lý'
            });
        }

        const booking = bookingResult.recordset[0];

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Create a simple payment record
            const paymentResult = await transaction.request()
                .input('MaDat', sql.Int, MaDat)
                .input('MaKH', sql.Int, MaKH)
                .input('SoTien', sql.Decimal(10, 2), booking.TongTienDuKien)
                .input('TrangThaiThanhToan', sql.NVarChar, 'Đã thanh toán')
                .input('HinhThucTT', sql.NVarChar, 'Thanh toán đơn giản')
                .query(`
                    INSERT INTO HoaDon (MaDat, MaKH, TongTienPhong, HinhThucTT, TrangThaiThanhToan, NgayThanhToan)
                    OUTPUT INSERTED.*
                    VALUES (@MaDat, @MaKH, @SoTien, @HinhThucTT, @TrangThaiThanhToan, GETDATE())
                `);

            // Update booking status
            await transaction.request()
                .input('MaDat', sql.Int, MaDat)
                .input('TrangThaiBooking', sql.NVarChar, 'Đã xác nhận')
                .query(`
                    UPDATE Booking
                    SET TrangThaiBooking = @TrangThaiBooking
                    WHERE MaDat = @MaDat
                `);

            await transaction.commit();

            res.json({
                success: true,
                message: 'Thanh toán thành công',
                data: {
                    booking: {
                        ...booking,
                        TrangThaiBooking: 'Đã xác nhận'
                    },
                    payment: paymentResult.recordset[0]
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Simple payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xử lý thanh toán'
        });
    }
}; 