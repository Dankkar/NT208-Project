const { poolPromise, sql } = require('../database/db');

exports.calculateTotalPrice = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaLoaiPhong, selectedServices } = req.body;

        // Lấy giá cơ sở của loại phòng
        const roomPrice = await pool.request()
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .query(`
                SELECT GiaCoSo
                FROM LoaiPhong
                WHERE MaLoaiPhong = @MaLoaiPhong
            `);

        if (roomPrice.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin giá phòng'
            });
        }

        const basePrice = roomPrice.recordset[0].GiaCoSo;
        let totalServicePrice = 0;

        // Tính tổng giá dịch vụ được chọn
        if (selectedServices && selectedServices.length > 0) {
            const servicePrices = await pool.request()
                .input('selectedServices', sql.NVarChar, JSON.stringify(selectedServices))
                .query(`
                    SELECT MaLoaiDV, Gia
                    FROM DichVu
                    WHERE MaLoaiDV IN (SELECT value FROM STRING_SPLIT(@selectedServices, ','))
                `);

            totalServicePrice = servicePrices.recordset.reduce((total, service) => {
                const selectedService = selectedServices.find(s => s.MaDV === service.MaDV);
                return total + (service.Gia * (selectedService?.SoLuong || 1));
            }, 0);
        }

        const totalPrice = basePrice + totalServicePrice;

        res.status(200).json({
            success: true,
            data: {
                basePrice,
                totalServicePrice,
                totalPrice
            }
        });
    } catch (error) {
        console.error('Lỗi calculateTotalPrice:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
}; 