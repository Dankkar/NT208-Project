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

exports.deleteHotel = async (req, res) => {
    const { MaKS } = req.params;
    
    if(!MaKS || isNaN(MaKS))
        return res.status(400).json({error: 'Mã khách sạn không hợp lệ'});

    try
    {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('MaKS', sql.Int, parseInt(MaKS))
            .query(`DELETE FROM KhachSan WHERE MaKS = @MaKS`);
            
        if (result.rowsAffected[0] === 0) 
            return res.status(404).json({error: 'Không tìm thấy khách sạn để xoá'});

        res.json({message: 'Khách sạn đã được xóa thành công'});
    }
    catch (err)
    {
        console.error('Lỗi deleteHotel:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};

exports.getAllHotels = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const pool = await poolPromise;

        const countResult = await pool.request().query(`
            SELECT COUNT(*) as total
            FROM KhachSan
        `);
        const total = countResult.recordset[0].total;
        const totalPages = Math.ceil(total / limit);

        const result = await pool.request().query(`
            SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh,
                   nd.HoTen AS NguoiQuanLy
            FROM KhachSan ks
            LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
            ORDER BY ks.MaKS DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `);

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
        return res.status(400).json({ error: 'Mã khách sạn không hợp lệ' });
    }

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT ks.*, nd.HoTen AS NguoiQuanLy
                FROM KhachSan ks
                LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
                WHERE ks.MaKS = @MaKS
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy khách sạn' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Lỗi getHotelById:', err);
        res.status(500).json({ error: 'Lỗi server' });
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
        
        res.json(result.recordset.map(r => r.DiaChi));
    }
    catch (err)
    {
        console.error('Lỗi suggestLocations:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
}