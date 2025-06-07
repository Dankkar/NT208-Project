const { poolPromise, sql } = require('../database/db');

// Lấy tất cả cấu hình giường
exports.getAllBedConfigs = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT 
                        MaCauHinhGiuong,
                        TenCauHinh,
                        SoGiuongDoi,
                        SoGiuongDon
                    FROM CauHinhGiuong
                    ORDER BY SoGiuongDoi DESC, SoGiuongDon DESC`);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Lỗi getAllBedConfigs:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
};

// Lấy cấu hình giường theo ID
exports.getBedConfigById = async (req, res) => {
    const { MaCauHinhGiuong } = req.params;

    if (!MaCauHinhGiuong || isNaN(MaCauHinhGiuong)) {
        return res.status(400).json({
            success: false,
            error: 'Mã cấu hình giường không hợp lệ'
        });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaCauHinhGiuong', sql.Int, MaCauHinhGiuong)
            .query(`SELECT 
                        MaCauHinhGiuong,
                        TenCauHinh,
                        SoGiuongDoi,
                        SoGiuongDon
                    FROM CauHinhGiuong
                    WHERE MaCauHinhGiuong = @MaCauHinhGiuong`);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy cấu hình giường'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('Lỗi getBedConfigById:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
}; 