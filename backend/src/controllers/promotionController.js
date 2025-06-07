// src/controllers/promotionController.js
const { poolPromise, sql } = require('../database/db');

exports.getAllPromotions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            status = '', 
            timeStatus = '' 
        } = req.query;
        
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;
        
        // Build WHERE conditions
        let whereConditions = [];
        let queryParams = [];
        
        // Search filter
        if (search.trim()) {
            whereConditions.push('(TenKM LIKE @search OR MaCodeKM LIKE @search)');
            queryParams.push({ name: 'search', type: sql.NVarChar, value: `%${search.trim()}%` });
        }
        
        // Status filter
        if (status !== '') {
            whereConditions.push('IsActive = @status');
            queryParams.push({ name: 'status', type: sql.Bit, value: parseInt(status) });
        }
        
        // Time status filter
        if (timeStatus) {
            switch (timeStatus) {
                case 'current':
                    whereConditions.push('NgayBD <= GETDATE() AND NgayKT >= GETDATE()');
                    break;
                case 'upcoming':
                    whereConditions.push('NgayBD > GETDATE()');
                    break;
                case 'expired':
                    whereConditions.push('NgayKT < GETDATE()');
                    break;
            }
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        // Count total records
        let countRequest = pool.request();
        queryParams.forEach(param => {
            countRequest.input(param.name, param.type, param.value);
        });
        
        const countResult = await countRequest.query(`
            SELECT COUNT(*) as total FROM KhuyenMai ${whereClause}
        `);
        
        // Get paginated results
        let dataRequest = pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limitNum);
            
        queryParams.forEach(param => {
            dataRequest.input(param.name, param.type, param.value);
        });
        
        const result = await dataRequest.query(`
            SELECT 
                MaKM,
                MaCodeKM,
                TenKM,
                MoTaKM,
                NgayBD as NgayBatDau,
                NgayKT as NgayKetThuc,
                LoaiKM,
                GiaTriKM as PhanTramGiam,
                DieuKienApDung,
                IsActive as TrangThai
            FROM KhuyenMai 
            ${whereClause}
            ORDER BY MaKM DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `);
        
        res.status(200).json({
            success: true,
            data: result.recordset,
            pagination: {
                total: countResult.recordset[0].total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(countResult.recordset[0].total / limitNum)
            }
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
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;
        const countResult = await pool.request().query(`
            SELECT COUNT(*) as total
            FROM KhuyenMai
            WHERE NgayBD <= GETDATE() 
            AND NgayKT >= GETDATE()
            AND IsActive = 1
        `);
        const result = await pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limitNum)
            .query(`
                SELECT 
                    MaKM,
                    MaCodeKM,
                    TenKM,
                    MoTaKM,
                    NgayBD as NgayBatDau,
                    NgayKT as NgayKetThuc,
                    LoaiKM,
                    GiaTriKM as PhanTramGiam,
                    DieuKienApDung,
                    IsActive as TrangThai
                FROM KhuyenMai
                WHERE NgayBD <= GETDATE() 
                AND NgayKT >= GETDATE()
                AND IsActive = 1
                ORDER BY MaKM DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
        `);
        res.status(200).json({
            success: true,
            data: result.recordset,
            pagination: {
                total: countResult.recordset[0].total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(countResult.recordset[0].total / limitNum)
            }
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
            .query(`
                SELECT 
                    MaKM,
                    MaCodeKM,
                    TenKM,
                    MoTaKM,
                    NgayBD as NgayBatDau,
                    NgayKT as NgayKetThuc,
                    LoaiKM,
                    GiaTriKM as PhanTramGiam,
                    DieuKienApDung,
                    IsActive as TrangThai
                FROM KhuyenMai 
                WHERE MaKM = @MaKM
            `);
        
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
                SELECT 
                    MaKM,
                    MaCodeKM,
                    TenKM,
                    MoTaKM,
                    NgayBD as NgayBatDau,
                    NgayKT as NgayKetThuc,
                    LoaiKM,
                    GiaTriKM as PhanTramGiam,
                    DieuKienApDung,
                    IsActive as TrangThai
                FROM KhuyenMai
                WHERE MaCodeKM = @MaCodeKM
                AND NgayBD <= GETDATE()
                AND NgayKT >= GETDATE()
                AND IsActive = 1
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
        const { TenKM, MoTa, MaCodeKM, PhanTramGiam, NgayBatDau, NgayKetThuc, TrangThai = true } = req.body;
        
        const result = await pool.request()
            .input('TenKM', sql.NVarChar, TenKM)
            .input('MoTaKM', sql.NVarChar, MoTa)
            .input('MaCodeKM', sql.NVarChar, MaCodeKM)
            .input('GiaTriKM', sql.Decimal, PhanTramGiam)
            .input('NgayBD', sql.DateTime, NgayBatDau)
            .input('NgayKT', sql.DateTime, NgayKetThuc)
            .input('IsActive', sql.Bit, TrangThai)
            .input('LoaiKM', sql.NVarChar, 'Giảm %')
            .query(`
                INSERT INTO KhuyenMai (TenKM, MoTaKM, MaCodeKM, GiaTriKM, NgayBD, NgayKT, IsActive, LoaiKM)
                VALUES (@TenKM, @MoTaKM, @MaCodeKM, @GiaTriKM, @NgayBD, @NgayKT, @IsActive, @LoaiKM);
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
            .input('MoTaKM', sql.NVarChar, MoTa)
            .input('MaCodeKM', sql.NVarChar, MaCodeKM)
            .input('GiaTriKM', sql.Decimal, PhanTramGiam)
            .input('NgayBD', sql.DateTime, NgayBatDau)
            .input('NgayKT', sql.DateTime, NgayKetThuc)
            .input('IsActive', sql.Bit, TrangThai)
            .query(`
                UPDATE KhuyenMai
                SET TenKM = @TenKM,
                    MoTaKM = @MoTaKM,
                    MaCodeKM = @MaCodeKM,
                    GiaTriKM = @GiaTriKM,
                    NgayBD = @NgayBD,
                    NgayKT = @NgayKT,
                    IsActive = @IsActive
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
                AND NgayBD <= GETDATE()
                AND NgayKT >= GETDATE()
                AND IsActive = 1
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
