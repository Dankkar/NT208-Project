<<<<<<< HEAD
const { poolPromise, sql } = require('../database/db');
=======
const { poolPromise, sql} = require('../database/db');


>>>>>>> develop

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
        const result = await pool.request()
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

exports.compareRoomTypes = async (req, res) => {
    // Support both URL formats:
    // 1. /roomTypes/compare/1/2 (route params)
    // 2. /roomTypes/compare?type1=1&type2=2 (query params)
    const typeId1 = req.params.typeId1 || req.query.type1;
    const typeId2 = req.params.typeId2 || req.query.type2;

    // Input validation
    if (!typeId1 || !typeId2) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp ID của hai loại phòng cần so sánh'
        });
    }

    // Convert to numbers and validate
    const type1 = parseInt(typeId1);
    const type2 = parseInt(typeId2);

    if (isNaN(type1) || isNaN(type2)) {
        return res.status(400).json({
            success: false,
            message: 'ID loại phòng phải là số'
        });
    }

    if (type1 === type2) {
        return res.status(400).json({
            success: false,
            message: 'Không thể so sánh loại phòng với chính nó'
        });
    }

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
                        lp.SoGiuong,
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
                    GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.SoGiuong, lp.TienNghi, 
                             lp.DienTich, lp.GiaCoSo, lp.MoTa, ks.TenKS, ks.HangSao, ks.DiaChi
                ),
                Type2 AS (
                    SELECT 
                        lp.MaLoaiPhong,
                        lp.TenLoaiPhong,
                        lp.SoGiuong,
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
                    GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.SoGiuong, lp.TienNghi, 
                             lp.DienTich, lp.GiaCoSo, lp.MoTa, ks.TenKS, ks.HangSao, ks.DiaChi
                )
                SELECT 
                    t1.MaLoaiPhong as Type1Id,
                    t1.TenLoaiPhong as Type1Name,
                    t1.SoGiuong as Type1Beds,
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
                    t2.SoGiuong as Type2Beds,
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
                SoGiuong: result.recordset[0].Type1Beds,
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
                SoGiuong: result.recordset[0].Type2Beds,
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
            },
            comparison: {
                priceDifference: result.recordset[0].Type1Price - result.recordset[0].Type2Price,
                areaDifference: result.recordset[0].Type1Area - result.recordset[0].Type2Area,
                bedsDifference: result.recordset[0].Type1Beds - result.recordset[0].Type2Beds,
                priceDifferencePercentage: ((result.recordset[0].Type1Price - result.recordset[0].Type2Price) / result.recordset[0].Type2Price * 100).toFixed(2),
                areaDifferencePercentage: ((result.recordset[0].Type1Area - result.recordset[0].Type2Area) / result.recordset[0].Type2Area * 100).toFixed(2),
                availabilityDifference: result.recordset[0].Type1AvailableRooms - result.recordset[0].Type2AvailableRooms
            }
        };

        res.json({
            success: true,
            data: comparison
        });
    } catch (error) {
        console.error('Lỗi so sánh loại phòng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi so sánh loại phòng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
