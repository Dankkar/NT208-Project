// Service tự động dọn dẹp booking hết hạn
const cron = require('node-cron'); // Thư viện để lập lịch cron job
const { poolPromise, sql } = require('../database/db'); // Kết nối database

/**
 * Xóa các booking đã hết thời gian giữ chỗ (quá 15 phút)
 * Hàm này sẽ tự động hủy các booking có trạng thái "Tạm giữ" 
 * mà đã quá 15 phút kể từ thời gian giữ chỗ
 */
const cleanupExpiredBookings = async () => {
    try {
        const pool = await poolPromise;
        
        // Kiểm tra xem có booking nào cần xóa không để tối ưu hiệu suất
        const checkResult = await pool.request()
            .query(`
                SELECT COUNT(*) as count
                FROM Booking
                WHERE TrangThaiBooking = N'Tạm giữ'
                AND ThoiGianGiuCho IS NOT NULL
                AND DATEDIFF(MINUTE, ThoiGianGiuCho, GETDATE()) > 15
            `);

        // Nếu không có booking nào cần xóa, thoát sớm để tiết kiệm tài nguyên
        if (checkResult.recordset[0].count === 0) {
            console.log(`[${new Date().toISOString()}] Không có booking nào cần xóa`);
            return;
        }

        // Nếu có booking cần xóa, thực hiện cập nhật trạng thái thành "Đã hủy"
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

/*
 * Khởi tạo cron job để chạy cleanup mỗi 5 phút
 * Sử dụng cron pattern '*5 * * * *' có nghĩa là:
 * - *5: Mỗi 5 phút
 * - *: Mọi giờ
 * - *: Mọi ngày trong tháng  
 * - *: Mọi tháng
 * - *: Mọi ngày trong tuần
 */
const initBookingCleanupJob = () => {
    // Chạy mỗi 5 phút để đảm bảo booking không bị giữ quá lâu
    cron.schedule('*/5 * * * *', async () => {
        console.log(`[${new Date().toISOString()}] Bắt đầu cleanup booking hết hạn...`);
        await cleanupExpiredBookings();
    });

    console.log('Đã khởi tạo cron job cleanup booking hết hạn - chạy mỗi 5 phút');
};

// Export các hàm để sử dụng ở file khác
module.exports = {
    initBookingCleanupJob,
    cleanupExpiredBookings
}; 