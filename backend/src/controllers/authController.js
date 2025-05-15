// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../database/db');
const { sendResetEmail } = require('../utils/emailService');

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
      return res.status(400).json({ msg: 'Email đã tồn tại' });
    }

    // Kiểm tra SDT đã tồn tại
    const phoneExists = await pool.request()
      .input('SDT', sql.NVarChar, SDT)
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE SDT = @SDT`);

    if (phoneExists.recordset.length > 0) {
      return res.status(400).json({ msg: 'Số điện thoại đã tồn tại' });
    }

    // Kiểm tra CCCD đã tồn tại
    const cccdExists = await pool.request()
      .input('CCCD', sql.NVarChar, CCCD)
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE CCCD = @CCCD`);

    if (cccdExists.recordset.length > 0) {
      return res.status(400).json({ msg: 'CCCD đã tồn tại' });
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
      { MaKH, Email: Email.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      message: 'Đăng ký thành công',
      token,
      user: {
        MaKH,
        HoTen,
        Email: Email.toLowerCase(),
        SDT,
        NgaySinh,
        GioiTinh
      }
    });
  } catch (err) {
    console.error('AuthController.register error:', err);
    if (err.number === 2627) {
      return res.status(400).json({ msg: 'Thông tin đã tồn tại trong hệ thống' });
    }
    res.status(500).json({ msg: 'Lỗi server' });
  }
};

//APi Đang Nhap
exports.login = async (req, res) => {
  try {
    const { Email, MatKhau } = req.body;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('Email', sql.NVarChar, Email)
      .query(`SELECT MaKH, Email, MatKhauHash FROM dbo.NguoiDung WHERE Email = @Email`);

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'Tài khoản không tồn tại.' });
    }

    const user = result.recordset[0];

    const isPasswordValid = await bcrypt.compare(MatKhau, user.MatKhauHash);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mật khẩu không đúng.' });
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
      return res.status(404).json({ msg: "Email khong ton tai"});
    }

    const MaKH = userResult.recordset[0].MaKH;

    // Tao token reset
    const token = jwt.sign(
      {MaKH}, process.env.RESET_PASSWORD_SECRET,
      {expiresIn: '15m'}
    );

    const expireDate = new Date(Date.now() + 15 * 60 * 1000);

    // Luu token va thoi gian het han vao DB
    await pool.request()
      .input('MaKH', sql.Int, MaKH)
      .input('ResetToken', sql.NVarChar, token)
      .input('ResetTokenExpire', sql.DateTime, expireDate)
      .query(`UPDATE ${schema}.NguoiDung SET ResetToken = @ResetToken, ResetTokenExpire = @ResetTokenExpire WHERE MaKH = @MaKH`);


    // Gui email chua link reset
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendResetEmail(Email, resetLink);

    res.json({ msg: 'Da gui link dat lai mat khau vao email'});
  }
  catch(err){
    console.error('AuthController.forgotPassword error', err);
    res.status(500).json({ msg: 'Loi server'});
  }
};

// API Dat lai mat khau
exports.resetPassword = async (req, res) => {
  const { token, newPassword} = req.body;
  try{
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);

    const pool = await poolPromise;

    const userResult = await pool.request()
      .input('MaKH', sql.Int, decoded.MaKH)
      .query(`SELECT ResetToken, ResetTokenExpire FROM ${schema}.NguoiDung WHERE MaKH = @MaKH`);

    if(userResult.recordset.length === 0){
      return res.status(404).json({ msg: "User khong ton tai"});
    }

    const { ResetToken, ResetTokenExpire } = userResult.recordset[0];

    if(ResetToken !== token || new Date(ResetTokenExpire) < new Date()){
      return res.status(400).json({ msg: "Token khong hop le hoac da het han"});
    }

    // Ma hoa mat khau moi
    const hasedPassword = await bcrypt.hash(newPassword, 10);

    // Cap nhat mat khau va xoa reset token
    await pool.request()
      .input('MaKH', sql.Int, decoded.MaKH)
      .input('MatKhauHash', sql.NVarChar, hasedPassword)
      .query(`UPDATE ${schema}.NguoiDung SET MatKhauHash = @MatKhauHash, ResetToken = NULL, ResetTokenExpire = NULL WHERE MaKH = @MaKH`);
    
    res.json({ msg: 'Dat lai mat khau thanh cong'});
  }
  catch(err){
    console.error('AuthController.resetPassword error:', err);
    res.status(400).json({  msg: 'Token loi hoac da het han '});
  }
}
exports.logout = (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: false,
    sameSite: 'Strict'
  });
res.status(200).json({ message: 'Đăng xuất thành công' });
}


// Test fakeUser
const fs = require('fs').promises;
const path = require('path');
const fakeDbPath = path.join(__dirname, '../database/fakeUsers.json');

// Đọc users từ file
async function readFakeUsers() {
  const data = await fs.readFile(fakeDbPath, 'utf-8');
  return JSON.parse(data);
}

// Ghi users vào file
async function writeFakeUsers(users) {
  await fs.writeFile(fakeDbPath, JSON.stringify(users, null, 2));
}
