// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { poolPromise, sql } = require('../database/db');

const schema = 'dbo';

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
