const {poolPromise, sql} = require('../database/db');

exports.createHotel = async (req, res) => {
    const {
        TenKS,
        DiaChi,
        HangSao,
        LoaiHinh,
        MoTaCoSoVatChat,
        QuyDinh,
        MotaChung
    } = req.body;
    try
    {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('TenKS', sql.VarChar, TenKS)
            .input('DiaChi', sql.VarChar, DiaChi)
            .input('HangSao', sql.VarChar, HangSao)
            .input('LoaiHinh', sql.VarChar, LoaiHinh)
            .input('MoTaCoSoVatChat', sql.Text, MoTaCoSoVatChat)
            .input('QuyDinh', sql.Text, QuyDinh)
            .input('MotaChung', sql.Text, MotaChung)
            .input('MaNguoiQuanLy', sql.Int, req.Int, req.user.MaKH)
            .query(`
                INSERT INTO KhachSan (TenKS, DiaChi, HangSao, LoaiHinh, MoTaCoSoVatChat, QuyDinh, MotaChung, MaNguoiQuanLy)
                VALUES (@TenKS, @DiaChi, @HangSao, @LoaiHinh, @MoTaCoSoVatChat, @QuyDinh, @MotaChung, @MaNguoiQuanLy)
                `)
        
        res.status(201).json({message: 'Khách sạn đã được tạo thành công'});
    }
    catch (err)
    {
        console.error('Lỗi createHotel:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};

exports.updateHotel = async (req, res) => {
    const {MaKS} = req.params;
    const {
        TenKS,
        DiaChi,
        HangSao,
        LoaiHinh,
        MoTaCoSoVatChat,
        QuyDinh,
        MotaChung
    } = req.body;

    if(!MaKS || isNaN(MaKS))
        return res.status(400).json({error: 'Mã khách sạn không hợp lệ'});

    try
    {
        const pool = await poolPromise;
        const result = await pool.request()
        .input('MaKS', sql.Int, parseInt(MaKS))
        .input('TenKS', sql.VarChar, TenKS)
        .input('DiaChi', sql.VarChar, DiaChi)
        .input('HangSao', sql.VarChar, HangSao)
        .input('LoaiHinh', sql.VarChar, LoaiHinh)
        .input('MoTaCoSoVatChat', sql.Text, MoTaCoSoVatChat)
        .input('QuyDinh', sql.Text, QuyDinh)
        .input('MotaChung', sql.Text, MotaChung)
        .query(`
            UPDATE KhachSan
            SET TenKS = @TenKS, DiaChi = @DiaChi, HangSao = @HangSao, LoaiHinh = @LoaiHinh, MoTaCoSoVatChat = @MoTaCoSoVatChat, QuyDinh = @QuyDinh, MotaChung = @MotaChung
            WHERE MaKS = @MaKS
        `);

    res.json({message: 'Thông tin khách sạn đã được cập nhật thành công'});
    }
    catch (err)
    {
        console.error('Lỗi updateHotel:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};

// exports.deleteHotel = async (req, res) => {
//     const { MaKS } = req.params;
    
//     if(!MaKS || isNaN(MaKS))
//         return res.status(400).json({error: 'Mã khách sạn không hợp lệ'});

//     try
//     {
//         const pool = await poolPromise;

//         const result = await pool.request()
//             .input('MaKS', sql.Int, parseInt(MaKS))
//             .query(`DELETE FROM KhachSan WHERE MaKS = @MaKS`);
            
//         if (result.rowsAffected[0] === 0) 
//             return res.status(404).json({error: 'Không tìm thấy khách sạn để xoá'});

//         res.json({message: 'Khách sạn đã được xóa thành công'});
//     }
//     catch (err)
//     {
//         console.error('Lỗi deleteHotel:', err);
//         res.status(500).json({error: 'Lỗi server'});
//     }
// };

exports.getAllHotels = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const pool = await poolPromise;
        const isAdmin = req.user && req.user.Role === 'admin';

        const countResult = await pool.request().query(`
            SELECT COUNT(*) as total
            FROM KhachSan
        `);

        // Base query without NguoiQuanLy
        let query = `
            SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh,
                   MIN(lp.GiaCoSo) as GiaThapNhat
            FROM KhachSan ks
            LEFT JOIN Phong p ON ks.MaKS = p.MaKS
            LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
        `;

        // Add NguoiQuanLy to query if user is admin
        if (isAdmin) {
            query = `
                SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh,
                       nd.HoTen AS NguoiQuanLy,
                       MIN(lp.GiaCoSo) as GiaThapNhat
                FROM KhachSan ks
                LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
                LEFT JOIN Phong p ON ks.MaKS = p.MaKS
                LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
            `;
        }

        // Add GROUP BY, ORDER BY and pagination
        query += `
            GROUP BY ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh
            ${isAdmin ? ', nd.HoTen' : ''}
            ORDER BY ks.HangSao DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const result = await pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(query);

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
    } catch (err) {
        console.error('Lỗi getAllHotels:', err);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
};

exports.getHotelById = async (req, res) => {
    const { MaKS } = req.params;

    if (!MaKS || isNaN(Number(MaKS))) {
        return res.status(400).json({
            success: false,
            message: 'Mã khách sạn không hợp lệ'
        });
    }

    try {
        const pool = await poolPromise;

        // Get hotel basic information
        const hotelResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh,
                       ks.MoTaCoSoVatChat, ks.QuyDinh, ks.MotaChung
                FROM KhachSan ks
                WHERE ks.MaKS = @MaKS
            `);

        if (hotelResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách sạn'
            });
        }

        // Get room types and pricing information
        const roomTypesResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo, lp.SoNguoiToiDa,
                       lp.DienTich, lp.MoTa, lp.TienNghi,
                       COUNT(p.MaPhong) as SoPhongTrong
                FROM LoaiPhong lp
                LEFT JOIN Phong p ON lp.MaLoaiPhong = p.MaLoaiPhong 
                    AND p.TrangThai = N'Trống'
                WHERE lp.MaKS = @MaKS
                GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo, lp.SoNguoiToiDa,
                         lp.DienTich, lp.MoTa, lp.TienNghi
                ORDER BY lp.GiaCoSo ASC
            `);

        // Get hotel amenities/services
        const servicesResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT dv.MaDichVu, dv.TenDichVu, dv.MoTa, dv.Gia
                FROM DichVu dv
                WHERE dv.MaKS = @MaKS
                ORDER BY dv.TenDichVu
            `);

        // Calculate price range
        const priceRange = roomTypesResult.recordset.length > 0 ? {
            min: Math.min(...roomTypesResult.recordset.map(room => room.GiaCoSo)),
            max: Math.max(...roomTypesResult.recordset.map(room => room.GiaCoSo))
        } : { min: 0, max: 0 };

        const hotelData = {
            ...hotelResult.recordset[0],
            roomTypes: roomTypesResult.recordset,
            services: servicesResult.recordset,
            priceRange: priceRange,
            totalRoomTypes: roomTypesResult.recordset.length
        };

        res.json({
            success: true,
            data: hotelData
        });
    } catch (err) {
        console.error('Lỗi getHotelById:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.getHotelsByNguoiQuanLy = async (req, res) => {
    const {MaKH} = req.params;

    if(!MaKH || isNaN(MaKH))
        return res.status(400).json({error: 'Mã người quản lý không hợp lệ'});

    try
    {
        const pool = await poolPromise;
        const result = await pool.request()
        .input('MaKH', sql.Int, parseInt(MaKH))
        .query(`
            SELECT * FROM KhachSan
            WHERE MaNguoiQuanLy = @MaKH
        `);

        res.json(result.recordset);
    }
    catch (err)
    {
        console.error('Lỗi getHotelByNguoiQuanLy:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};

// Lấy danh sách khách sạn nổi bật
exports.getFeaturedHotels = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 6
                ks.MaKS,
                ks.TenKS,
                ks.DiaChi,
                ks.HangSao,
                MIN(lp.GiaCoSo) as GiaThapNhat
            FROM KhachSan ks
            LEFT JOIN Phong p ON ks.MaKS = p.MaKS
            LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
            GROUP BY ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao
            ORDER BY ks.HangSao DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi getFeaturedHotels:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách khách sạn nổi bật'
        });
    }
};

exports.suggestLocations = async (req, res) => {
    try {
        const keyword = req.query.keyword; //từ khóa tìm kiếm
        const pool = await poolPromise;
        const result = await pool.request()
            .input('keyword', sql.VarChar, keyword)
            .query(`
                SELECT DISTINCT DiaChi
                FROM KhachSan
                WHERE DiaChi  COLLATE Latin1_General_CI_AI LIKE '%' + @keyword + '%'
            `);
        
        res.json({
            success: true,
            data: result.recordset.map(r => r.DiaChi)
        });
    }
    catch (err)
    {
        console.error('Lỗi suggestLocations:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
}

// HÀM MỚI: Lấy danh sách khách sạn cơ bản cho Admin (MaKS, TenKS)
exports.getBasicHotelListForAdmin = async (req, res) => {
    try {
        // Middleware isAdmin đã kiểm tra quyền Admin rồi
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT MaKS, TenKS FROM KhachSan ORDER BY TenKS ASC`); // Lấy MaKS và TenKS

        if (result.recordset.length === 0) {
            return res.status(200).json({
                success: true,
                data: [] // Trả về mảng rỗng nếu không có khách sạn nào
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error("Lỗi trong hotelController.getBasicHotelListForAdmin:", error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách khách sạn cho admin.'
        });
    }
};
