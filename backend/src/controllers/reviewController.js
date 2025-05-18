const { poolPromise, sql } = require('../database/db');

// Create a new review
exports.createReview = async (req, res) => {
    const { MaDat, MaKS, Sao, NoiDung } = req.body;
    const MaKH = req.user.MaKH; // Get from authenticated user

    try {
        const pool = await poolPromise;

        // Check if booking exists and belongs to user
        const bookingCheck = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .input('MaKH', sql.Int, MaKH)
            .query(`
                SELECT MaDat, TrangThaiBooking 
                FROM Booking 
                WHERE MaDat = @MaDat AND MaKH = @MaKH
            `);

        if (bookingCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn đặt phòng hoặc bạn không có quyền đánh giá'
            });
        }

        // Check if user has already reviewed this booking
        const existingReview = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query('SELECT MaDG FROM BaiDanhGia WHERE MaDat = @MaDat');

        if (existingReview.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá đơn đặt phòng này'
            });
        }

        // Generate auto-reply based on rating
        let autoReply = '';
        if (Sao >= 4) {
            autoReply = 'Cảm ơn quý khách đã đánh giá tích cực! Chúng tôi rất vui khi được phục vụ quý khách và mong được đón tiếp quý khách trong thời gian tới.';
        } else if (Sao >= 3) {
            autoReply = 'Cảm ơn quý khách đã góp ý. Chúng tôi sẽ cố gắng cải thiện dịch vụ để phục vụ quý khách tốt hơn trong lần sau.';
        } else {
            autoReply = 'Chúng tôi rất tiếc về trải nghiệm không tốt của quý khách. Chúng tôi sẽ xem xét và cải thiện dịch vụ để phục vụ quý khách tốt hơn.';
        }

        // Insert review with auto-reply
        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .input('MaDat', sql.Int, MaDat)
            .input('MaKS', sql.Int, MaKS)
            .input('Sao', sql.Int, Sao)
            .input('NoiDung', sql.NVarChar, NoiDung)
            .input('AutoReply', sql.NVarChar, autoReply)
            .query(`
                INSERT INTO BaiDanhGia (MaKH, MaDat, MaKS, Sao, NoiDung, IsApproved)
                VALUES (@MaKH, @MaDat, @MaKS, @Sao, @NoiDung, 1);
                
        
            `);
//         -- Insert auto-reply as a separate review
        //         INSERT INTO BaiDanhGia (MaKH, MaDat, MaKS, Sao, NoiDung, IsApproved)
        //         SELECT 
        //             (SELECT MaNguoiQuanLy FROM KhachSan WHERE MaKS = @MaKS),
        //             @MaDat,
        //             @MaKS,
        //             5,
        //             @AutoReply,
        //             1;
        res.status(201).json({
            success: true,
            message: 'Đánh giá đã được gửi thành công',
            data: {
                review: {
                    MaKH,
                    MaDat,
                    MaKS,
                    Sao,
                    NoiDung
                },
                autoReply
            }
        });
    } catch (error) {
        console.error('Lỗi khi tạo đánh giá:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo đánh giá',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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