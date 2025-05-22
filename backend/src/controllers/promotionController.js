// src/controllers/promotionController.js
const { poolPromise, sql } = require('../database/db');

exports.getAllPromotions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM KhuyenMai
        `);
        res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi getAllPromotions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.getActivePromotions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM KhuyenMai
            WHERE NgayBatDau <= GETDATE() 
            AND NgayKetThuc >= GETDATE()
            AND TrangThai = 1
        `);
        res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi getActivePromotions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.getPromotionDetails = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaKM } = req.params;
        const result = await pool.request()
            .input('MaKM', sql.Int, MaKM)
            .query('SELECT * FROM KhuyenMai WHERE MaKM = @MaKM');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khuyến mãi'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi getPromotionDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.validatePromotion = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaCodeKM } = req.params;
        const result = await pool.request()
            .input('MaCodeKM', sql.NVarChar, MaCodeKM)
            .query(`
                SELECT * FROM KhuyenMai
                WHERE MaCodeKM = @MaCodeKM
                AND NgayBatDau <= GETDATE()
                AND NgayKetThuc >= GETDATE()
                AND TrangThai = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi validatePromotion:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.createPromotion = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { TenKM, MoTa, MaCodeKM, PhanTramGiam, NgayBatDau, NgayKetThuc } = req.body;
        
        const result = await pool.request()
            .input('TenKM', sql.NVarChar, TenKM)
            .input('MoTa', sql.NVarChar, MoTa)
            .input('MaCodeKM', sql.NVarChar, MaCodeKM)
            .input('PhanTramGiam', sql.Decimal, PhanTramGiam)
            .input('NgayBatDau', sql.DateTime, NgayBatDau)
            .input('NgayKetThuc', sql.DateTime, NgayKetThuc)
            .query(`
                INSERT INTO KhuyenMai (TenKM, MoTa, MaCodeKM, PhanTramGiam, NgayBatDau, NgayKetThuc, TrangThai)
                VALUES (@TenKM, @MoTa, @MaCodeKM, @PhanTramGiam, @NgayBatDau, @NgayKetThuc, 1);
                SELECT SCOPE_IDENTITY() AS MaKM;
            `);

        res.status(201).json({
            success: true,
            data: { MaKM: result.recordset[0].MaKM }
        });
    } catch (error) {
        console.error('Lỗi createPromotion:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.updatePromotion = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaKM } = req.params;
        const { TenKM, MoTa, MaCodeKM, PhanTramGiam, NgayBatDau, NgayKetThuc, TrangThai } = req.body;

        const result = await pool.request()
            .input('MaKM', sql.Int, MaKM)
            .input('TenKM', sql.NVarChar, TenKM)
            .input('MoTa', sql.NVarChar, MoTa)
            .input('MaCodeKM', sql.NVarChar, MaCodeKM)
            .input('PhanTramGiam', sql.Decimal, PhanTramGiam)
            .input('NgayBatDau', sql.DateTime, NgayBatDau)
            .input('NgayKetThuc', sql.DateTime, NgayKetThuc)
            .input('TrangThai', sql.Bit, TrangThai)
            .query(`
                UPDATE KhuyenMai
                SET TenKM = @TenKM,
                    MoTa = @MoTa,
                    MaCodeKM = @MaCodeKM,
                    PhanTramGiam = @PhanTramGiam,
                    NgayBatDau = @NgayBatDau,
                    NgayKetThuc = @NgayKetThuc,
                    TrangThai = @TrangThai
                WHERE MaKM = @MaKM
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khuyến mãi'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật khuyến mãi thành công'
        });
    } catch (error) {
        console.error('Lỗi updatePromotion:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.deletePromotion = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaKM } = req.params;
        const result = await pool.request()
            .input('MaKM', sql.Int, MaKM)
            .query('DELETE FROM KhuyenMai WHERE MaKM = @MaKM');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khuyến mãi'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa khuyến mãi thành công'
        });
    } catch (error) {
        console.error('Lỗi deletePromotion:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.applyPromotionToBooking = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaDat } = req.params;
        const { MaCodeKM } = req.body;

        // Kiểm tra mã khuyến mãi
        const promotion = await pool.request()
            .input('MaCodeKM', sql.NVarChar, MaCodeKM)
            .query(`
                SELECT * FROM KhuyenMai
                WHERE MaCodeKM = @MaCodeKM
                AND NgayBatDau <= GETDATE()
                AND NgayKetThuc >= GETDATE()
                AND TrangThai = 1
            `);

        if (promotion.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn'
            });
        }

        // Cập nhật đơn đặt phòng với mã khuyến mãi
        const result = await pool.request()
            .input('MaDat', sql.Int, MaDat)
            .input('MaKM', sql.Int, promotion.recordset[0].MaKM)
            .query(`
                UPDATE DatPhong
                SET MaKM = @MaKM
                WHERE MaDat = @MaDat
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn đặt phòng'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Áp dụng khuyến mãi thành công',
            data: {
                promotion: promotion.recordset[0]
            }
        });
    } catch (error) {
        console.error('Lỗi applyPromotionToBooking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};
