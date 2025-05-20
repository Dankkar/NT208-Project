const { poolPromise, sql } = require('../database/db');

exports.createRoomType = async (req, res) => {
    const { 
        MaKS, 
        TenLoaiPhong,
        TienNghi,
        DienTich,
        GiaCoSo,
        MoTa
    } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .input('TenLoaiPhong', sql.NVarChar, TenLoaiPhong)
            .input('TienNghi', sql.NVarChar, TienNghi)
            .input('DienTich', sql.Decimal(8, 2), DienTich)
            .input('GiaCoSo', sql.Decimal(18, 2), GiaCoSo)
            .input('MoTa', sql.NVarChar, MoTa)
            .query(`
                INSERT INTO LoaiPhong (MaKS, TenLoaiPhong, TienNghi, DienTich, GiaCoSo, MoTa)
                VALUES (@MaKS, @TenLoaiPhong, @TienNghi, @DienTich, @GiaCoSo, @MoTa)
            `);
        
        res.status(201).json({message: 'Loại phòng đã được tạo thành công'});
    }
    catch (err) {
        console.error('Lỗi createRoomType:', err);
        res.status(500).json({error: 'Lỗi server'});
    }   
}

exports.getRoomTypesByHotel = async (req, res) => {
    const { MaKS } = req.params;
    if(!MaKS || isNaN(MaKS)) {
        return res.status(400).json({error: 'Mã khách sạn không hợp lệ'});
    }
    
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT 
                    lp.*,
                    COUNT(p.MaPhong) as TongSoPhong,
                    SUM(CASE WHEN p.TrangThaiPhong = N'Sẵn sàng' THEN 1 ELSE 0 END) as SoPhongTrong
                FROM LoaiPhong lp
                LEFT JOIN Phong p ON lp.MaLoaiPhong = p.MaLoaiPhong
                WHERE lp.MaKS = @MaKS
                GROUP BY lp.MaLoaiPhong, lp.MaKS, lp.TenLoaiPhong, lp.TienNghi, 
                         lp.DienTich, lp.GiaCoSo, lp.MoTa
            `);
        res.json(result.recordset);
    }
    catch (err) {
        console.error('Lỗi getRoomTypesByHotel:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
}

exports.updateRoomType = async (req, res) => {
    const { MaLoaiPhong } = req.params;
    const { 
        TenLoaiPhong,
        TienNghi,
        DienTich,
        GiaCoSo,
        MoTa
    } = req.body;

    if(!MaLoaiPhong || isNaN(MaLoaiPhong)) {
        return res.status(400).json({error: 'Mã loại phòng không hợp lệ'});
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .input('TenLoaiPhong', sql.NVarChar, TenLoaiPhong)
            .input('TienNghi', sql.NVarChar, TienNghi)
            .input('DienTich', sql.Decimal(8, 2), DienTich)
            .input('GiaCoSo', sql.Decimal(18, 2), GiaCoSo)
            .input('MoTa', sql.NVarChar, MoTa)
            .query(`
                UPDATE LoaiPhong
                SET TenLoaiPhong = @TenLoaiPhong,
                    TienNghi = @TienNghi,
                    DienTich = @DienTich,
                    GiaCoSo = @GiaCoSo,
                    MoTa = @MoTa
                WHERE MaLoaiPhong = @MaLoaiPhong
            `);
        res.json({message: 'Loại phòng đã được cập nhật thành công'});
    }
    catch (err) {
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

exports.compareRoomTypes = async (req, res) => {
    const { type1, type2 } = req.params;

    try {
        const pool = await poolPromise;

        // First check if both room types exist
        const checkTypes = await pool.request()
            .input('typeId1', sql.Int, type1)
            .input('typeId2', sql.Int, type2)
            .query(`
                SELECT MaLoaiPhong 
                FROM LoaiPhong 
                WHERE MaLoaiPhong IN (@typeId1, @typeId2)
            `);

        if (checkTypes.recordset.length !== 2) {
            return res.status(404).json({
                success: false,
                message: 'Một hoặc cả hai loại phòng không tồn tại'
            });
        }

        const result = await pool.request()
            .input('typeId1', sql.Int, type1)
            .input('typeId2', sql.Int, type2)
            .query(`
                WITH Type1 AS (
                    SELECT 
                        lp.MaLoaiPhong,
                        lp.TenLoaiPhong,
                        lp.TienNghi,
                        lp.DienTich,
                        lp.GiaCoSo,
                        lp.MoTa,
                        ks.TenKS,
                        ks.HangSao,
                        ks.DiaChi,
                        COUNT(p.MaPhong) as SoPhong,
                        SUM(CASE WHEN p.TrangThaiPhong = N'Sẵn sàng' THEN 1 ELSE 0 END) as SoPhongTrong
                    FROM LoaiPhong lp
                    JOIN KhachSan ks ON lp.MaKS = ks.MaKS
                    LEFT JOIN Phong p ON lp.MaLoaiPhong = p.MaLoaiPhong
                    WHERE lp.MaLoaiPhong = @typeId1
                    GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.TienNghi, 
                             lp.DienTich, lp.GiaCoSo, lp.MoTa, ks.TenKS, ks.HangSao, ks.DiaChi
                ),
                Type2 AS (
                    SELECT 
                        lp.MaLoaiPhong,
                        lp.TenLoaiPhong,
                        lp.TienNghi,
                        lp.DienTich,
                        lp.GiaCoSo,
                        lp.MoTa,
                        ks.TenKS,
                        ks.HangSao,
                        ks.DiaChi,
                        COUNT(p.MaPhong) as SoPhong,
                        SUM(CASE WHEN p.TrangThaiPhong = N'Sẵn sàng' THEN 1 ELSE 0 END) as SoPhongTrong
                    FROM LoaiPhong lp
                    JOIN KhachSan ks ON lp.MaKS = ks.MaKS
                    LEFT JOIN Phong p ON lp.MaLoaiPhong = p.MaLoaiPhong
                    WHERE lp.MaLoaiPhong = @typeId2
                    GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.TienNghi, 
                             lp.DienTich, lp.GiaCoSo, lp.MoTa, ks.TenKS, ks.HangSao, ks.DiaChi
                )
                SELECT 
                    t1.MaLoaiPhong as Type1Id,
                    t1.TenLoaiPhong as Type1Name,
                    t1.TienNghi as Type1Amenities,
                    t1.DienTich as Type1Area,
                    t1.GiaCoSo as Type1Price,
                    t1.MoTa as Type1Description,
                    t1.TenKS as Type1HotelName,
                    t1.HangSao as Type1HotelStars,
                    t1.DiaChi as Type1HotelAddress,
                    t1.SoPhong as Type1TotalRooms,
                    t1.SoPhongTrong as Type1AvailableRooms,
                    
                    t2.MaLoaiPhong as Type2Id,
                    t2.TenLoaiPhong as Type2Name,
                    t2.TienNghi as Type2Amenities,
                    t2.DienTich as Type2Area,
                    t2.GiaCoSo as Type2Price,
                    t2.MoTa as Type2Description,
                    t2.TenKS as Type2HotelName,
                    t2.HangSao as Type2HotelStars,
                    t2.DiaChi as Type2HotelAddress,
                    t2.SoPhong as Type2TotalRooms,
                    t2.SoPhongTrong as Type2AvailableRooms
                FROM Type1 t1
                CROSS JOIN Type2 t2
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin loại phòng'
            });
        }

        // Format the response
        const comparison = {
            type1: {
                MaLoaiPhong: result.recordset[0].Type1Id,
                TenLoaiPhong: result.recordset[0].Type1Name,
                TienNghi: result.recordset[0].Type1Amenities,
                DienTich: result.recordset[0].Type1Area,
                GiaCoSo: result.recordset[0].Type1Price,
                MoTa: result.recordset[0].Type1Description,
                hotel: {
                    TenKS: result.recordset[0].Type1HotelName,
                    HangSao: result.recordset[0].Type1HotelStars,
                    DiaChi: result.recordset[0].Type1HotelAddress
                },
                availability: {
                    total: result.recordset[0].Type1TotalRooms,
                    available: result.recordset[0].Type1AvailableRooms
                }
            },
            type2: {
                MaLoaiPhong: result.recordset[0].Type2Id,
                TenLoaiPhong: result.recordset[0].Type2Name,
                TienNghi: result.recordset[0].Type2Amenities,
                DienTich: result.recordset[0].Type2Area,
                GiaCoSo: result.recordset[0].Type2Price,
                MoTa: result.recordset[0].Type2Description,
                hotel: {
                    TenKS: result.recordset[0].Type2HotelName,
                    HangSao: result.recordset[0].Type2HotelStars,
                    DiaChi: result.recordset[0].Type2HotelAddress
                },
                availability: {
                    total: result.recordset[0].Type2TotalRooms,
                    available: result.recordset[0].Type2AvailableRooms
                }
            }
        };

        res.json({
            success: true,
            data: comparison
        });
    } catch (error) {
        console.error('Error comparing room types:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi so sánh loại phòng'
        });
    }
};
