const { poolPromise, sql } = require('../database/db');
const { containsBadWords } = require('../utils/badWords');

// Create a new review
exports.createReview = async (req, res) => {
    try {
        const { MaKS, MaDat, NoiDung, Sao } = req.body;
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
                SELECT MaDG
                FROM BaiDanhGia
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
            .input('Sao', sql.Decimal(2, 1), Sao)
            .input('NgayDG', sql.DateTime, new Date())
            .query(`
                INSERT INTO BaiDanhGia (MaKH, MaKS, MaDat, NoiDung, Sao, NgayDG)
                VALUES (@MaKH, @MaKS, @MaDat, @NoiDung, @Sao, @NgayDG)
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
                WHERE bd.MaKS = @MaKS AND bd.IsApproved = 1
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

// API CHO ADMIN: LẤY TẤT CẢ REVIEW CỦA KHÁCH SẠN (CÓ PHÂN TRANG)
exports.adminGetHotelReviews = async (req, res) => {
    const { MaKS } = req.params;
    // 1. NHẬN THAM SỐ `page` VÀ `limit` TỪ QUERY STRING (mặc định là trang 1, 10 mục/trang)
    const { page = 1, limit = 10 } = req.query;
    const numericPage = parseInt(page, 10);
    const numericLimit = parseInt(limit, 10);
    // 2. TÍNH TOÁN `offset` CHO SQL QUERY
    const offset = (numericPage - 1) * numericLimit;

    try {
        const pool = await poolPromise;
        const request = pool.request().input('MaKS_Filter', sql.Int, MaKS);

        // Trong phiên bản này, Admin xem tất cả review (IsApproved = true hoặc false)
        // nên mệnh đề WHERE đơn giản hơn
        const whereClauseForAdmin = 'WHERE r.MaKS = @MaKS_Filter';

        // 3. ĐẾM TỔNG SỐ REVIEW (ĐỂ TÍNH TỔNG SỐ TRANG)
        // Query này phải sử dụng cùng mệnh đề WHERE với query lấy data (nếu có filter phức tạp)
        const countResult = await request.query(`SELECT COUNT(*) as total FROM BaiDanhGia r ${whereClauseForAdmin}`);
        const totalReviews = countResult.recordset[0].total;

        // 4. LẤY DỮ LIỆU REVIEW CHO TRANG HIỆN TẠI
        const dataResult = await request
            // Input `offset` và `limit` cho SQL
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, numericLimit)
            .query(`
                SELECT 
                    r.MaDG,
                    r.MaKH,
                    r.MaDat,
                    nd.HoTen as TenNguoiDung,
                    r.Sao,
                    r.NoiDung,
                    r.NgayDG,
                    r.IsApproved 
                FROM BaiDanhGia r
                JOIN NguoiDung nd ON r.MaKH = nd.MaKH
                -- LEFT JOIN Booking b ON r.MaDat = b.MaDat -- Nếu cần thêm thông tin từ Booking
                ${whereClauseForAdmin}
                ORDER BY r.NgayDG DESC
                OFFSET @offset ROWS          -- SQL Server pagination
                FETCH NEXT @limit ROWS ONLY -- SQL Server pagination
            `);              

        // 5. TRẢ VỀ KẾT QUẢ KÈM THÔNG TIN PHÂN TRANG
        res.json({
            success: true,
            data: dataResult.recordset,
            pagination: {
                total: totalReviews,           // Tổng số mục
                page: numericPage,             // Trang hiện tại
                limit: numericLimit,           // Số mục mỗi trang
                totalPages: Math.ceil(totalReviews / numericLimit) || 1 // Tổng số trang (ít nhất là 1)
            }
        });
    } catch (error) {
        console.error('Lỗi adminGetHotelReviews:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách review cho admin.' });
    }
};

// API CHO ADMIN: TOGGLE TRẠNG THÁI APPROVE CỦA REVIEW
// Nhận giá trị boolean mới cho IsApproved qua body
exports.adminSetReviewApproval = async (req, res) => {
    const { MaDG } = req.params;
    const { newApprovalState } = req.body; // Nhận true hoặc false

    if (typeof newApprovalState !== 'boolean') {
        return res.status(400).json({ success: false, message: 'Trạng thái duyệt mới không hợp lệ (phải là true hoặc false).' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaDG', sql.Int, MaDG)
            .input('IsApprovedNew', sql.Bit, newApprovalState) // sql.Bit cho true/false
            .query('UPDATE BaiDanhGia SET IsApproved = @IsApprovedNew WHERE MaDG = @MaDG');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá để cập nhật.' });
        }

        res.json({ success: true, message: `Đã cập nhật trạng thái duyệt của đánh giá thành ${newApprovalState}.` });
    } catch (error) {
        console.error('Lỗi adminSetReviewApproval:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái duyệt.' });
    }
};