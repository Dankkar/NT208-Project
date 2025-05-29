const { poolPromise, sql } = require('../database/db');
const schema = 'dbo';

//Lay thong tin user hien tai (dua vao JWT)
exports.getCurrentUser = async (req, res) => {
    try {
        const MaKH = req.user.MaKH;
        console.log('MaKH:', req.user);
        const roleFromToken = req.user.role;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKH', sql.Int, MaKH)
            .query(`SELECT MaKH, HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh, IsProfileCompleted FROM NguoiDung WHERE MaKH = @MaKH`);
        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy người dùng'
            })
        }
        const userDetailsFromDB = result.recordset[0];
        res.status(200).json({
            success: true,
            MaKH: userDetailsFromDB.MaKH,
            HoTen: userDetailsFromDB.HoTen,
            Email: userDetailsFromDB.Email,
            SDT: userDetailsFromDB.SDT,
            CCCD: userDetailsFromDB.CCCD,
            NgaySinh: userDetailsFromDB.NgaySinh,
            GioiTinh: userDetailsFromDB.GioiTinh,
            LoaiUser: roleFromToken,
            IsProfileCompleted: userDetailsFromDB.IsProfileCompleted
        }
        );
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
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const result = await pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT MaKH, HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh FROM NguoiDung
                ORDER BY MaKH
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);
        res.status(200).json({
            success: true,
            data: result.recordset,
            total: totalCount.recordset[0].total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount.recordset[0].total / limit)
        });
    } catch (error) {
        console.error('Lỗi khi lấy tất cả người dùng:', error);
        res.status(500).json({
            message: 'Lỗi server'
        });
    }
};

//Cap nhat thong tin user
exports.updateUser = async (req, res) => {
    const MaKH_from_token = req.user.MaKH;
    const { HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh } = req.body;

    try {
        const pool = await poolPromise;
        const request = pool.request().input('CurrentMaKH', sql.Int, MaKH_from_token); // Đổi tên input để rõ ràng

        // --- KIỂM TRA UNIQUE TRƯỚC KHI UPDATE ---
        if (Email !== undefined) {
            const emailExists = await pool.request()
                .input('CheckEmail', sql.NVarChar, Email)
                .input('CurrentMaKH_check', sql.Int, MaKH_from_token)
                .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE Email = @CheckEmail AND MaKH != @CurrentMaKH_check`);
            if (emailExists.recordset.length > 0) {
                return res.status(400).json({ success: false, message: 'Email này đã được sử dụng bởi tài khoản khác.' });
            }
        }
        if (SDT !== undefined && SDT !== null && SDT.trim() !== '') { // Chỉ kiểm tra nếu SDT có giá trị
            const sdtExists = await pool.request()
                .input('CheckSDT', sql.NVarChar, SDT)
                .input('CurrentMaKH_check', sql.Int, MaKH_from_token)
                .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE SDT = @CheckSDT AND MaKH != @CurrentMaKH_check`);
            if (sdtExists.recordset.length > 0) {
                return res.status(400).json({ success: false, message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác.' });
            }
        }
        if (CCCD !== undefined && CCCD !== null && CCCD.trim() !== '') { // Chỉ kiểm tra nếu CCCD có giá trị
            const cccdExists = await pool.request()
                .input('CheckCCCD', sql.NVarChar, CCCD)
                .input('CurrentMaKH_check', sql.Int, MaKH_from_token)
                .query(`SELECT MaKH FROM ${schema}.NguoiDung WHERE CCCD = @CheckCCCD AND MaKH != @CurrentMaKH_check`);
            if (cccdExists.recordset.length > 0) {
                return res.status(400).json({ success: false, message: 'CCCD này đã được sử dụng bởi tài khoản khác.' });
            }
        }
        // --- HẾT PHẦN KIỂM TRA UNIQUE ---


        let updateQueryFields = [];
        if (HoTen !== undefined) { updateQueryFields.push('HoTen = @HoTen'); request.input('HoTen', sql.NVarChar, HoTen); }
        if (Email !== undefined) { updateQueryFields.push('Email = @Email'); request.input('Email', sql.NVarChar, Email); }
        // Cho phép SDT và CCCD là NULL nếu người dùng muốn xóa
        if (req.body.hasOwnProperty('SDT')) { updateQueryFields.push('SDT = @SDT'); request.input('SDT', sql.NVarChar, SDT); }
        if (req.body.hasOwnProperty('CCCD')) { updateQueryFields.push('CCCD = @CCCD'); request.input('CCCD', sql.NVarChar, CCCD); }

        if (NgaySinh !== undefined) { updateQueryFields.push('NgaySinh = @NgaySinh'); request.input('NgaySinh', sql.Date, NgaySinh); }
        if (GioiTinh !== undefined) { updateQueryFields.push('GioiTinh = @GioiTinh'); request.input('GioiTinh', sql.NVarChar, GioiTinh); }


        const currentUserState = await pool.request()
            .input('MaKH_check_state', sql.Int, MaKH_from_token)
            .query(`SELECT HoTen, SDT, CCCD, IsProfileCompleted FROM ${schema}.NguoiDung WHERE MaKH = @MaKH_check_state`);

        let shouldSetProfileCompleted = false;
        if (currentUserState.recordset.length > 0 && currentUserState.recordset[0].IsProfileCompleted == false) {
            const updatedHoTen = req.body.hasOwnProperty('HoTen') ? HoTen : currentUserState.recordset[0].HoTen;
            const updatedSDT = req.body.hasOwnProperty('SDT') ? SDT : currentUserState.recordset[0].SDT;
            const updatedCCCD = req.body.hasOwnProperty('CCCD') ? CCCD : currentUserState.recordset[0].CCCD;

            if (updatedHoTen && updatedHoTen.trim() !== '' &&
                updatedSDT && updatedSDT.trim() !== '' &&
                updatedCCCD && updatedCCCD.trim() !== '') {
                shouldSetProfileCompleted = true;
            }
        }


        if (shouldSetProfileCompleted && !(updateQueryFields.includes('IsProfileCompleted = @IsProfileCompleted_update'))) {
            updateQueryFields.push('IsProfileCompleted = @IsProfileCompleted_update');
            request.input('IsProfileCompleted_update', sql.Bit, 1);
        }


        if (updateQueryFields.length === 0) {
            const noChangeUser = await pool.request()
                .input('MaKH_no_change', sql.Int, MaKH_from_token)
                .query(`SELECT MaKH, HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh, LoaiUser, IsProfileCompleted FROM ${schema}.NguoiDung WHERE MaKH = @MaKH_no_change`);
             if (noChangeUser.recordset.length === 0) {
                 return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
             }
            return res.status(200).json({
                success: true,
                message: 'Không có thông tin nào được thay đổi.',
                user: noChangeUser.recordset[0]
            });
        }


        let fullUpdateQuery = `UPDATE ${schema}.NguoiDung SET ${updateQueryFields.join(', ')} WHERE MaKH = @CurrentMaKH;`; // Sử dụng CurrentMaKH
        fullUpdateQuery += ` SELECT MaKH, HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh, LoaiUser, IsProfileCompleted FROM ${schema}.NguoiDung WHERE MaKH = @CurrentMaKH;`; // Sử dụng CurrentMaKH

        const result = await request.query(fullUpdateQuery);

        if (result.recordsets[0].length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng sau khi cập nhật.' });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin người dùng thành công.',
            user: result.recordsets[0][0]
        });

    } catch (error) {
        // Kiểm tra lỗi unique constraint từ DB (mặc dù đã check trước, nhưng để phòng hờ race condition)
        if (error.number === 2601 || error.number === 2627) { // Mã lỗi cho unique constraint violation trong SQL Server
             if (error.message.includes('UX_NguoiDung_SDT_NotNull') || error.message.toLowerCase().includes('sdt')) {
                return res.status(400).json({ success: false, message: 'Số điện thoại đã tồn tại.' });
            }
            if (error.message.includes('UX_NguoiDung_CCCD_NotNull') || error.message.toLowerCase().includes('cccd')) {
                return res.status(400).json({ success: false, message: 'CCCD đã tồn tại.' });
            }
            if (error.message.toLowerCase().includes('email')) { // Thường index của Email là UX_NguoiDung_Email
                return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });
            }
        }
        console.error('Lỗi khi cập nhật thông tin người dùng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông tin người dùng.'
        });
    }
};

exports.updateUserByAdmin = async (req, res) => {
    // const adminUser = req.user; // Thông tin của admin đang thực hiện (nếu cần log)
    const MaKH_to_update = req.params.MaKH; // MaKH của user cần update
    const { HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh, LoaiUser, IsProfileCompleted, IsActive } = req.body; // Lấy LoaiUser từ body

    try {
        const pool = await poolPromise;

        // --- CÓ THỂ THÊM KIỂM TRA UNIQUE Ở ĐÂY TƯƠNG TỰ NHƯ updateUser ---
        // Nếu Email, SDT, CCCD thay đổi, cần kiểm tra xem chúng có bị trùng với user khác không (ngoại trừ chính user đang được update)
        // ... (thêm logic kiểm tra unique nếu cần)

        let updateFields = [];
        const request = pool.request().input('MaKH_update', sql.Int, MaKH_to_update);

        if (req.body.hasOwnProperty('HoTen')) { updateFields.push('HoTen = @HoTen_update'); request.input('HoTen_update', sql.NVarChar, HoTen); }
        if (req.body.hasOwnProperty('Email')) { updateFields.push('Email = @Email_update'); request.input('Email_update', sql.NVarChar, Email); }
        if (req.body.hasOwnProperty('SDT')) { updateFields.push('SDT = @SDT_update'); request.input('SDT_update', sql.NVarChar, SDT); }
        if (req.body.hasOwnProperty('CCCD')) { updateFields.push('CCCD = @CCCD_update'); request.input('CCCD_update', sql.NVarChar, CCCD); }
        if (req.body.hasOwnProperty('NgaySinh')) { updateFields.push('NgaySinh = @NgaySinh_update'); request.input('NgaySinh_update', sql.Date, NgaySinh || null); }
        if (req.body.hasOwnProperty('GioiTinh')) { updateFields.push('GioiTinh = @GioiTinh_update'); request.input('GioiTinh_update', sql.NVarChar, GioiTinh || null); }
        if (req.body.hasOwnProperty('LoaiUser')) { updateFields.push('LoaiUser = @LoaiUser_update'); request.input('LoaiUser_update', sql.NVarChar, LoaiUser); } // <--- SỬA Ở ĐÂY
        if (req.body.hasOwnProperty('IsProfileCompleted')) { updateFields.push('IsProfileCompleted = @IsProfileCompleted_update'); request.input('IsProfileCompleted_update', sql.Bit, IsProfileCompleted); }
        if (req.body.hasOwnProperty('IsActive')) { updateFields.push('IsActive = @IsActive_update'); request.input('IsActive_update', sql.Bit, IsActive); }


        if (updateFields.length === 0) {
            return res.status(200).json({ success: true, message: 'Không có thông tin nào được thay đổi.' });
        }

        const query = `UPDATE ${schema}.NguoiDung SET ${updateFields.join(', ')} WHERE MaKH = @MaKH_update`;
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng để cập nhật hoặc không có gì thay đổi.' });
        }

        // Lấy lại thông tin user đã update để trả về (tùy chọn)
        const updatedUserResult = await pool.request()
            .input('MaKH_fetch', sql.Int, MaKH_to_update)
            .query(`SELECT MaKH, HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh, LoaiUser, IsProfileCompleted, IsActive FROM ${schema}.NguoiDung WHERE MaKH = @MaKH_fetch`);

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin người dùng bởi Admin thành công.',
            user: updatedUserResult.recordset[0] || null
        });
    } catch (error) {
        // Xử lý lỗi unique tương tự như updateUser
        console.error('Lỗi khi Admin cập nhật thông tin người dùng:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật người dùng.' });
    }
};

//Xoa user
// exports.deleteUser = async (req, res) => {
//     const MaKH = req.params.MaKH;
//     try {
//         const pool = await poolPromise;
//         const result = await pool.request()
//             .input('MaKH', sql.Int, MaKH)
//             .query(`
//                 DELETE FROM NguoiDung WHERE MaKH = @MaKH
//             `);
//         if (result.rowsAffected[0] === 0) {
//             return res.status(404).json({ message: 'Không tìm thấy người dùng' });
//         }
//         res.status(200).json({
//             message: 'Xóa người dùng thành công'
//         });
//     } catch (error) {
//         console.error('Lỗi khi xóa người dùng:', error);
//         res.status(500).json({
//             message: 'Lỗi server'
//         });
//     }
// };

exports.searchUser = async (req, res) => {
    try {
        const keyword = req.query.keyword;
        const pool = await  poolPromise;
        const result = await pool.request()
            .input('keyword', sql.VarChar, keyword)
            .query(`
                SELECT MaKH, HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh, LoaiUser, IsActive FROM NguoiDung
                WHERE Email COLLATE Latin1_General_CI_AI LIKE '%' + @keyword + '%'
            `);
        res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi khi tìm kiếm người dùng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });

    }
}

exports.getUserByIdForAdmin = async (req, res) => {
    try {
        const userIdToFetch = req.params.userId; // Lấy userId từ URL parameter
        if (!userIdToFetch || isNaN(parseInt(userIdToFetch))) {
            return res.status(400).json({ success: false, message: 'User ID không hợp lệ.' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaKH', sql.Int, parseInt(userIdToFetch))
            // Lấy tất cả các trường cần thiết để Admin có thể xem và sửa
            .query(`SELECT MaKH, HoTen, Email, SDT, CCCD, NgaySinh, GioiTinh, LoaiUser, IsProfileCompleted, IsActive FROM ${schema}.NguoiDung WHERE MaKH = @MaKH`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: `Không tìm thấy người dùng với ID ${userIdToFetch}.` });
        }

        // Trả về dữ liệu người dùng
        res.status(200).json({ success: true, data: result.recordset[0] });

    } catch (error) {
        console.error(`Lỗi khi Admin lấy thông tin người dùng ID ${req.params.userId}:`, error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin chi tiết người dùng.' });
    }
};