const cron = require('node-cron');
const { poolPromise, sql } = require('../database/db');

/**
 * Xóa các booking đã hết thời gian giữ chỗ (quá 15 phút)
 */
const cleanupExpiredBookings = async () => {
    try {
        const pool = await poolPromise;
        
        // Xóa các booking có trạng thái "Tạm giữ" và đã quá 15 phút
        const result = await pool.request()
            .query(`
                UPDATE Booking
                SET TrangThaiBooking = N'Đã hủy',
                    NgayHuy = GETDATE(),
                    LyDoHuy = N'Tự động hủy do hết thời gian giữ chỗ'
                WHERE TrangThaiBooking = N'Tạm giữ'
                AND ThoiGianGiuCho IS NOT NULL
                AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) > 15;

                SELECT @@ROWCOUNT as DeletedCount;
            `);

        const deletedCount = result.recordset[0].DeletedCount;
        console.log(`[${new Date().toISOString()}] Đã xóa ${deletedCount} booking hết hạn`);
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