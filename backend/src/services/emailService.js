const transporter = require('../config/emailConfig');
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
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: booking.guestEmail,
            subject: 'Xác nhận đặt phòng thành công',
            html: `
                <h1>Xác nhận đặt phòng thành công</h1>
                <p>Kính gửi ${booking.guestName},</p>
                <p>Chúng tôi xin xác nhận đặt phòng của bạn đã được thực hiện thành công với thông tin sau:</p>
                <ul>
                    <li>Số phòng: ${booking.roomNumber}</li>
                    <li>Ngày check-in: ${moment(booking.checkIn).format('DD/MM/YYYY')}</li>
                    <li>Ngày check-out: ${moment(booking.checkOut).format('DD/MM/YYYY')}</li>
                    <li>Tổng giá tiền: ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ</li>
                </ul>
                <p>Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi!</p>
                <p>Trân trọng,</p>
                <p>Hotel Booking System</p>
            `
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            throw new Error(`Lỗi khi gửi email: ${error.message}`);
        }
    }
}

module.exports = EmailService; 