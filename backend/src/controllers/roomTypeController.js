const { poolPromise, sql } = require('../database/db');

exports.createRoomType = async (req, res) => {
    const { 
        MaKS,
        TenLoaiPhong,
        SoGiuong,
        TienNghi,
        DienTich,
        GiaCoSo,
        MoTa
    } = req.body;

    //Validate required fields
    if (!MaKS || !TenLoaiPhong || !SoGiuong || !GiaCoSo) {
        return res.status(400).json({
            success: false,
            error: 'Vui lòng điền đầy đủ các trường bắt buộc'
        });
    }

    
    try {
        const pool = await poolPromise;
        const fs = require('fs');
        const path = require('path');

        const hotelCheck = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT * FROM KhachSan WHERE MaKS = @MaKS AND IsActive = 1
            `);

        if (hotelCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy khách sạn hợp lệ'
            });
        }

        const hotel = hotelCheck.recordset[0];
        let imagePath = null;
        let imageAction = 'none';

        //Xu ly anh
        if(req.file) {
            let finalPath = req.file.path;
            let relativePath = '';

            if(req.file.path.includes('temp')) {
                //Di chuyen tu temp folder den dung thu muc
                const targetDir = path.join(__dirname, `../../uploads/hotels/${hotel.MaKS}/room-types`);
                if(!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, {recursive: true}); 
                }
                const targetPath = path.join(targetDir, req.file.filename);
                fs.renameSync(req.file.path, targetPath);
                finalPath = targetPath;
                relativePath = `uploads/hotels/${hotel.MaKS}/room-types/${req.file.filename}`;
            } else {
                relativePath = `uploads/hotels/${hotel.MaKS}/room-types/${req.file.filename}`;
            }
            imagePath = relativePath;
            imageAction = 'uploaded';
        }

        //Tao loai phong
        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .input('TenLoaiPhong', sql.NVarChar, TenLoaiPhong)
            .input('SoGiuong', sql.Int, SoGiuong)
            .input('TienNghi', sql.NVarChar, TienNghi)
            .input('DienTich', sql.Decimal(8, 2), DienTich)
            .input('GiaCoSo', sql.Decimal(18, 2), GiaCoSo)
            .input('MoTa', sql.NVarChar, MoTa)
            .input('DuongDanAnh', sql.NVarChar, imagePath)
            .query(`
                INSERT INTO LoaiPhong (MaKS, TenLoaiPhong, SoGiuong, TienNghi, DienTich, GiaCoSo, MoTa, DuongDanAnh)
                OUTPUT INSERTED.MaLoaiPhong
                VALUES (@MaKS, @TenLoaiPhong, @SoGiuong, @TienNghi, @DienTich, @GiaCoSo, @MoTa, @DuongDanAnh)
            `);

        const newRoomTypeId = result.recordset[0].MaLoaiPhong;

        let message = 'Loại phòng đã được tạo thành công';
        if(imageAction === 'uploaded') {
            message += ' và đã upload ảnh';
        }

        res.status(201).json({
            success: true,
            message: message,
            data: {
                MaLoaiPhong: newRoomTypeId,
                TenLoaiPhong: TenLoaiPhong,
                HotelName: hotel.TenKS,
                ImagePath: imagePath ? `${req.protocol}://${req.get('host')}/${imagePath}` : null,
                ImageAction: imageAction
            }
        });
    }
    catch (err) {
        console.error('Lỗi createRoomType:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
};


exports.getRoomTypesByHotel = async (req, res) => {
    const { MaKS } = req.params;
    if(!MaKS || isNaN(MaKS)) {
        return res.status(400).json({error: 'Mã khách sạn không hợp lệ'});
    }
    
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const pool = await poolPromise;
        const countResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT COUNT(*) as total
                FROM LoaiPhong lp
                JOIN KhachSan ks ON lp.MaKS = ks.MaKS
                WHERE lp.MaKS = @MaKS
            `);

        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)  
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT 
                    lp.*,
                    COUNT(p.MaPhong) as TongSoPhong,
                    SUM(CASE WHEN p.TrangThaiPhong = N'Sẵn sàng' THEN 1 ELSE 0 END) as SoPhongTrong
                FROM LoaiPhong lp
                LEFT JOIN Phong p ON lp.MaLoaiPhong = p.MaLoaiPhong
                WHERE lp.MaKS = @MaKS
                GROUP BY lp.MaLoaiPhong, lp.MaKS, lp.TenLoaiPhong, lp.SoGiuong, lp.TienNghi, 
                         lp.DienTich, lp.GiaCoSo, lp.MoTa, lp.IsActive, lp.DuongDanAnh
                ORDER BY lp.MaLoaiPhong DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

        const roomTypeWithImage = result.recordset.map(roomType => {
            return {
                ...roomType,
                RoomTypeImagePath: roomType.DuongDanAnh ? `${req.protocol}://${req.get('host')}/${roomType.DuongDanAnh}` : null
            }
        })
        res.json({
            success: true,
            data: roomTypeWithImage,
            pagination: {
                total: countResult.recordset[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.recordset[0].total / parseInt(limit))
            }
        });
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
        SoGiuong,
        TienNghi,
        DienTich,
        GiaCoSo,
        MoTa,
        IsActive,
        deleteImage //flag de xoa anh
    } = req.body;

    if(!MaLoaiPhong || isNaN(MaLoaiPhong)) {
        return res.status(400).json({error: 'Mã loại phòng không hợp lệ'});
    }

    try {
        const pool = await poolPromise;
        const fs = require('fs');
        const path = require('path');

        const currentRoomTypeResult = await pool.request()
            .input('MaLoaiPhong', sql.Int, parseInt(MaLoaiPhong))
            .query(`
                SELECT lp.*, ks.TenKS
                FROM LoaiPhong lp
                JOIN KhachSan ks ON lp.MaKS = ks.MaKS
                WHERE lp.MaLoaiPhong = @MaLoaiPhong AND lp.IsActive = 1    
            `);

        if(currentRoomTypeResult.recordset.length === 0)
        {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy loại phòng'
            });
        }

        const currentRoomType = currentRoomTypeResult.recordset[0];
        const hotelId = currentRoomType.MaKS;
        let newImagePath = currentRoomType.DuongDanAnh; //Giu anh cu la mac dinh
        let imageAction = 'unchanged'; //track hanh dong voi anh

        //Xu ly anh
        if (deleteImage === 'true' || deleteImage === true)
        {
            //Truong hop 1: Xoa anh hien tai
            if (currentRoomType.DuongDanAnh) {
                try {
                    const oldFilePath = path.join(__dirname, '../../', currentRoomType.DuongDanAnh);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                } catch (fileError) {
                    console.warn(`Không thể xóa file cũ: ${currentRoomType.DuongDanAnh}`, fileError);
                }
            }
            newImagePath = null;
            imageAction = 'deleted';
        }
        else if (req.file)
        {
          //Truong hop 2: Upload anh moi
          
          //Xoa anh cu neu co
          if(currentRoomType.DuongDanAnh) {
            try {
                const oldFilePath = path.join(__dirname, '../../', currentRoomType.DuongDanAnh);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            } catch (fileError) {
                console.warn(`Không thể xóa file cũ: ${currentRoomType.DuongDanAnh}`, fileError);
            }
          }

          //Xu ly anh moi
          let finalPath = req.file.path;
          let relativePath = '';

          if(req.file.path.includes('temp')) {
            //Di chuyen tu temp folder den dung thu muc
            const targetDir = path.join(__dirname, `../../uploads/hotels/${hotelId}/room-types`);
            if(!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, {recursive: true});
            }
            const targetPath = path.join(targetDir, req.file.filename);
            fs.renameSync(req.file.path, targetPath);
            finalPath = targetPath;
            relativePath = `uploads/hotels/${hotelId}/room-types/${req.file.filename}`;
          }
          else {
            relativePath = `uploads/hotels/${hotelId}/room-types/${req.file.filename}`;
          }
          newImagePath = relativePath;
          imageAction = 'uploaded';
        }
        // Trường hợp 3: Giữ nguyên ảnh hiện tại (không có deleteImage và không có file mới)

        //Cap nhat thong tin loai phong 
        const result = await pool.request()
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .input('TenLoaiPhong', sql.NVarChar, TenLoaiPhong)
            .input('SoGiuong', sql.Int, SoGiuong)
            .input('TienNghi', sql.NVarChar, TienNghi)
            .input('DienTich', sql.Decimal(8, 2), DienTich)
            .input('GiaCoSo', sql.Decimal(18, 2), GiaCoSo)
            .input('MoTa', sql.NVarChar, MoTa)
            .input('IsActive', sql.Bit, IsActive)
            .input('DuongDanAnh', sql.NVarChar, newImagePath)
            .query(`
                UPDATE LoaiPhong
                SET TenLoaiPhong = @TenLoaiPhong,
                    SoGiuong = @SoGiuong,
                    TienNghi = @TienNghi,
                    DienTich = @DienTich,
                    GiaCoSo = @GiaCoSo,
                    MoTa = @MoTa,
                    IsActive = @IsActive,
                    DuongDanAnh = @DuongDanAnh
                WHERE MaLoaiPhong = @MaLoaiPhong
            `);
        // Tạo response message dựa trên hành động với ảnh
        let message = 'Loại phòng đã được cập nhật thành công';
        switch(imageAction) {
            case 'uploaded':
                message += ' và đã upload ảnh mới';
                break;
            case 'deleted':
                message += ' và đã xóa ảnh';
                break;
            case 'unchanged':
                message += ' (ảnh giữ nguyên)';
                break;
        }

        res.json({
            success: true,
            message: message,
            data: {
                MaLoaiPhong: parseInt(MaLoaiPhong),
                TenLoaiPhong: TenLoaiPhong,
                HotelName: currentRoomType.TenKS,
                ImagePath: newImagePath ? `${req.protocol}://${req.get('host')}/${newImagePath}` : null,
                ImageAction: imageAction
            }
        });
    }
    catch (err) {
        console.error('Lỗi updateRoomType:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
}

// exports.deleteRoomType = async (req, res) => {
//     const { MaLoaiPhong } = req.params;
//     if(!MaLoaiPhong || isNaN(MaLoaiPhong))
//     {
//         return res.status(400).json({error: 'Mã loại phòng không hợp lệ'});
//     }

//     try
//     {
//         const pool = await poolPromise;
//         const result = await pool.request()
//             .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
//             .query(`
//                 DELETE FROM LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong
//             `)
//         res.json({message: 'Loại phòng đã được xóa thành công'});
//     }
//     catch (err)
//     {
//         console.error('Lỗi deleteRoomType:', err);
//         res.status(500).json({error: 'Lỗi server'});
//     }
    
// }

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
                        lp.DuongDanAnh,
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
                             lp.DienTich, lp.GiaCoSo, lp.MoTa, lp.DuongDanAnh,
                             ks.TenKS, ks.HangSao, ks.DiaChi
                ),
                Type2 AS (
                    SELECT 
                        lp.MaLoaiPhong,
                        lp.TenLoaiPhong,
                        lp.TienNghi,
                        lp.DienTich,
                        lp.GiaCoSo,
                        lp.MoTa,
                        lp.DuongDanAnh,
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
                             lp.DienTich, lp.GiaCoSo, lp.MoTa, lp.DuongDanAnh,
                             ks.TenKS, ks.HangSao, ks.DiaChi
                )
                SELECT 
                    t1.MaLoaiPhong as Type1Id,
                    t1.TenLoaiPhong as Type1Name,
                    t1.TienNghi as Type1Amenities,
                    t1.DienTich as Type1Area,
                    t1.GiaCoSo as Type1Price,
                    t1.MoTa as Type1Description,
                    t1.DuongDanAnh as Type1ImagePath,
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
                    t2.DuongDanAnh as Type2ImagePath,
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
                RoomImagePath: result.recordset[0].Type1ImagePath
                    ? `${req.protocol}://${req.get('host')}/${result.recordset[0].Type1ImagePath}`
                    : null,
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
                RoomImagePath: result.recordset[0].Type2ImagePath
                    ? `${req.protocol}://${req.get('host')}/${result.recordset[0].Type2ImagePath}`
                    : null,
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


exports.getRoomTypeById = async (req, res) => {
    const { MaLoaiPhong } = req.params; // Lấy ID từ route params

    if (!MaLoaiPhong || isNaN(MaLoaiPhong)) {
        return res.status(400).json({ success: false, error: 'Mã loại phòng không hợp lệ.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .query(`
                SELECT 
                    lp.*,
                    ks.TenKS,
                    ks.DiaChi,
                    ks.HangSao
                FROM LoaiPhong lp
                JOIN KhachSan ks ON lp.MaKS = ks.MaKS
                WHERE lp.MaLoaiPhong = @MaLoaiPhong AND lp.IsActive = 1
            `);

        if (result.recordset.length > 0) {
            const roomType = result.recordset[0];
            const roomTypeWithImage = {
                ...roomType,
                RoomImagePath: roomType.DuongDanAnh 
                    ? `${req.protocol}://${req.get('host')}/${roomType.DuongDanAnh}` 
                    : null
            };

            res.json({ 
                success: true, 
                data: roomTypeWithImage 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: `Không tìm thấy loại phòng với ID ${MaLoaiPhong}.` 
            });
        }
    } catch (err) {
        console.error(`Lỗi khi lấy chi tiết loại phòng ID ${MaLoaiPhong}:`, err);
        // Trong môi trường development, bạn có thể muốn trả về chi tiết lỗi
        const errorMessage = process.env.NODE_ENV === 'development' ? err.message : 'Lỗi server khi lấy chi tiết loại phòng.';
        res.status(500).json({ success: false, error: errorMessage });
    }
};