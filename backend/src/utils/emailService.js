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
                <li>Mã đặt phòng: #${booking.bookingId}</li>
                <li>Khách sạn: ${booking.hotelName}</li>
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

exports.sendBookingNotificationToManager = async (managerInfo) => {
    const mailOptions = {
        from: `"Hotel Booking System" <${process.env.SMTP_USER}>`,
        to: managerInfo.managerEmail,
        subject: `🔔 Đơn đặt phòng mới tại ${managerInfo.hotelName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50; text-align: center;">📋 Thông báo đơn đặt phòng mới</h2>
                
                <p>Kính gửi <strong>${managerInfo.managerName}</strong>,</p>
                
                <p>Bạn có một đơn đặt phòng mới tại <strong>${managerInfo.hotelName}</strong> với thông tin chi tiết như sau:</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #495057; margin-top: 0;">Chi tiết đặt phòng:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 8px;"><strong>🆔 Mã đặt phòng:</strong> #${managerInfo.bookingId}</li>
                        <li style="margin-bottom: 8px;"><strong>👤 Tên khách hàng:</strong> ${managerInfo.guestName}</li>
                        <li style="margin-bottom: 8px;"><strong>🏨 Khách sạn:</strong> ${managerInfo.hotelName}</li>
                        <li style="margin-bottom: 8px;"><strong>🚪 Số phòng:</strong> ${managerInfo.roomNumber}</li>
                        <li style="margin-bottom: 8px;"><strong>📅 Check-in:</strong> ${moment(managerInfo.checkIn).format('DD/MM/YYYY')}</li>
                        <li style="margin-bottom: 8px;"><strong>📅 Check-out:</strong> ${moment(managerInfo.checkOut).format('DD/MM/YYYY')}</li>
                        <li style="margin-bottom: 8px;"><strong>💰 Tổng tiền:</strong> <span style="color: #28a745; font-weight: bold;">${managerInfo.totalPrice.toLocaleString('vi-VN')} VNĐ</span></li>
                    </ul>
                </div>
                
                <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
                    <p style="margin: 0;"><strong>📌 Lưu ý quan trọng:</strong></p>
                    <p style="margin: 5px 0 0 0;">Vui lòng truy cập hệ thống quản lý để xem chi tiết đơn đặt phòng và chuẩn bị phòng cho khách hàng.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        🔍 Xem chi tiết đơn đặt phòng
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #6c757d; font-size: 14px; text-align: center;">
                    Email này được gửi tự động từ <strong>Hotel Booking System</strong><br>
                    Thời gian: ${moment().format('DD/MM/YYYY HH:mm:ss')}
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Đã gửi email thông báo booking mới cho quản lý ${managerInfo.managerName} (${managerInfo.managerEmail})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Lỗi khi gửi email thông báo cho quản lý:', error);
        throw new Error(`Lỗi khi gửi email thông báo: ${error.message}`);
    }
};

exports.sendNewBookingToManager = async (managerEmail, hotelName, maDat) => {
    const mailOptions = {
        from: `"Hotel Booking" <${process.env.SMTP_USER}>`,
        to: managerEmail,
        subject: `Đơn đặt phòng mới tại ${hotelName}`,
        html: `
            <h2>Thông báo đơn đặt phòng mới</h2>
            <p>Khách vừa hoàn tất thanh toán và đặt phòng tại <strong>${hotelName}</strong>.</p>
            <p>Mã đơn đặt phòng: <strong>#${maDat}</strong></p>
            <p>Vui lòng truy cập dashboard để xác nhận và chuẩn bị phòng.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Đã gửi thông báo cho quản lý khách sạn: ${managerEmail}`);
    } catch (error) {
        console.error('Lỗi khi gửi email cho quản lý:', error);
    }
};