const cron = require('node-cron');
const { poolPromise, sql } = require('../database/db');

/**
 * Xóa các booking đã hết thời gian giữ chỗ (quá 15 phút)
 */
const cleanupExpiredBookings = async () => {
    try {
        const pool = await poolPromise;
        
        // Kiểm tra xem có booking nào cần xóa không
        const checkResult = await pool.request()
            .query(`
                SELECT COUNT(*) as count
                FROM Booking
                WHERE TrangThaiBooking = N'Tạm giữ'
                AND ThoiGianGiuCho IS NOT NULL
                AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) > 15
            `);

        // Nếu không có booking nào cần xóa, thoát sớm
        if (checkResult.recordset[0].count === 0) {
            console.log(`[${new Date().toISOString()}] Không có booking nào cần xóa`);
            return;
        }

        // Nếu có booking cần xóa, thực hiện cập nhật
        const result = await pool.request()
            .query(`
                UPDATE Booking
                SET TrangThaiBooking = N'Đã hủy',
                    NgayHuy = GETDATE(),
                    LyDoHuy = N'Tự động hủy do hết thời gian giữ chỗ'
                WHERE TrangThaiBooking = N'Tạm giữ'
                AND ThoiGianGiuCho IS NOT NULL
                AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) > 15;

                SELECT @@ROWCOUNT as UpdatedCount;
            `);

        const updatedCount = result.recordset[0].UpdatedCount;
        console.log(`[${new Date().toISOString()}] Đã cập nhật ${updatedCount} booking hết hạn`);
    } catch (error) {
        console.error('Lỗi khi xóa booking hết hạn:', error);
    }
};

/**
 * Khởi tạo cron job để chạy cleanup mỗi 5 phút
 */
const initBookingCleanupJob = () => {
    // Chạy mỗi 5 phút
    cron.schedule('*/5 * * * *', async () => {
        console.log(`[${new Date().toISOString()}] Bắt đầu cleanup booking hết hạn...`);
        await cleanupExpiredBookings();
    });

    console.log('Đã khởi tạo cron job cleanup booking hết hạn');
};

module.exports = {
    initBookingCleanupJob,
    cleanupExpiredBookings
}; 