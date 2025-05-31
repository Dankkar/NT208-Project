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
        from: `"Hotel Booking System" <${process.env.SMTP_USER}>`,
        to: booking.guestEmail,
        subject: '✅ Xác nhận đặt phòng thành công - Hotel Booking System',
        html: `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Xác nhận đặt phòng</title>
                <!--[if mso]>
                <noscript>
                    <xml>
                        <o:OfficeDocumentSettings>
                            <o:PixelsPerInch>96</o:PixelsPerInch>
                        </o:OfficeDocumentSettings>
                    </xml>
                </noscript>
                <![endif]-->
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f8f9fa;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <!-- Main container -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                
                                <!-- Header with gradient background -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                        <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                            <span style="font-size: 36px;">🏨</span>
                                        </div>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                            Đặt phòng thành công!
                                        </h1>
                                        <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                                            Cảm ơn bạn đã tin tưởng lựa chọn dịch vụ của chúng tôi
                                        </p>
                                    </td>
                                </tr>

                                <!-- Success badge -->
                                <tr>
                                    <td style="padding: 0 30px; position: relative;">
                                        <div style="background-color: #10b981; color: white; padding: 12px 24px; border-radius: 25px; text-align: center; font-weight: 600; margin: -20px auto 30px; width: fit-content; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                                            ✅ Đặt phòng đã được xác nhận
                                        </div>
                                    </td>
                                </tr>

                                <!-- Guest greeting -->
                                <tr>
                                    <td style="padding: 0 30px 25px;">
                                        <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 24px; font-weight: 600;">
                                            Xin chào ${booking.guestName}! 👋
                                        </h2>
                                        <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                                            Chúng tôi rất vui mừng được phục vụ bạn. Dưới đây là thông tin chi tiết về đơn đặt phòng của bạn:
                                        </p>
                                    </td>
                                </tr>

                                <!-- Booking details card -->
                                <tr>
                                    <td style="padding: 0 30px 30px;">
                                        <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 25px; border-left: 5px solid #667eea;">
                                            <h3 style="margin: 0 0 20px; color: #1e293b; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
                                                📋 Thông tin đặt phòng
                                            </h3>
                                            
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                        <strong style="color: #374151; font-weight: 600;">🆔 Mã đặt phòng:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                                        <span style="background-color: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 14px;">
                                                            #${booking.bookingId}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                        <strong style="color: #374151; font-weight: 600;">🏨 Khách sạn:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #1f2937; font-weight: 500;">
                                                        ${booking.hotelName}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                        <strong style="color: #374151; font-weight: 600;">🚪 Số phòng:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #1f2937; font-weight: 500;">
                                                        ${booking.roomNumber}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                        <strong style="color: #374151; font-weight: 600;">📅 Ngày nhận phòng:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #1f2937; font-weight: 500;">
                                                        ${moment(booking.checkIn).format('dddd, DD/MM/YYYY')}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                        <strong style="color: #374151; font-weight: 600;">📅 Ngày trả phòng:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #1f2937; font-weight: 500;">
                                                        ${moment(booking.checkOut).format('dddd, DD/MM/YYYY')}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 15px 0 0;">
                                                        <strong style="color: #374151; font-weight: 600; font-size: 18px;">💰 Tổng thanh toán:</strong>
                                                    </td>
                                                    <td style="padding: 15px 0 0; text-align: right;">
                                                        <span style="color: #059669; font-size: 24px; font-weight: 700;">
                                                            ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ
                                                        </span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Check-in instructions -->
                                <tr>
                                    <td style="padding: 0 30px 30px;">
                                        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px;">
                                            <h3 style="margin: 0 0 15px; color: #92400e; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
                                                ⏰ Hướng dẫn nhận phòng
                                            </h3>
                                            <ul style="margin: 0; padding-left: 20px; color: #92400e; line-height: 1.6;">
                                                <li style="margin-bottom: 8px;">Thời gian nhận phòng: <strong>14:00 - 23:00</strong></li>
                                                <li style="margin-bottom: 8px;">Thời gian trả phòng: <strong>06:00 - 12:00</strong></li>
                                                <li style="margin-bottom: 8px;">Vui lòng mang theo <strong>CCCD/Passport</strong> khi nhận phòng</li>
                                                <li>Xuất trình <strong>mã đặt phòng #${booking.bookingId}</strong> tại quầy lễ tân</li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Action buttons -->
                                <tr>
                                    <td style="padding: 0 30px 40px; text-align: center;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 10px;">
                                                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                                                        📱 Quản lý đặt phòng
                                                    </a>
                                                </td>
                                                <td style="padding: 0 10px;">
                                                    <a href="#" style="display: inline-block; background-color: transparent; color: #667eea; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #667eea;">
                                                        🗺️ Xem bản đồ
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Contact support -->
                                <tr>
                                    <td style="padding: 0 30px 30px;">
                                        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center;">
                                            <h3 style="margin: 0 0 10px; color: #475569; font-size: 18px; font-weight: 600;">
                                                💬 Cần hỗ trợ?
                                            </h3>
                                            <p style="margin: 0 0 15px; color: #64748b; line-height: 1.6;">
                                                Đội ngũ chăm sóc khách hàng của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
                                            </p>
                                            <div style="display: flex; justify-content: center; gap: 20px;">
                                                <a href="tel:+84123456789" style="color: #667eea; text-decoration: none; font-weight: 600;">
                                                    📞 0123 456 789
                                                </a>
                                                <a href="mailto:support@hotelbooking.com" style="color: #667eea; text-decoration: none; font-weight: 600;">
                                                    ✉️ support@hotelbooking.com
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #1f2937; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="text-align: center;">
                                                    <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 20px; font-weight: 600;">
                                                        Hotel Booking System
                                                    </h3>
                                                    <p style="margin: 0 0 20px; color: #9ca3af; line-height: 1.6;">
                                                        Hệ thống đặt phòng khách sạn hàng đầu Việt Nam<br>
                                                        Cam kết mang đến trải nghiệm tuyệt vời nhất cho khách hàng
                                                    </p>
                                                    
                                                    <!-- Social links -->
                                                    <div style="margin-bottom: 20px;">
                                                        <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 24px;">📘</a>
                                                        <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 24px;">📷</a>
                                                        <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 24px;">🐦</a>
                                                    </div>
                                                    
                                                    <div style="border-top: 1px solid #374151; padding-top: 20px; margin-top: 20px;">
                                                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                                            © ${new Date().getFullYear()} Hotel Booking System. Tất cả quyền được bảo lưu.<br>
                                                            <span style="color: #9ca3af;">Thời gian gửi: ${moment().format('DD/MM/YYYY HH:mm:ss')}</span>
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Responsive note -->
                            <div style="max-width: 600px; margin: 20px auto 0; text-align: center;">
                                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                    Email này được tối ưu hóa cho tất cả thiết bị. Nếu bạn gặp vấn đề hiển thị, vui lòng liên hệ hỗ trợ.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
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
        subject: `🔔 Đơn đặt phòng mới tại ${managerInfo.hotelName} - Hotel Booking System`,
        html: `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thông báo đặt phòng mới</title>
                <!--[if mso]>
                <noscript>
                    <xml>
                        <o:OfficeDocumentSettings>
                            <o:PixelsPerInch>96</o:PixelsPerInch>
                        </o:OfficeDocumentSettings>
                    </xml>
                </noscript>
                <![endif]-->
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f8f9fa;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <!-- Main container -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                
                                <!-- Header with orange gradient -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                                        <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                            <span style="font-size: 36px;">🔔</span>
                                        </div>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                            Đơn đặt phòng mới!
                                        </h1>
                                        <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                                            Bạn có một đặt phòng mới cần xử lý
                                        </p>
                                    </td>
                                </tr>

                                <!-- New booking badge -->
                                <tr>
                                    <td style="padding: 0 30px; position: relative;">
                                        <div style="background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 25px; text-align: center; font-weight: 600; margin: -20px auto 30px; width: fit-content; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                                            🆕 Đặt phòng mới
                                        </div>
                                    </td>
                                </tr>

                                <!-- Manager greeting -->
                                <tr>
                                    <td style="padding: 0 30px 25px;">
                                        <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 24px; font-weight: 600;">
                                            Xin chào ${managerInfo.managerName}! 👋
                                        </h2>
                                        <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                                            Bạn có một đơn đặt phòng mới tại <strong style="color: #f59e0b;">${managerInfo.hotelName}</strong>. Vui lòng kiểm tra và chuẩn bị phòng cho khách hàng.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Booking details card -->
                                <tr>
                                    <td style="padding: 0 30px 30px;">
                                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; border-left: 5px solid #f59e0b;">
                                            <h3 style="margin: 0 0 20px; color: #92400e; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
                                                📋 Chi tiết đặt phòng
                                            </h3>
                                            
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d;">
                                                        <strong style="color: #92400e; font-weight: 600;">🆔 Mã đặt phòng:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d; text-align: right;">
                                                        <span style="background-color: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 14px;">
                                                            #${managerInfo.bookingId}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d;">
                                                        <strong style="color: #92400e; font-weight: 600;">👤 Tên khách hàng:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d; text-align: right; color: #92400e; font-weight: 500;">
                                                        ${managerInfo.guestName}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d;">
                                                        <strong style="color: #92400e; font-weight: 600;">🏨 Khách sạn:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d; text-align: right; color: #92400e; font-weight: 500;">
                                                        ${managerInfo.hotelName}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d;">
                                                        <strong style="color: #92400e; font-weight: 600;">🚪 Số phòng:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d; text-align: right; color: #92400e; font-weight: 500;">
                                                        ${managerInfo.roomNumber}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d;">
                                                        <strong style="color: #92400e; font-weight: 600;">📅 Check-in:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d; text-align: right; color: #92400e; font-weight: 500;">
                                                        ${moment(managerInfo.checkIn).format('dddd, DD/MM/YYYY')}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d;">
                                                        <strong style="color: #92400e; font-weight: 600;">📅 Check-out:</strong>
                                                    </td>
                                                    <td style="padding: 12px 0; border-bottom: 1px solid #fcd34d; text-align: right; color: #92400e; font-weight: 500;">
                                                        ${moment(managerInfo.checkOut).format('dddd, DD/MM/YYYY')}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 15px 0 0;">
                                                        <strong style="color: #92400e; font-weight: 600; font-size: 18px;">💰 Tổng doanh thu:</strong>
                                                    </td>
                                                    <td style="padding: 15px 0 0; text-align: right;">
                                                        <span style="color: #059669; font-size: 24px; font-weight: 700;">
                                                            ${managerInfo.totalPrice.toLocaleString('vi-VN')} VNĐ
                                                        </span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Action required -->
                                <tr>
                                    <td style="padding: 0 30px 30px;">
                                        <div style="background-color: #fee2e2; border: 1px solid #dc2626; border-radius: 12px; padding: 20px;">
                                            <h3 style="margin: 0 0 15px; color: #991b1b; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
                                                📌 Cần thực hiện
                                            </h3>
                                            <ul style="margin: 0; padding-left: 20px; color: #991b1b; line-height: 1.6;">
                                                <li style="margin-bottom: 8px;">Xác nhận tình trạng phòng <strong>${managerInfo.roomNumber}</strong></li>
                                                <li style="margin-bottom: 8px;">Chuẩn bị phòng theo yêu cầu khách hàng</li>
                                                <li style="margin-bottom: 8px;">Kiểm tra thiết bị và tiện nghi trong phòng</li>
                                                <li>Sẵn sàng đón khách vào <strong>${moment(managerInfo.checkIn).format('DD/MM/YYYY')}</strong></li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Action buttons -->
                                <tr>
                                    <td style="padding: 0 30px 40px; text-align: center;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 10px;">
                                                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4); transition: all 0.3s ease;">
                                                        🏢 Quản lý khách sạn
                                                    </a>
                                                </td>
                                                <td style="padding: 0 10px;">
                                                    <a href="#" style="display: inline-block; background-color: transparent; color: #f59e0b; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #f59e0b;">
                                                        📊 Xem báo cáo
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Contact support -->
                                <tr>
                                    <td style="padding: 0 30px 30px;">
                                        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center;">
                                            <h3 style="margin: 0 0 10px; color: #475569; font-size: 18px; font-weight: 600;">
                                                💬 Hỗ trợ kỹ thuật
                                            </h3>
                                            <p style="margin: 0 0 15px; color: #64748b; line-height: 1.6;">
                                                Gặp vấn đề kỹ thuật? Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn 24/7
                                            </p>
                                            <div style="display: flex; justify-content: center; gap: 20px;">
                                                <a href="tel:+84123456789" style="color: #f59e0b; text-decoration: none; font-weight: 600;">
                                                    📞 0123 456 789
                                                </a>
                                                <a href="mailto:manager@hotelbooking.com" style="color: #f59e0b; text-decoration: none; font-weight: 600;">
                                                    ✉️ manager@hotelbooking.com
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #1f2937; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="text-align: center;">
                                                    <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 20px; font-weight: 600;">
                                                        Hotel Booking System
                                                    </h3>
                                                    <p style="margin: 0 0 20px; color: #9ca3af; line-height: 1.6;">
                                                        Hệ thống quản lý khách sạn chuyên nghiệp<br>
                                                        Hỗ trợ đối tác quản lý hiệu quả và tăng doanh thu
                                                    </p>
                                                    
                                                    <!-- Manager resources -->
                                                    <div style="margin-bottom: 20px;">
                                                        <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 24px;">📱</a>
                                                        <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 24px;">💻</a>
                                                        <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 24px;">📊</a>
                                                    </div>
                                                    
                                                    <div style="border-top: 1px solid #374151; padding-top: 20px; margin-top: 20px;">
                                                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                                            © ${new Date().getFullYear()} Hotel Booking System. Tất cả quyền được bảo lưu.<br>
                                                            <span style="color: #9ca3af;">Thời gian gửi: ${moment().format('DD/MM/YYYY HH:mm:ss')}</span>
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Manager note -->
                            <div style="max-width: 600px; margin: 20px auto 0; text-align: center;">
                                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                    Email thông báo cho quản lý khách sạn. Vui lòng không chia sẻ thông tin này.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
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