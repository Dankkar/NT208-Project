// backend/src/controllers/bookingController.js

const sql = require('mssql');
const db = require('../database/db');

//Kiem tra phong trong cua tung loai phong
exports.getAvailableRoomTypes = async (req, res) => {
    try {
        const { NgayNhanPhong, NgayTraPhong } = req.query;

        if (!NgayNhanPhong || !NgayTraPhong) {
            return res.status(400).json({ error: "Vui lòng cung cấp ngày nhận phòng và ngày trả phòng" });
        }

        const pool = await sql.connect(db);

        const result = await pool.request()
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .query(`
                SELECT lp.MaLoaiPhong, lp.TenLoaiPhong, lp.Gia, COUNT(*) AS SoPhongTrong
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
                GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.Gia
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
            MaKH, MaKS, MaPhong, NgayNhanPhong, NgayTraPhong,
            SoLuongKhach, YeuCauDacBiet, TongTienDuKien
        } = req.body;
        const pool = await sql.connect(db);

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

        // Tao don moi
        await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .input('MaKS', sql.Int, MaKS)
            .input('MaPhong', sql.Int, MaPhong)
            .input('NgatDat', sql.DateTime, new Date())
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .input('SoLuongKhach', sql.Int, SoLuongKhach)
            .input('YeuCauDacBiet', sql.NVarChar, YeuCauDacBiet || '')
            .input('TongTienDuKien', sql.Decimal(18, 2), TongTienDuKien)
            .input('TrangThaiBooking', sql.NVarChar, 'Cho xac nhan')
            .query(`
                INSERT INTO Booking
                (MaKH, MaKS, MaPhong, NgayDat, NgayNhanPhong, NgayTraPhong, SoLuongKhach, YeuCauDacBiet, TongTienDuKien, TrangThaiBooking)
                VALUES
                (@MaKH, @MaKS, @MaPhong, @NgayDat, @NgayNhanPhong, @NgayTraPhong, @SoLuongKhach, @YeuCauDacBiet, @TongTienDuKien, @TrangThaiBooking)
            `);
            
        res.status(201).json({  message: 'Dat phong thanh cong'});
    }
    catch(err){
        console.log(err);
        res.status(500).json({  error: "Loi he thong"});
    }
};

// Xem chi tiet don
exports.getBookingById = async (req, res) => {
    try{
        const { MaDat } = req.params;
        const pool = await sql.connect(db);

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

        const pool = await sql.connect(db);

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

// Xem don theo MaKH
exports.getBookingByUser = async (req, res) => {
    try{
        const { MaKH } = req.params;
        const pool = await sql.connect(db);

        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
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
        res.status(500).json({ error: "Loi he thong"});
    }
};
