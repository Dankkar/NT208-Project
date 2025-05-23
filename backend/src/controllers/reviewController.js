const { poolPromise, sql } = require('../database/db');
const { containsBadWords } = require('../utils/badWords');

// Create a new review
exports.createReview = async (req, res) => {
    try {
        const { MaKS, MaDat, NoiDung, DiemDanhGia } = req.body;
        const MaKH = req.user.MaKH;
        const pool = await poolPromise;

        // Kiểm tra từ cấm
        const badWordsCheck = containsBadWords(NoiDung);
        if (badWordsCheck.contains) {
            return res.status(400).json({
                error: "Nội dung review chứa từ ngữ không phù hợp",
                details: {
                    word: badWordsCheck.word,
                    language: badWordsCheck.language
                }
            });
        }

        // Kiểm tra xem khách hàng đã từng đặt phòng và đã check-out chưa
        const bookingCheck = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .input('MaKH', sql.Int, MaKH)
            .query(`
                SELECT TrangThaiBooking
                FROM Booking
                WHERE MaDat = @MaDat AND MaKH = @MaKH
            `);

        if (bookingCheck.recordset.length === 0) {
            return res.status(403).json({ error: "Bạn không có quyền đánh giá đơn đặt phòng này" });
        }

        if (bookingCheck.recordset[0].TrangThaiBooking !== 'Đã trả phòng') {
            return res.status(400).json({ error: "Bạn chỉ có thể đánh giá sau khi đã trả phòng" });
        }

        // Kiểm tra xem đã đánh giá chưa
        const existingReview = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT MaReview
                FROM Review
                WHERE MaDat = @MaDat
            `);

        if (existingReview.recordset.length > 0) {
            return res.status(400).json({ error: "Bạn đã đánh giá đơn đặt phòng này" });
        }

        // Tạo review mới
        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .input('MaKS', sql.Int, MaKS)
            .input('MaDat', sql.Int, MaDat)
            .input('NoiDung', sql.NVarChar, NoiDung)
            .input('DiemDanhGia', sql.Int, DiemDanhGia)
            .input('NgayTao', sql.DateTime, new Date())
            .query(`
                INSERT INTO Review (MaKH, MaKS, MaDat, NoiDung, DiemDanhGia, NgayTao)
                VALUES (@MaKH, @MaKS, @MaDat, @NoiDung, @DiemDanhGia, @NgayTao)
            `);

        res.status(201).json({ message: "Đánh giá thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};

// Get reviews for a hotel
exports.getHotelReviews = async (req, res) => {
    const { MaKS } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT 
                    bd.MaDG,
                    bd.MaKH,
                    nd.HoTen as TenNguoiDung,
                    nd.LoaiUser,
                    bd.Sao,
                    bd.NoiDung,
                    bd.NgayDG,
                    bd.IsApproved
                FROM BaiDanhGia bd
                JOIN NguoiDung nd ON bd.MaKH = nd.MaKH
                WHERE bd.MaKS = @MaKS
                ORDER BY bd.NgayDG DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi khi lấy đánh giá:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy đánh giá',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get reviews for a booking
exports.getBookingReviews = async (req, res) => {
    const { MaDat } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT 
                    bd.MaDG,
                    bd.MaKH,
                    nd.HoTen as TenNguoiDung,
                    nd.LoaiUser,
                    bd.Sao,
                    bd.NoiDung,
                    bd.NgayDG,
                    bd.IsApproved
                FROM BaiDanhGia bd
                JOIN NguoiDung nd ON bd.MaKH = nd.MaKH
                WHERE bd.MaDat = @MaDat
                ORDER BY bd.NgayDG ASC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi khi lấy đánh giá:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy đánh giá',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 