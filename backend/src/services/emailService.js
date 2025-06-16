// Service xử lý gửi email
const { sendBookingConfirmation } = require('../utils/emailService'); // Import hàm gửi email từ utils
const moment = require('moment'); // Thư viện xử lý thời gian

/**
 * Class EmailService - Xử lý tất cả các loại email của hệ thống
 * Bao gồm email xác nhận đặt phòng, thông báo hủy, etc.
 */
class EmailService {
    /**
     * Gửi email xác nhận đặt phòng cho khách hàng
     * @param {Object} booking - Thông tin đặt phòng cần gửi email
     * @param {string} booking.guestEmail - Email của khách hàng
     * @param {string} booking.guestName - Tên khách hàng
     * @param {string} booking.roomNumber - Số phòng đã đặt
     * @param {Date} booking.checkIn - Ngày check-in
     * @param {Date} booking.checkOut - Ngày check-out
     * @param {number} booking.totalPrice - Tổng giá tiền phải trả
     * @returns {Promise} - Promise chứa kết quả gửi email (thành công/thất bại)
     */
    static async sendBookingConfirmation(booking) {
        try {
            // Gọi hàm gửi email từ utils với thông tin booking
            const result = await sendBookingConfirmation(booking);
            return result;
        } catch (error) {
            // Throw lỗi với message rõ ràng để debug
            throw new Error(`Lỗi khi gửi email xác nhận đặt phòng: ${error.message}`);
        }
    }
}

// Export class để sử dụng ở các file khác
module.exports = EmailService; 