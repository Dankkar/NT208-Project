// backend/src/controllers/authController.js
// Import các thư viện cần thiết
const bcrypt = require('bcryptjs');  // Mã hóa mật khẩu
const jwt = require('jsonwebtoken'); // Tạo và xác thực JWT token
const { poolPromise, sql } = require('../database/db'); // Kết nối database
const { sendResetEmail } = require('../utils/emailService'); // Gửi email reset
const {OAuth2Client} = require('google-auth-library'); // Đăng nhập Google
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const schema = 'dbo'; // Schema database

// Lưu trữ tạm thời các token reset đã sử dụng (bảo mật)
const usedResetTokens = new Set();

// Dọn dẹp các token hết hạn mỗi giờ để tối ưu bộ nhớ
setInterval(() => {
  // Vì token có thời gian sống 15 phút, ta có thể xóa token cũ hơn 1 giờ
  // Trong môi trường production, nên sử dụng Redis thay vì memory
  console.log('Đang dọn dẹp bộ nhớ cache token reset...');
  usedResetTokens.clear();
}, 60 * 60 * 1000); // 1 giờ

// Khởi tạo session cho người dùng khách
exports.initializeGuestSession = (req, res) => {
    // Kiểm tra xem người dùng đã xác thực chưa
    if (req.session && req.session.user) {
        return res.status(200).json({ 
            success: true,
            message: 'Session người dùng đã tồn tại',
            sessionId: req.session.id,
            authenticated: true
        });
    }

    // Đánh dấu là session khách mà không tạo lại session
    req.session.isGuest = true;
    
    res.status(200).json({ 
        success: true,
        message: 'Session khách đã được khởi tạo',
        sessionId: req.session.id,
        authenticated: false
    });
};

// API kiểm tra email đã tồn tại trước khi đăng ký
exports.checkEmailExists = async (req, res) => {
  const { Email } = req.body;

  // Validate dữ liệu đầu vào
  if (!Email) {
    return res.status(400).json({ success: false, message: 'Email là bắt buộc.' });
  }

  try {
    const pool = await poolPromise;
    // Tìm kiếm email trong database (không phân biệt hoa thường)
    const emailExists = await pool.request()
      .input('Email', sql.NVarChar, Email.toLowerCase())
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE LOWER(Email) = LOWER(@Email)`);

    // Trả về kết quả kiểm tra
    if (emailExists.recordset.length > 0) {
      return res.status(200).json({ success: true, exists: true, message: 'Email này đã tồn tại.' });
    } else {
      return res.status(200).json({ success: true, exists: false });
    }
  } catch (err) {
    console.error('AuthController.checkEmailExists error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi kiểm tra email.' });
  }
};

// API đăng ký tài khoản mới
exports.register = async (req, res) => {
  // Lấy dữ liệu từ request body
  const { 
    HoTen,
    Email,
    MatKhau,
    SDT,
    NgaySinh,
    GioiTinh,
    CCCD
  } = req.body;

  try {
    const pool = await poolPromise;

    // Kiểm tra email đã tồn tại trong hệ thống
    const emailExists = await pool.request()
      .input('Email', sql.NVarChar, Email.toLowerCase())
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE LOWER(Email) = LOWER(@Email)`);

    if (emailExists.recordset.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    // Mã hóa mật khẩu với salt rounds = 10
    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    // Thêm người dùng mới vào database
    const insertResult = await pool.request()
      .input('LoaiUser', sql.NVarChar, 'KhachHang')
      .input('HoTen', sql.NVarChar, HoTen)
      .input('Email', sql.NVarChar, Email.toLowerCase())
      .input('SDT', sql.NVarChar, SDT)
      .input('MatKhauHash', sql.NVarChar, hashedPassword)
      .input('NgaySinh', sql.Date, NgaySinh || null)
      .input('GioiTinh', sql.NVarChar, GioiTinh || null)
      .input('CCCD', sql.NVarChar, CCCD)
      .query(`
        INSERT INTO ${schema}.NguoiDung (
          LoaiUser, HoTen, Email, SDT, MatKhauHash, 
          NgaySinh, GioiTinh, CCCD
        )
        VALUES (
          @LoaiUser, @HoTen, @Email, @SDT, @MatKhauHash,
          @NgaySinh, @GioiTinh, @CCCD
        );
        SELECT SCOPE_IDENTITY() AS MaKH;
      `);

    const MaKH = insertResult.recordset[0].MaKH;

    // Tạo JWT token cho người dùng mới
    const token = jwt.sign(
      { MaKH: MaKH, Email: Email.toLowerCase(), role: 'KhachHang' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Lưu thông tin user vào session
    req.session.user = {
      MaKH,
      Email: Email.toLowerCase(),
      role: 'KhachHang'
    };

    // Đặt cookie chứa access token
    res.cookie('access_token', token, {
      httpOnly: true, // Chỉ truy cập qua HTTP, không qua JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS trong production
      sameSite: 'strict', // Bảo mật CSRF
      maxAge: 1 * 60 * 60 * 1000 // Thời gian sống 1 giờ
    });

    return res.status(201).json({ 
      success: true,
      message: 'Đăng ký thành công',
      user: {
        MaKH,
        Email: Email.toLowerCase(),
        role: 'KhachHang'
      }
    });
  } catch (err) {
    console.error('AuthController.register error:', err);
    // Xử lý lỗi duplicate key (email/CCCD đã tồn tại)
    if (err.number === 2627) {
      return res.status(400).json({ 
        success: false,
        message: 'Thông tin đã tồn tại trong hệ thống'
      });
    }
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi server'
    });
  }
};

// API đăng nhập
exports.login = async (req, res) => {
  try {
    const { Email, MatKhau } = req.body;

    // Tìm kiếm người dùng theo email
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Email', sql.NVarChar, Email)
      .query(`SELECT MaKH, Email, MatKhauHash, LoaiUser, HoTen FROM NguoiDung WHERE Email = @Email`);

    // Kiểm tra tài khoản có tồn tại không
    if (result.recordset.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Tài khoản không tồn tại.'
      });
    }

    const user = result.recordset[0];

    // So sánh mật khẩu với hash đã lưu
    const isPasswordValid = await bcrypt.compare(MatKhau, user.MatKhauHash);

    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Mật khẩu không đúng.'
      });
    }

    // Tạo JWT token cho session
    const token = jwt.sign(
      { MaKH: user.MaKH, Email: user.Email, role: user.LoaiUser },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Lưu thông tin user vào session mà không regenerate
    req.session.user = {
      MaKH: user.MaKH,
      HoTen: user.HoTen,
      Email: user.Email,
      role: user.LoaiUser
    };

    // Đặt cookie access token
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1 * 60 * 60 * 1000,
    });

    res.status(200).json({ 
      message: 'Đăng nhập thành công',
      user: {
        MaKH: user.MaKH,
        HoTen: user.HoTen,
        Email: user.Email,
        role: user.LoaiUser
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// API quên mật khẩu
exports.forgotPassword = async (req, res) => {
  const {Email} = req.body;
  try{
    const pool = await poolPromise;

    // Kiểm tra email có tồn tại trong hệ thống không
    const userResult = await pool.request()
      .input('Email', sql.NVarChar, Email)
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE Email = @Email`);

    if(userResult.recordset.length === 0){
      return res.status(404).json({ 
        success: false,
        message: "Email không tồn tại"
      });
    }

    const MaKH = userResult.recordset[0].MaKH;

    // Tạo token reset mật khẩu có thời gian sống 15 phút
    const token = jwt.sign(
      {MaKH: MaKH}, process.env.RESET_PASSWORD_SECRET,
      {expiresIn: '15m'}
    );

    // Tạo link reset và gửi email
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendResetEmail(Email, resetLink);

    res.status(200).json({ 
      success: true,
      message: 'Đã gửi liên kết đặt lại mật khẩu vào email'
    });
  }
  catch(err){
    console.error('AuthController.forgotPassword error', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server'
    });
  }
};

// API đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  const { token, newPassword} = req.body;
  
  try{
    // Kiểm tra token đã được sử dụng chưa (tránh tấn công replay)
    if (usedResetTokens.has(token)) {
      return res.status(400).json({ 
        success: false,
        message: 'Token đã được sử dụng. Vui lòng yêu cầu reset password mới.'
      });
    }

    // Xác thực và giải mã token
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);

    const pool = await poolPromise;

    // Xác minh người dùng vẫn tồn tại
    const userResult = await pool.request()
      .input('MaKH', sql.Int, decoded.MaKH)
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE MaKH = @MaKH`);

    if(userResult.recordset.length === 0){
      return res.status(404).json({ 
        success: false,
        message: "User không tồn tại"
      });
    }

    // Mã hóa mật khẩu mới
    const hasedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới vào database
    await pool.request()
      .input('MaKH', sql.Int, decoded.MaKH)
      .input('MatKhauHash', sql.NVarChar, hasedPassword)
      .query(`UPDATE ${schema}.NguoiDung SET MatKhauHash = @MatKhauHash WHERE MaKH = @MaKH`);
    
    // Đánh dấu token đã sử dụng để ngăn tái sử dụng
    usedResetTokens.add(token);
    
    res.status(200).json({ 
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });
  }
  catch(err){
    console.error('AuthController.resetPassword error:', err);
    
    // Xử lý các loại lỗi token khác nhau
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        success: false,
        message: 'Token đã hết hạn'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    res.status(400).json({ 
      success: false,
      message: 'Token lỗi hoặc đã hết hạn'
    });
  }
}

// API đăng xuất
exports.logout = (req, res) => {
  // Hủy session
  req.session.destroy((err) => {
    if (err) {
      console.error('Lỗi khi hủy session:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi đăng xuất'
      });
    }

    // Xóa cookie access token
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ 
      success: true,
      message: 'Đăng xuất thành công'
    });
  });
};

// API xóa người dùng
exports.deleteUser = async (req, res) => {
  const { MaKH } = req.params;
  const currentUser = req.user;
  
  // Validate MaKH
  if (!MaKH || isNaN(MaKH)) {
    res.status(400).json({ message: 'MaKH không hợp lệ' });
  }
  
  // Kiểm tra quyền xóa: chỉ admin/quản lý hoặc chính user đó mới có thể xóa
  if(currentUser.role !== 'QuanLyKS' && currentUser.role !== 'Admin') {
    if(currentUser.MaKH !== MaKH) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa tài khoản của người khác' });
    }
  }
  
  // Thực hiện xóa user khỏi database
  const pool = await poolPromise;
  const result = await pool.request()
    .input('MaKH', sql.Int, MaKH)
    .query(`DELETE FROM NguoiDung WHERE MaKH = @MaKH`);
    
  res.status(200).json({ message: 'Xóa tài khoản thành công' });
}

// API đăng nhập bằng Google
exports.googleLogin = async (req, res) => {
  const { token } = req.body;
  console.log('GoogleLogin token:', token);
  
  try {
    // Xác thực Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Lấy thông tin user từ Google payload
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    
    const pool = await poolPromise;

    // Kiểm tra email đã tồn tại trong hệ thống chưa
    const userResult = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query(`SELECT MaKH, LoaiUser, HoTen FROM NguoiDung WHERE Email = @Email`);

    let MaKH, role, HoTen;

    // Nếu user chưa tồn tại, tạo tài khoản mới
    if(userResult.recordset.length === 0) {
      const insertResult = await pool.request()
        .input('LoaiUser', sql.NVarChar, 'KhachHang')
        .input('HoTen', sql.NVarChar, name)
        .input('Email', sql.NVarChar, email)
        .input('MatKhauHash', sql.NVarChar, '') // Google login không cần password
        .query(`
          INSERT INTO NguoiDung (LoaiUser, HoTen, Email, MatKhauHash)
          VALUES (@LoaiUser, @HoTen, @Email, @MatKhauHash);
          SELECT SCOPE_IDENTITY() AS MaKH;
        `);

        MaKH = insertResult.recordset[0].MaKH;
        role = 'KhachHang';
    }
    else { 
      // User đã tồn tại, lấy thông tin
      const user = userResult.recordset[0];
      HoTen = user.Hoten;
      MaKH = user.MaKH;
      role = user.LoaiUser;
    }

    // Lưu thông tin user vào session
    req.session.user = {
      MaKH,
      HoTen,
      Email: email,
      role
    };
    
    // Tạo JWT token
    const jwtToken = jwt.sign(
      {MaKH, Email: email, role},
      process.env.JWT_SECRET,
      {expiresIn: '1h'}
    );

    // Đặt cookie access token
    res.cookie('access_token', jwtToken, {
      httpOnly: true,
      secure: false, // Trong development
      sameSite: 'strict',
      maxAge: 1 * 60 * 60 * 1000,
    });
    
    console.log('GoogleLogin thành công:', email);
    res.status(200).json({ 
      success: true,
      message: 'Đăng nhập thành công'
    });
  }
  catch(err) {
    console.error('GoogleLogin error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server'
    });
  }
}

// API đổi mật khẩu
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const currentUser = req.user; // Lấy thông tin user từ middleware auth

  // Kiểm tra thông tin user có hợp lệ không
  if (!currentUser || typeof currentUser.MaKH === 'undefined') {
    console.error('Lỗi nghiêm trọng: Thông tin người dùng (MaKH) không tồn tại trong req.user.');
    return res.status(401).json({ success: false, message: 'Người dùng không được xác thực hoặc thông tin không hợp lệ.' });
  }
  console.log(`[ChangePassword] Bắt đầu đổi mật khẩu cho MaKH: ${currentUser.MaKH}`);

  try {
    const pool = await poolPromise;

    // Lấy mật khẩu hiện tại từ database
    const userResult = await pool.request()
      .input('MaKH', sql.Int, currentUser.MaKH)
      .query(`SELECT MatKhauHash FROM ${schema}.NguoiDung WHERE MaKH = @MaKH`);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    const user = userResult.recordset[0];

    // Xác thực mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, user.MatKhauHash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng"
      });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới vào database
    await pool.request()
      .input('MaKH', sql.Int, currentUser.MaKH)
      .input('MatKhauHash', sql.NVarChar, hashedPassword)
      .query(`UPDATE ${schema}.NguoiDung SET MatKhauHash = @MatKhauHash WHERE MaKH = @MaKH`);

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công"
    });
  } catch (err) {
    console.error('AuthController.changePassword error:', err);
    res.status(500).json({
      success: false,
      message: "Lỗi server"
    });
  }
};