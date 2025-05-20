// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../database/db');
const { sendResetEmail } = require('../utils/emailService');
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const schema = 'dbo';

// API Dang ki
exports.register = async (req, res) => {
  // 1. Lấy dữ liệu từ body
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

    // Kiểm tra email đã tồn tại
    const emailExists = await pool.request()
      .input('Email', sql.NVarChar, Email.toLowerCase())
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE LOWER(Email) = LOWER(@Email)`);

    if (emailExists.recordset.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    // Kiểm tra SDT đã tồn tại
    const phoneExists = await pool.request()
      .input('SDT', sql.NVarChar, SDT)
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE SDT = @SDT`);

    if (phoneExists.recordset.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Số điện thoại đã tồn tại'
      });
    }

    // Kiểm tra CCCD đã tồn tại
    const cccdExists = await pool.request()
      .input('CCCD', sql.NVarChar, CCCD)
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE CCCD = @CCCD`);

    if (cccdExists.recordset.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'CCCD đã tồn tại'
      });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    // Thêm người dùng mới
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

    // Tạo JWT
    const token = jwt.sign(
      { MaKH, Email: Email.toLowerCase(), role: 'KhachHang' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false, // đổi thành true nếu dùng HTTPS
      sameSite: 'strict',
      maxAge: 1 * 60 * 60 * 1000 // 1 giờ
    });

    res.status(201).json({ 
      message: 'Đăng ký thành công',
      token,
      user: {
        MaKH,
        HoTen,
        Email: Email.toLowerCase(),
        SDT,
        NgaySinh,
        GioiTinh,
        role: 'KhachHang'
      }
    });
  } catch (err) {
    console.error('AuthController.register error:', err);
    if (err.number === 2627) {
      return res.status(400).json({ 
        success: false,
        message: 'Thông tin đã tồn tại trong hệ thống'
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server'
    });
  }
};

//APi Đang Nhap
exports.login = async (req, res) => {
  try {
    const { Email, MatKhau } = req.body;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('Email', sql.NVarChar, Email)
      .query(`SELECT MaKH, Email, MatKhauHash, LoaiUser FROM NguoiDung WHERE Email = @Email`);

    if (result.recordset.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Tài khoản không tồn tại.'
      });
    }

    const user = result.recordset[0];

    const isPasswordValid = await bcrypt.compare(MatKhau, user.MatKhauHash);

    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Mật khẩu không đúng.'
      });
    }

    const token = jwt.sign(
      { MaKH: user.MaKH, Email : user.Email, role: user.LoaiUser },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 1 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: 'Đăng nhập thành công' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

//API quen mat khau
exports.forgotPassword = async (req, res) => {
  const {Email} = req.body;
  try{


    const pool = await poolPromise;

    // Kiem tra email ton tai
    const userResult = await pool.request()
      .input('Email', sql.NVarChar, Email)
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE Email = @Email`);

    if(userResult.recordset.length === 0){
      return res.status(404).json({ 
        success: false,
        message: "Email khong ton tai"
      });
    }

    const MaKH = userResult.recordset[0].MaKH;

    // Tao token reset
    const token = jwt.sign(
      {MaKH}, process.env.RESET_PASSWORD_SECRET,
      {expiresIn: '15m'}
    );

    // Gui email chua link reset
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

// API Dat lai mat khau
exports.resetPassword = async (req, res) => {
  const { token, newPassword} = req.body;
  try{
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);

    const pool = await poolPromise;

    // Verify user exists
    const userResult = await pool.request()
      .input('MaKH', sql.Int, decoded.MaKH)
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE MaKH = @MaKH`);

    if(userResult.recordset.length === 0){
      return res.status(404).json({ 
        success: false,
        message: "User khong ton tai"
      });
    }

    // Ma hoa mat khau moi
    const hasedPassword = await bcrypt.hash(newPassword, 10);

    // Cap nhat mat khau
    await pool.request()
      .input('MaKH', sql.Int, decoded.MaKH)
      .input('MatKhauHash', sql.NVarChar, hasedPassword)
      .query(`UPDATE ${schema}.NguoiDung SET MatKhauHash = @MatKhauHash WHERE MaKH = @MaKH`);
    
    res.status(200).json({ 
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });
  }
  catch(err){
    console.error('AuthController.resetPassword error:', err);
    res.status(400).json({ 
      success: false,
      message: 'Token loi hoac da het han'
    });
  }
}

// Dang xuat
exports.logout = (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: false,
    sameSite: 'Strict'
  });
res.status(200).json({ message: 'Đăng xuất thành công' });
}

exports.deleteUser = async (req, res) => {
  const { MaKH } = req.params;
  const currentUser = req.user;
  if (!MaKH || isNaN(MaKH))
  {
    res.status(400).json({ message: 'MaKH khong hop le' });
  }
  if(currentUser.role !== 'QuanLyKS' && currentUser.role !== 'Admin')
  {
    if(currentUser.MaKH !== MaKH)
    {
      return res.status(403).json({ message: 'Bạn không có quyền xóa tài khoản của người khác' });
    }
  }
  const pool = await poolPromise;

  const result = await pool.request()
    .input('MaKH', sql.Int, MaKH)
    .query(`DELETE FROM NguoiDung WHERE MaKH = @MaKH`);
  res.status(200).json({ message: 'Xóa tài khoản thành công' });
}

exports.googleLogin = async (req, res) => {
  const { token } = req.body;
  console.log('GoogleLogin token:', token);
  try 
  {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    
    const pool = await poolPromise;

    //Kiem tra email da ton tai
    const userResult = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query(`SELECT MaKH, LoaiUser, HoTen FROM NguoiDung WHERE Email = @Email`);

      let MaKH, role, HoTen;

      if(userResult.recordset.length === 0)
      {
        const insertResult = await pool.request()
          .input('LoaiUser', sql.NVarChar, 'KhachHang')
          .input('HoTen', sql.NVarChar, name)
          .input('Email', sql.NVarChar, email)
          .input('MatKhauHash', sql.NVarChar, '')
          .query(`
            INSERT INTO NguoiDung (LoaiUser, HoTen, Email, MatKhauHash)
            VALUES (@LoaiUser, @HoTen, @Email, @MatKhauHash);
            SELECT SCOPE_IDENTITY() AS MaKH;
          `);

          MaKH = insertResult.recordset[0].MaKH;
          role = 'KhachHang';
      }
      else
      { 
        const user = userResult.recordset[0];
        HoTen = user.Hoten;
        MaKH = user.MaKH;
        role = user.LoaiUser;
      }

      const jwtToken = jwt.sign(
        {MaKH, Email: email, role},
        process.env.JWT_SECRET,
        {expiresIn: '1h'}
      );

      res.cookie('access_token', jwtToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 1 * 60 * 60 * 1000,
      });
    console.log('GoogleLogin success:', email);
    res.status(200).json({ 
      success: true,
      message: 'Đăng nhập thành công'
    });
  }
  catch(err)
  {
    console.error('GoogleLogin error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server'
    });
  }
}