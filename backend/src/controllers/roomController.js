const { poolPromise, sql } = require('../database/db');

exports.createRoom = async (req, res) => {
    const {
        MaKS,
        MaLoaiPhong,
        MaCauHinhGiuong,
        SoPhong,
        Tang,
        TrangThaiPhong = 'Sẵn sàng'
    } = req.body;

    // Validate input
    if (!MaKS || !MaLoaiPhong || !MaCauHinhGiuong || !SoPhong) {
        return res.status(400).json({
            success: false,
            error: 'Vui lòng điền đầy đủ các trường bắt buộc: MaKS, MaLoaiPhong, MaCauHinhGiuong, SoPhong'
        });
    }

    try {
        const pool = await poolPromise;
        
        // Kiểm tra khách sạn có tồn tại không
        const hotelCheck = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query('SELECT MaKS FROM KhachSan WHERE MaKS = @MaKS AND IsActive = 1');
        
        if (hotelCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Khách sạn không tồn tại'
            });
        }

        // Kiểm tra loại phòng có tồn tại và thuộc khách sạn không
        const roomTypeCheck = await pool.request()
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .input('MaKS', sql.Int, MaKS)
            .query('SELECT MaLoaiPhong FROM LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong AND MaKS = @MaKS AND IsActive = 1');
        
        if (roomTypeCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Loại phòng không tồn tại hoặc không thuộc khách sạn này'
            });
        }

        // Kiểm tra cấu hình giường có tồn tại không
        const bedConfigCheck = await pool.request()
            .input('MaCauHinhGiuong', sql.Int, MaCauHinhGiuong)
            .query('SELECT MaCauHinhGiuong FROM CauHinhGiuong WHERE MaCauHinhGiuong = @MaCauHinhGiuong');
        
        if (bedConfigCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cấu hình giường không tồn tại'
            });
        }

        // Kiểm tra số phòng đã tồn tại trong khách sạn chưa
        const roomNumberCheck = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .input('SoPhong', sql.NVarChar, SoPhong)
            .query('SELECT MaPhong FROM Phong WHERE MaKS = @MaKS AND SoPhong = @SoPhong');
        
        if (roomNumberCheck.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Số phòng đã tồn tại trong khách sạn'
            });
        }

        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .input('MaCauHinhGiuong', sql.Int, MaCauHinhGiuong)
            .input('SoPhong', sql.NVarChar, SoPhong)
            .input('Tang', sql.Int, Tang)
            .input('TrangThaiPhong', sql.NVarChar, TrangThaiPhong)
            .query(`INSERT INTO Phong (MaKS, MaLoaiPhong, MaCauHinhGiuong, SoPhong, Tang, TrangThaiPhong, IsActive)
                OUTPUT INSERTED.MaPhong
                VALUES (@MaKS, @MaLoaiPhong, @MaCauHinhGiuong, @SoPhong, @Tang, @TrangThaiPhong, 1)`);
        
        const newRoomId = result.recordset[0].MaPhong;
        
        res.status(201).json({
            success: true,
            message: 'Phòng đã được tạo thành công',
            data: {
                MaPhong: newRoomId,
                MaKS,
                MaLoaiPhong,
                MaCauHinhGiuong,
                SoPhong,
                Tang,
                TrangThaiPhong,
                IsActive: true
            }
        });
    }
    catch(err){
        console.error('Lỗi createRoom:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
};

exports.getRoomByHotel = async (req, res) => {
    const { MaKS } = req.params;

    if(!MaKS || isNaN(MaKS)){
        return res.status(400).json({
            success: false,
            error: 'Mã khách sạn không hợp lệ'
        })
    }

    try {
        const { page = 1, limit = 10} = req.query;
        const offset = (page - 1) * limit;
        const pool = await poolPromise;
        
        // Kiểm tra khách sạn có tồn tại không
        const hotelCheck = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query('SELECT MaKS FROM KhachSan WHERE MaKS = @MaKS AND IsActive = 1');
        
        if (hotelCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Khách sạn không tồn tại'
            });
        }

        // Đếm tổng số phòng
        const countResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`SELECT COUNT(*) AS total FROM Phong WHERE MaKS = @MaKS AND IsActive = 1`);
        
        // Lấy danh sách phòng với thông tin chi tiết
        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`SELECT
                p.MaPhong,
                p.MaKS,
                p.MaLoaiPhong,
                p.MaCauHinhGiuong,
                p.SoPhong,
                p.Tang,
                p.TrangThaiPhong,
                p.IsActive,
                lp.TenLoaiPhong,
                lp.SoGiuong,
                lp.TienNghi,
                lp.DienTich,
                lp.GiaCoSo,
                lp.MoTa,
                chg.TenCauHinh,
                chg.SoGiuongDoi,
                chg.SoGiuongDon
                FROM Phong p
                JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE p.MaKS = @MaKS AND p.IsActive = 1
                ORDER BY p.Tang, p.SoPhong
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY`
            );

        // Tính thống kê phòng
        const statsResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`SELECT
                COUNT(*) AS TongSoPhong,
                SUM(CASE WHEN TrangThaiPhong = N'Sẵn sàng' THEN 1 ELSE 0 END) AS SoPhongTrong,
                SUM(CASE WHEN TrangThaiPhong = N'Đang ở' THEN 1 ELSE 0 END) AS SoPhongDangO,
                SUM(CASE WHEN TrangThaiPhong = N'Bảo trì' THEN 1 ELSE 0 END) AS SoPhongBaoTri
                FROM Phong 
                WHERE MaKS = @MaKS AND IsActive = 1`);
        
        res.json({
            success: true,
            data: result.recordset,
            stats: statsResult.recordset[0],
            pagination: {
                total: countResult.recordset[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.recordset[0].total / limit)
            }
        });
    }
    catch(err){
        console.error('Lỗi getRoomByHotel:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
}

exports.getRoomById = async (req, res) => {
    const { MaPhong } = req.params;

    if(!MaPhong || isNaN(MaPhong)){
        return res.status(400).json({
            success: false,
            error: 'Mã phòng không hợp lệ'
        })
    }

    try{
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .query(`SELECT
                    p.MaPhong,
                    p.MaKS,
                    p.MaLoaiPhong,
                    p.MaCauHinhGiuong,
                    p.SoPhong,
                    p.Tang,
                    p.TrangThaiPhong,
                    p.IsActive,
                    lp.TenLoaiPhong,
                    lp.SoGiuong,
                    lp.TienNghi,
                    lp.DienTich,
                    lp.GiaCoSo,
                    lp.MoTa,
                    lp.DuongDanAnh,
                    chg.TenCauHinh,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon,
                    ks.TenKS,
                    ks.DiaChi
                    FROM Phong p 
                    JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                    JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                    JOIN KhachSan ks ON p.MaKS = ks.MaKS
                    WHERE p.MaPhong = @MaPhong AND p.IsActive = 1`
                );

        if(result.recordset.length > 0){
            const room = result.recordset[0];
            res.json({
                success: true,
                data: room
            });
        }
        else{
            res.status(404).json({
                success: false,
                error: 'Không tìm thấy phòng với mã đã cho'
            });
        }
    }
    catch(err){
        console.error('Lỗi getRoomById:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        })
    }
};

exports.updateRoom = async (req, res) => {
    const { MaPhong } = req.params;
    const {
        MaKS,
        MaLoaiPhong,
        MaCauHinhGiuong,
        SoPhong,
        Tang,
        TrangThaiPhong,
        IsActive
    } = req.body;

    if (!MaPhong || isNaN(MaPhong)) {
        return res.status(400).json({
            success: false,
            error: 'Mã phòng không hợp lệ'
        });
    }

    try {
        const pool = await poolPromise;

        // Kiểm tra phòng có tồn tại không
        const check = await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .query('SELECT * FROM Phong WHERE MaPhong = @MaPhong');

        if (check.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy phòng'
            });
        }

        // Nếu có thay đổi số phòng, kiểm tra trùng lặp
        if (SoPhong && MaKS) {
            const duplicateCheck = await pool.request()
                .input('MaKS', sql.Int, MaKS)
                .input('SoPhong', sql.NVarChar, SoPhong)
                .input('MaPhong', sql.Int, MaPhong)
                .query('SELECT MaPhong FROM Phong WHERE MaKS = @MaKS AND SoPhong = @SoPhong AND MaPhong != @MaPhong');
            
            if (duplicateCheck.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Số phòng đã tồn tại trong khách sạn'
                });
            }
        }

        // Cập nhật phòng
        await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .input('MaKS', sql.Int, MaKS)
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .input('MaCauHinhGiuong', sql.Int, MaCauHinhGiuong)
            .input('SoPhong', sql.NVarChar, SoPhong)
            .input('Tang', sql.Int, Tang)
            .input('TrangThaiPhong', sql.NVarChar, TrangThaiPhong)
            .input('IsActive', sql.Bit, IsActive !== undefined ? IsActive : true)
            .query(`
                UPDATE Phong
                SET MaKS = COALESCE(@MaKS, MaKS),
                    MaLoaiPhong = COALESCE(@MaLoaiPhong, MaLoaiPhong),
                    MaCauHinhGiuong = COALESCE(@MaCauHinhGiuong, MaCauHinhGiuong),
                    SoPhong = COALESCE(@SoPhong, SoPhong),
                    Tang = COALESCE(@Tang, Tang),
                    TrangThaiPhong = COALESCE(@TrangThaiPhong, TrangThaiPhong),
                    IsActive = @IsActive
                WHERE MaPhong = @MaPhong
            `);

        res.json({
            success: true,
            message: 'Cập nhật thông tin phòng thành công',
            data: {
                MaPhong: parseInt(MaPhong),
                MaKS,
                MaLoaiPhong,
                MaCauHinhGiuong,
                SoPhong,
                Tang,
                TrangThaiPhong,
                IsActive
            }
        });
    } catch (err) {
        console.error('Lỗi updateRoom:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi cập nhật phòng'
        });
    }
};

exports.deleteRoom = async (req, res) => {
    const { MaPhong } = req.params;

    if (!MaPhong || isNaN(MaPhong)) {
        return res.status(400).json({
            success: false,
            error: 'Mã phòng không hợp lệ'
        });
    }

    try {
        const pool = await poolPromise;

        // Kiểm tra phòng có tồn tại không
        const check = await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .query('SELECT * FROM Phong WHERE MaPhong = @MaPhong');

        if (check.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy phòng'
            });
        }

        // Kiểm tra phòng có đang được đặt không
        const bookingCheck = await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .query(`SELECT COUNT(*) as bookingCount FROM Booking 
                   WHERE MaPhong = @MaPhong 
                   AND TrangThaiBooking NOT IN (N'Đã hủy', N'Hoàn thành')`);

        if (bookingCheck.recordset[0].bookingCount > 0) {
            return res.status(400).json({
                success: false,
                error: 'Không thể xóa phòng đang có booking'
            });
        }

        // Soft delete - chỉ đổi IsActive thành false
        await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .query('UPDATE Phong SET IsActive = 0 WHERE MaPhong = @MaPhong');

        res.json({
            success: true,
            message: 'Xóa phòng thành công'
        });
    } catch (err) {
        console.error('Lỗi deleteRoom:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi xóa phòng'
        });
    }
};

exports.getRoomsByRoomType = async (req, res) => {
    const { MaLoaiPhong } = req.params;

    if (!MaLoaiPhong || isNaN(MaLoaiPhong)) {
        return res.status(400).json({
            success: false,
            error: 'Mã loại phòng không hợp lệ'
        });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .query(`SELECT
                p.MaPhong,
                p.MaKS,
                p.MaLoaiPhong,
                p.MaCauHinhGiuong,
                p.SoPhong,
                p.Tang,
                p.TrangThaiPhong,
                p.IsActive,
                lp.TenLoaiPhong,
                chg.TenCauHinh
                FROM Phong p 
                JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE p.MaLoaiPhong = @MaLoaiPhong AND p.IsActive = 1
                ORDER BY p.Tang, p.SoPhong`);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Lỗi getRoomsByRoomType:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
};

exports.updateRoomStatus = async (req, res) => {
    const { MaPhong } = req.params;
    const { TrangThaiPhong } = req.body;

    if (!MaPhong || isNaN(MaPhong)) {
        return res.status(400).json({
            success: false,
            error: 'Mã phòng không hợp lệ'
        });
    }

    if (!TrangThaiPhong) {
        return res.status(400).json({
            success: false,
            error: 'Trạng thái phòng là bắt buộc'
        });
    }

    const validStatuses = ['Sẵn sàng', 'Đang ở', 'Bảo trì', 'Dọn dẹp'];
    if (!validStatuses.includes(TrangThaiPhong)) {
        return res.status(400).json({
            success: false,
            error: 'Trạng thái phòng không hợp lệ'
        });
    }

    try {
        const pool = await poolPromise;

        // Kiểm tra phòng có tồn tại không
        const check = await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .query('SELECT * FROM Phong WHERE MaPhong = @MaPhong AND IsActive = 1');

        if (check.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy phòng'
            });
        }

        await pool.request()
            .input('MaPhong', sql.Int, MaPhong)
            .input('TrangThaiPhong', sql.NVarChar, TrangThaiPhong)
            .query('UPDATE Phong SET TrangThaiPhong = @TrangThaiPhong WHERE MaPhong = @MaPhong');

        res.json({
            success: true,
            message: 'Cập nhật trạng thái phòng thành công',
            data: {
                MaPhong: parseInt(MaPhong),
                TrangThaiPhong
            }
        });
    } catch (err) {
        console.error('Lỗi updateRoomStatus:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
};
