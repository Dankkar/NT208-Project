// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../database/db');
const { sendResetEmail } = require('../utils/emailService');

const schema = 'dbo';

// API Dang ki
exports.register = async (req, res) => {
  // 1. Lấy dữ liệu từ body
  const { HoTen, Email, MatKhau } = req.body;

  try {
    const pool = await poolPromise;

    // 2. Kiểm tra email đã tồn tại
    const exists = await pool.request()
      .input('Email', sql.NVarChar, Email)
      .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE Email = @Email`);

    if (exists.recordset.length > 0) {
      return res.status(400).json({ msg: 'Email đã tồn tại' });
    }

    // 3. Mã hóa mật khẩu
    const hash = await bcrypt.hash(MatKhau, 10);

    // 4. Thêm người dùng mới
    const insertResult = await pool.request()
      .input('LoaiUser',   sql.NVarChar, 'KhachHang')
      .input('HoTen',      sql.NVarChar, HoTen)
      .input('Email',      sql.NVarChar, Email)
      .input('MatKhauHash',sql.NVarChar, hash)
      .query(`
        INSERT INTO ${schema}.NguoiDung (LoaiUser, HoTen, Email, MatKhauHash)
        VALUES (@LoaiUser, @HoTen, @Email, @MatKhauHash);
        SELECT SCOPE_IDENTITY() AS MaKH;
      `);

    const MaKH = insertResult.recordset[0].MaKH;

    // 5. Tạo JWT
    const token = jwt.sign(
      { MaKH, Email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token });
  } catch (err) {
    console.error('AuthController.register error:', err);
    res.status(500).json({ msg: 'Lỗi server' });
  }
};

//APi Đang Nhap
exports.login = async (req, res) => {
  try {
    const { EmailIn, password } = req.body;

    const pool = await poolPromise();
    const result = await pool.request()
      .input('EmailIn', sql.NVarChar, EmailIn)
      .query(`SELECT MaKH, Email, MatKhauHash FROM dbo.NguoiDung WHERE Email = @EmailIn`);

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'Tài khoản không tồn tại.' });
    }

    const user = result.recordset[0];

    const isPasswordValid = await bcrypt.compare(password, user.MatKhauHash);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mật khẩu không đúng.' });
    }

    const token = jwt.sign(
      { MaKH: user.MaKH, Email : user.Email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });

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
      .input('ResetTokenExpire', sql.DateTime. expireDate)
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
      .query(`SELECT ResetToken, RestTokenExpire FROM ${schema}.NguoiDung WHERE MaKH = @MaKH`);

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
