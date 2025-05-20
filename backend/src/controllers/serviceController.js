const { poolPromise, sql } = require('../database/db');

exports.getAllServices = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM LoaiDichVu
        `);
    res.status(200).json({
        success: true,
        data: result.recordset
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
    try {
        const pool = await poolPromise;
        const { MaLoaiDV } = req.params;
        const result = await pool.request()
            .input('MaLoaiDV', sql.Int, MaLoaiDV)
            .query('SELECT * FROM LoaiDichVu WHERE MaLoaiDV = @MaLoaiDV');
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại'
            });
        }
        res.status(200).json(result.recordset[0]);
    }
    catch (error) {
        console.error('Lỗi getServiceById:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.getServicesByHotel = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaKS } = req.params;
        const result = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT * 
                FROM LoaiDichVu
                WHERE MaKS = @MaKS
            `);
        res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi getServicesByHotel:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.createService = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { TenLoaiDV, MoTaDV, GiaDV, MaKS } = req.body;
    const result = await pool.request()
        .input('TenLoaiDV', sql.NVarChar, TenLoaiDV)
        .input('MoTaDV', sql.NVarChar, MoTaDV)
        .input('GiaDV', sql.Decimal(18, 2), GiaDV)
        .input('MaKS', sql.Int, MaKS)
        .query(`
            INSERT INTO LoaiDichVu (TenLoaiDV, MoTaDV, GiaDV, MaKS)
            VALUES (@TenLoaiDV, @MoTaDV, @GiaDV, @MaKS);
            SELECT SCOPE_IDENTITY() AS MaLoaiDV;
        `);
        res.status(201).json({
            success: true,
            data: { MaLoaiDV: result.recordset[0].MaLoaiDV }
        });
    } catch (error) {
        console.error('Lỗi createService:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.updateService = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaLoaiDV } = req.params;
        const { TenLoaiDV, MoTaDV, GiaDV, MaKS } = req.body;
        const result = await pool.request()
            .input('MaLoaiDV', sql.Int, MaLoaiDV)
            .input('TenLoaiDV', sql.NVarChar, TenLoaiDV)
            .input('MoTaDV', sql.NVarChar, MoTaDV)
            .input('GiaDV', sql.Decimal, GiaDV)
            .input('MaKS', sql.Int, MaKS)
            .query(`
                UPDATE LoaiDichVu
                SET TenLoaiDV = @TenLoaiDV,
                    MoTaDV = @MoTaDV,
                    GiaDV = @GiaDV,
                    MaKS = @MaKS
                WHERE MaLoaiDV = @MaLoaiDV;
            `);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Cập nhật dịch vụ thành công'
        });
    } catch (error) {
        console.error('Lỗi updateService:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

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


