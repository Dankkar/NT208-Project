const { poolPromise, sql } = require('../database/db');


//Lay thong tin user hien tai (dua vao JWT)
exports.getCurrentUser = async (req, res) => {
    try {
        const MaKH = req.user.MaKH;
        console.log('MaKH:', req.user);
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .query(`SELECT MaKH, HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh FROM NguoiDung WHERE MaKH = @MaKH`);
        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy người dùng'
            })
        }
        res.status(200).json(result.recordset[0]);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        res.status(500).json({
            message: 'Lỗi server'
        });
    }
};

//Lay toan bo user
exports.getAllUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT MaKH, HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh FROM NguoiDung
        `);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Lỗi khi lấy tất cả người dùng:', error);
        res.status(500).json({
            message: 'Lỗi server'
        });
    }
};

//Cap nhat thong tin user
exports.updateUser = async (req, res) => {
    const MaKH = req.user.MaKH;
    const { HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .input('HoTen', sql.NVarChar, HoTen)
            .input('Email', sql.NVarChar, Email)
            .input('SDT', sql.NVarChar, SDT)
            .input('CCCD', sql.NVarChar, CCCD)
            .input('NgaySinh', sql.Date, NgaySinh)
            .input('GioiTinh', sql.NVarChar, GioiTinh)
            .query(`
                UPDATE NguoiDung
                SET HoTen = @HoTen, Email = @Email, SDT = @SDT, CCCD = @CCCD, NgaySinh = @NgaySinh, GioiTinh = @GioiTinh
                WHERE MaKH = @MaKH
            `);
        res.status(200).json({
            message: 'Cập nhật thông tin người dùng thành công'
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin người dùng:', error);
        res.status(500).json({
            message: 'Lỗi server'
        });
    }
};

exports.updateUserByAdmin = async (req, res) => {
    const user = req.user;
    const MaKH = req.params.MaKH;
    const { HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .input('HoTen', sql.NVarChar, HoTen)
            .input('Email', sql.NVarChar, Email)
            .input('SDT', sql.NVarChar, SDT)
            .input('CCCD', sql.NVarChar, CCCD)
            .input('NgaySinh', sql.Date, NgaySinh)
            .input('GioiTinh', sql.NVarChar, GioiTinh)
            .input('LoaiUser', sql.NVarChar, user.LoaiUser)
            .query(`
                UPDATE NguoiDung
                SET HoTen = @HoTen, Email = @Email, SDT = @SDT, CCCD = @CCCD, NgaySinh = @NgaySinh, GioiTinh = @GioiTinh, LoaiUser = @LoaiUser
                WHERE MaKH = @MaKH
            `);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng để cập nhật' });
        }
        res.status(200).json({
            message: 'Cập nhật thông tin người dùng thành công'
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin người dùng:', error);
        res.status(500).json({
            message: 'Lỗi server'
        });
    }
};

//Xoa user
exports.deleteUser = async (req, res) => {
    const MaKH = req.params.MaKH;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .query(`
                DELETE FROM NguoiDung WHERE MaKH = @MaKH
            `);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.status(200).json({
            message: 'Xóa người dùng thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        res.status(500).json({
            message: 'Lỗi server'
        });
    }
};
