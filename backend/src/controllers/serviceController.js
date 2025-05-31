const { poolPromise, sql } = require('../database/db');

exports.getAllServices = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const pool = await poolPromise;
        const countResult = await pool.request().query(`
            SELECT COUNT(*) as total
            FROM LoaiDichVu
        `);


        const result = await pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT * FROM LoaiDichVu
                ORDER BY MaLoaiDV DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
        `);
    res.status(200).json({
        success: true,
        data: result.recordset,
        pagination: {
            total: countResult.recordset[0].total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(countResult.recordset[0].total / parseInt(limit))
        }
    });
    } 
    catch (error) {
        console.error('Lỗi getAllServices:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.getServiceById = async (req, res) => {
    const { MaLoaiDV } = req.params; // Lấy ID từ route params

    if (!MaLoaiDV || isNaN(MaLoaiDV)) {
        return res.status(400).json({ success: false, error: 'Mã loại phòng không hợp lệ.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaLoaiDV', sql.Int, MaLoaiDV)
            .query('SELECT * FROM LoaiDichVu WHERE MaLoaiDV = @MaLoaiDV'); // Chọn tất cả các cột (*) hoặc các cột cần thiết
        
        if (result.recordset.length > 0) {
            // Trả về toàn bộ object của loại dịch vụ
            // Bao gồm MaLoaiDV, MaKS, TenLoaiDV, GiaDV, MoTaDV, IsActive
            res.json({ success: true, data: result.recordset[0] });
        } else {
            res.status(404).json({ success: false, message: `Không tìm thấy loại dịch vụ với ID ${id}.` });
        }
    } catch (err) {
        console.error(`Lỗi khi lấy chi tiết loại dịch vụ ID ${id}:`, err);
        // Trong môi trường development, bạn có thể muốn trả về chi tiết lỗi
        const errorMessage = process.env.NODE_ENV === 'development' ? err.message : 'Lỗi server khi lấy chi tiết loại dịch vụ.';
        res.status(500).json({ success: false, error: errorMessage });
    }
};

exports.getServicesByHotel = async (req, res) => {
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
                FROM LoaiDichVu ldv
                JOIN KhachSan ks ON ldv.MaKS = ks.MaKS
                WHERE ldv.MaKS = @MaKS
            `);

        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT MaLoaiDV, MaKS, TenLoaiDV, GiaDV, MoTaDV, IsActive
                FROM LoaiDichVu
                WHERE MaKS = @MaKS
                ORDER BY MaLoaiDV DESC
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
    }
    catch (err) {
        console.error('Lỗi getAmentitiesByHotel:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
}

exports.createService = async (req, res) => {
    const {
        MaKS,        // Bắt buộc
        TenLoaiDV,   // Bắt buộc
        GiaDV,       // Bắt buộc
        MoTaDV,      // Có thể là tùy chọn, tùy theo logic của bạn
    } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .input('TenLoaiDV', sql.NVarChar, TenLoaiDV)
            .input('GiaDV', sql.Decimal(18, 2), GiaDV) // Giả sử GiaDV có 2 chữ số thập phân
            .input('MoTaDV', sql.NVarChar, MoTaDV || null) // Cho phép MoTaDV là null nếu không được cung cấp
            .query(`
                INSERT INTO LoaiDichVu (MaKS, TenLoaiDV, GiaDV, MoTaDV)
                VALUES (@MaKS, @TenLoaiDV, @GiaDV, @MoTaDV);
                SELECT SCOPE_IDENTITY() AS MaLoaiDV; 
            `);
        res.status(201).json({ message: 'Dịch vụ đã được tạo thành công' });
    }
    catch (err) {
        console.error('Lỗi createRoomType:', err);
        res.status(500).json({error: 'Lỗi server'});
    }   
}

exports.updateService = async (req, res) => {
    const {  MaLoaiDV } = req.params;
    const {
        TenLoaiDV,
        GiaDV,
        MoTaDV,
        IsActive     // Bắt buộc phải có trong body nếu muốn cập nhật nó
    } = req.body;

    if(!MaLoaiDV || isNaN(MaLoaiDV)) {
        return res.status(400).json({error: 'Mã loại phòng không hợp lệ'});
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaLoaiDV', sql.Int, MaLoaiDV) // Đổi tên param để không trùng với cột MaLoaiDV (nếu có)
            .input('TenLoaiDV_Update', sql.NVarChar, TenLoaiDV)
            .input('GiaDV_Update', sql.Decimal(18, 2), GiaDV) // Giả sử GiaDV có 2 chữ số thập phân
            .input('MoTaDV_Update', sql.NVarChar, MoTaDV || null)
            .input('IsActive_Update', sql.Bit, IsActive) // Lấy từ req.body
            .query(`
                UPDATE LoaiDichVu
                SET TenLoaiDV = @TenLoaiDV_Update,
                    GiaDV = @GiaDV_Update,
                    MoTaDV = @MoTaDV_Update,
                    IsActive = @IsActive_Update
                WHERE MaLoaiDV = @MaLoaiDV;
            `);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false, // Giữ cấu trúc error này
                message: `Dịch vụ với Mã DV ${MaLoaiDV} không tồn tại hoặc không có thay đổi.`
            });
        }
        res.status(200).json({ message: 'Cập nhật dịch vụ thành công.' });
    }
    catch (err) {
        console.error('Lỗi updateRoomType:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
}

exports.deleteService = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaLoaiDV } = req.params;
        const result = await pool.request()
            .input('MaLoaiDV', sql.Int, MaLoaiDV)
            .query('DELETE FROM LoaiDichVu WHERE MaLoaiDV = @MaLoaiDV');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Xóa dịch vụ thành công'
        });
    } catch (error) {
        console.error('Lỗi deleteService:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.addServiceToBooking = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaLoaiDV, SoLuong } = req.body;
        const service = await pool.request()
            .input('MaLoaiDV', sql.Int, MaLoaiDV)
            .query('SELECT * FROM LoaiDichVu WHERE MaLoaiDV = @MaLoaiDV');

        if (service.recordset.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại'
            });
        }

        const GiaTaiThoiDiemSuDung = service.recordset[0].GiaDV;
        const result = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .input('MaLoaiDV', sql.Int, MaLoaiDV)
            .input('SoLuong', sql.Int, SoLuong)
            .input('GiaTaiThoiDiemSuDung', sql.Decimal(18, 2), GiaTaiThoiDiemSuDung)
            .query(`
                INSERT INTO SuDungDichVu (MaDat, MaLoaiDV, SoLuong, GiaTaiThoiDiemSuDung)
                VALUES (@MaDat, @MaLoaiDV, @SoLuong, @GiaTaiThoiDiemSuDung)
            `);
        
        res.status(201).json({
            success: true,
            message: 'Thêm dịch vụ vào đặt phòng thành công'
        });
    } catch (error) {
        console.error('Lỗi addServiceToBooking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.removeServiceFromBooking = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaDat, MaLoaiDV } = req.params;
        const result = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .input('MaLoaiDV', sql.Int, MaLoaiDV)
            .query(`
                DELETE FROM SuDungDichVu
                WHERE MaDat = @MaDat AND MaLoaiDV = @MaLoaiDV
            `);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy dịch vụ trong đặt phòng'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Xóa dịch vụ khỏi đặt phòng thành công'
        });
    } catch (error) {
        console.error('Lỗi removeServiceFromBooking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.getBookingServices = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaDat } = req.params;
        const result = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .query(`
                SELECT dv.*, sddv.SoLuong, sddv.GiaTaiThoiDiemSuDung, sddv.ThanhTien
                FROM SuDungDichVu sddv
                INNER JOIN LoaiDichVu dv ON sddv.MaLoaiDV = dv.MaLoaiDV
                WHERE sddv.MaDat = @MaDat
            `);
        res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi getBookingServices:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};