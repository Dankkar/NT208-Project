const {poolPromise} = require('../database/db');

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
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh,
                   nd.HoTen AS NguoiQuanLy
            FROM KhachSan ks
            LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
            ORDER BY ks.MaKS DESC
        `);

        res.json(result.recordset);
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
            .query(`
                SELECT ks.*, nd.HoTen AS NguoiQuanLy
                FROM KhachSan ks
                LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
                WHERE ks.MaKS = @MaKS
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


