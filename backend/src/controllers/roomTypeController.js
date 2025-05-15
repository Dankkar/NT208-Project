const { poolPromise } = require('../config/dbConfig');

exports.createRoomType = async (req, res) => {
    const { 
        MaKS, 
        TenLoai,
        SoGiuong,
        TienNghi,
        DienTich,
        GiaCoSo,
        Mota
    } = req.body;

    try
    {
        const pool = await poolPromise;
        await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .input('TenLoai', sql.VarChar, TenLoai)
            .input('SoGiuong', sql.Int, SoGiuong)
            .input('TienNghi', sql.Text, TienNghi)
            .input('DienTich', sql.Int, DienTich)
            .input('GiaCoSo', sql.Int, GiaCoSo)
            .input('Mota', sql.Text, Mota)
            .query(`
                INSERT INTO LoaiPhong (MaKS, TenLoai, SoGiuong, TienNghi, DienTich, GiaCoSo, Mota)
                VALUES (@MaKS, @TenLoai, @SoGiuong, @TienNghi, @DienTich, @GiaCoSo, @Mota)
            `)
        
        res.status(201).json({message: 'Loại phòng đã được tạo thành công'});
    }
    catch (err)
    {
        console.error('Lỗi createRoomType:', err);
        res.status(500).json({error: 'Lỗi server'});
    }   
}

exports.getRoomTypesByHotel = async (req, res) => {
    const { MaKS} = req.params;
    if(!MaKS || isNaN(MaKS))
    {
        return res.status(400).json({error: 'Mã khách sạn không hợp lệ'});
    }
    
    try
    {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT * FROM LoaiPhong WHERE MaKS = @MaKS
            `)
        res.json(result.recordset);
    }
    catch (err)
    {
        console.error('Lỗi getRoomTypesByHotel:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
}

exports.updateRoomType = async (req, res) => {
    const { MaLoaiPhong } = req.params;
    const { 
        TenLoaiPhong,
        SoGiuong,
        TienNghi,
        DienTich,
        GiaCoSo,
        Mota
    } = req.body;

    if(!MaLoaiPhong || isNaN(MaLoaiPhong))
    {
        return res.status(400).json({error: 'Mã loại phòng không hợp lệ'});
    }

    try
    {
       const pool = await poolPromise;
       const result = await pool.request()
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .input('TenLoaiPhong', sql.VarChar, TenLoaiPhong)
            .input('SoGiuong', sql.Int, SoGiuong)
            .input('TienNghi', sql.Text, TienNghi)
            .input('DienTich', sql.Int, DienTich)
            .input('GiaCoSo', sql.Int, GiaCoSo)
            .input('Mota', sql.Text, Mota)
            .query(`
                UPDATE LoaiPhong
                SET TenLoaiPhong = @TenLoaiPhong,
                    SoGiuong = @SoGiuong,
                    TienNghi = @TienNghi,
                    DienTich = @DienTich,
                    GiaCoSo = @GiaCoSo,
                    Mota = @Mota
                WHERE MaLoaiPhong = @MaLoaiPhong
            `)
        res.json({message: 'Loại phòng đã được cập nhật thành công'});
    }
    catch (err)
    {
        console.error('Lỗi updateRoomType:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
}

exports.deleteRoomType = async (req, res) => {
    const { MaLoaiPhong } = req.params;
    if(!MaLoaiPhong || isNaN(MaLoaiPhong))
    {
        return res.status(400).json({error: 'Mã loại phòng không hợp lệ'});
    }

    try
    {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .query(`
                DELETE FROM LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong
            `)
        res.json({message: 'Loại phòng đã được xóa thành công'});
    }
    catch (err)
    {
        console.error('Lỗi deleteRoomType:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
    
}
