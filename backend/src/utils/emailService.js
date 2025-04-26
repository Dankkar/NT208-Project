const nodemailer = require('nodemailer');

exports.sendResetEmail = async (email, resetLink) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // false nếu dùng port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

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
