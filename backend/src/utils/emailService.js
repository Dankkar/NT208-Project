const nodemailer = require('nodemailer');
const moment = require('moment');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // false nếu dùng port 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

exports.sendResetEmail = async (email, resetLink) => {
    const mailOptions = {
        from: `"Hotel Booking" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Đặt lại mật khẩu Hotel Booking',
        html: `
            <h2>Yêu cầu đặt lại mật khẩu</h2>
            <p>Vui lòng click vào link dưới đây để đặt lại mật khẩu:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Link này sẽ hết hạn trong 15 phút.</p>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Đã gửi email reset password cho ${email}`);
};

exports.sendBookingConfirmation = async (booking) => {
    const mailOptions = {
        from: `"Hotel Booking" <${process.env.SMTP_USER}>`,
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
        console.log(`Đã gửi email xác nhận đặt phòng cho ${booking.guestEmail}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Lỗi khi gửi email xác nhận:', error);
        throw new Error(`Lỗi khi gửi email: ${error.message}`);
    }
};
