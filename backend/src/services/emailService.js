const { sendBookingConfirmation } = require('../utils/emailService');
const moment = require('moment');

class EmailService {
    /**
     * Gửi email xác nhận đặt phòng
     * @param {Object} booking - Thông tin đặt phòng
     * @param {string} booking.guestEmail - Email của khách hàng
     * @param {string} booking.guestName - Tên khách hàng
     * @param {string} booking.roomNumber - Số phòng
     * @param {Date} booking.checkIn - Ngày check-in
     * @param {Date} booking.checkOut - Ngày check-out
     * @param {number} booking.totalPrice - Tổng giá tiền
     * @returns {Promise} - Promise chứa kết quả gửi email
     */
    static async sendBookingConfirmation(booking) {
        try {
            const result = await sendBookingConfirmation(booking);
            return result;
        } catch (error) {
            throw new Error(`Lỗi khi gửi email: ${error.message}`);
        }
    }
}

module.exports = EmailService; 