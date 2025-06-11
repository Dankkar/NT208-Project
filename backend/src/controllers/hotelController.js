const {poolPromise, sql} = require('../database/db');

/**
 * Tạo khách sạn mới với hình ảnh
 * @param {Object} req - Request object
 * @param {Object} req.body - Thông tin khách sạn
 * @param {string} req.body.TenKS - Tên khách sạn
 * @param {string} req.body.DiaChi - Địa chỉ khách sạn
 * @param {number} req.body.HangSao - Hạng sao (1.0 - 5.0)
 * @param {string} req.body.LoaiHinh - Loại hình kinh doanh
 * @param {string} req.body.MoTaCoSoVatChat - Mô tả cơ sở vật chất
 * @param {string} req.body.QuyDinh - Quy định của khách sạn
 * @param {string} req.body.MotaChung - Mô tả chung
 * @param {number} req.body.MaNguoiQuanLy - ID người quản lý (optional, default: user hiện tại)
 * @param {number} req.body.mainImageIndex - Index ảnh chính trong danh sách files
 * @param {Array} req.files - Danh sách file ảnh upload
 * @param {Object} res - Response object
 * @returns {Object} Thông tin khách sạn mới tạo với ảnh đã upload
 */
exports.createHotel = async (req, res) => {
    const {
        TenKS,                    // Tên khách sạn
        DiaChi,                   // Địa chỉ đầy đủ
        HangSao,                  // Hạng sao: 1.0 - 5.0
        LoaiHinh,                 // Loại hình: Khách sạn, Resort, Homestay...
        MoTaCoSoVatChat,          // Mô tả cơ sở vật chất
        QuyDinh,                  // Quy định của khách sạn
        MotaChung,                // Mô tả tổng quan
        MaNguoiQuanLy,            // ID người quản lý (admin có thể chỉ định)
        mainImageIndex            // Index ảnh chính trong files upload
    } = req.body;
    
    try {
        const pool = await poolPromise;
        const fs = require('fs');
        const path = require('path');
        
        // Xác định người quản lý: ưu tiên từ body, fallback user hiện tại
        let finalMaNguoiQuanLy = MaNguoiQuanLy || req.user.MaKH 
        
        // Validate quyền của người được chỉ định làm quản lý
        const managerValidation = await pool.request()
            .input('MaKH', sql.Int, finalMaNguoiQuanLy)
            .query(`
                SELECT MaKH, LoaiUser, HoTen 
                FROM NguoiDung 
                WHERE MaKH = @MaKH AND IsActive = 1
            `);

        if (managerValidation.recordset.length === 0) {
            return res.status(400).json({
                error: 'Không tìm thấy người dùng được chỉ định làm quản lý hoặc tài khoản đã bị vô hiệu hóa'
            });
        }

        const manager = managerValidation.recordset[0];
        if (manager.LoaiUser !== 'QuanLyKS' && manager.LoaiUser !== 'Admin') {
            return res.status(400).json({
                error: `Người dùng "${manager.HoTen}" không có quyền làm người quản lý khách sạn. Chỉ người dùng có role "QuanLyKS" hoặc "Admin" mới có thể được chỉ định làm người quản lý.`
            });
        }

        // Tạo khách sạn trước
        const result = await pool.request()
            .input('TenKS', sql.NVarChar, TenKS)
            .input('DiaChi', sql.NVarChar, DiaChi)
            .input('Latitude', sql.Decimal(10, 8), req.body.Latitude ? parseFloat(req.body.Latitude) : null)
            .input('Longitude', sql.Decimal(11, 8), req.body.Longitude ? parseFloat(req.body.Longitude) : null)
            .input('HangSao', sql.Decimal(2,1), parseFloat(HangSao))
            .input('LoaiHinh', sql.NVarChar, LoaiHinh)
            .input('MoTaCoSoVatChat', sql.NVarChar, MoTaCoSoVatChat)
            .input('QuyDinh', sql.NVarChar, QuyDinh)
            .input('MotaChung', sql.NVarChar, MotaChung)
            .input('MaNguoiQuanLy', sql.Int, finalMaNguoiQuanLy)
            .query(`
                INSERT INTO KhachSan (TenKS, DiaChi, Latitude, Longitude, HangSao, LoaiHinh, MoTaCoSoVatChat, QuyDinh, MotaChung, MaNguoiQuanLy)
                OUTPUT INSERTED.MaKS
                VALUES (@TenKS, @DiaChi, @Latitude, @Longitude, @HangSao, @LoaiHinh, @MoTaCoSoVatChat, @QuyDinh, @MotaChung, @MaNguoiQuanLy)
            `);
        
        const newHotelId = result.recordset[0].MaKS;
        const uploadedImages = [];

        // Xử lý upload ảnh nếu có
        if (req.files && req.files.length > 0) {
            // Tạo thư mục cho khách sạn mới
            const hotelDir = path.join(__dirname, `../../uploads/hotels/${newHotelId}`);
            if(!fs.existsSync(hotelDir)) {
                fs.mkdirSync(hotelDir, {recursive: true});
            }

            // Upload từng file từ thư mục temp
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const isMainImage = (mainImageIndex == i) || (mainImageIndex === undefined && i === 0);
                
                try {
                    // Di chuyển file từ thư mục temp vào thư mục khách sạn
                    const sourceFilePath = file.path; // Đường dẫn tạm thời
                    let targetPath = path.join(hotelDir, file.filename);
                    let relativePath = `uploads/hotels/${newHotelId}/${file.filename}`;

                    //Di chuyển file từ temp folder
                    fs.renameSync(sourceFilePath, targetPath);

                    // Lưu thông tin ảnh vào database
                    const insertResult = await pool.request()
                        .input('MaKS', sql.Int, newHotelId)
                        .input('TenFile', sql.NVarChar, file.filename)
                        .input('DuongDanAnh', sql.NVarChar, relativePath)
                        .input('LoaiAnh', sql.NVarChar, isMainImage ? 'main' : 'gallery')
                        .input('ThuTu', sql.Int, i)
                        .input('MoTa', sql.NVarChar, `Ảnh khách sạn ${TenKS}`)
                        .query(`
                            INSERT INTO AnhKhachSan (MaKS, TenFile, DuongDanAnh, LoaiAnh, ThuTu, MoTa)
                            OUTPUT INSERTED.MaAnh
                            VALUES (@MaKS, @TenFile, @DuongDanAnh, @LoaiAnh, @ThuTu, @MoTa)
                        `);

                    uploadedImages.push({
                        MaAnh: insertResult.recordset[0].MaAnh,
                        TenFile: file.filename,
                        DuongDanAnh: relativePath,
                        LoaiAnh: isMainImage ? 'main' : 'gallery',
                        IsMain: isMainImage,
                        FullPath: `${req.protocol}://${req.get('host')}/${relativePath}`
                    });

                } catch (error) {
                    console.error(`Lỗi xử lý file ${file.filename}:`, error);
                    // Nếu có lỗi, thử xóa file gốc trong temp
                    try {
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    } catch (deleteError) {
                        console.error('Lỗi xóa file temp:', deleteError);
                    }
                }
            }
            // Xóa thư mục temp sau khi upload xong
            try {
                const tempDir = path.join(__dirname, `../../uploads/temp/hotels`);
                if(fs.existsSync(tempDir)) {
                    const tempFiles = fs.readdirSync(tempDir);
                    tempFiles.forEach(file => {
                        const filePath = path.join(tempDir, file);
                        const stats = fs.statSync(filePath);
                        //Xóa file cũ hơn 1 giờ
                        if(Date.now() - stats.mtime > 1000 * 60 * 60) {
                            fs.unlinkSync(filePath);
                        }
                    });
                }
            } catch (cleanupError) {
                console.error('Lỗi xóa file temp:', cleanupError);
            }
        }

        let message = `Khách sạn đã được tạo thành công với người quản lý: ${manager.HoTen}`;
        if (uploadedImages.length > 0) {
            const mainImages = uploadedImages.filter(img => img.IsMain);
            message += `. Đã upload ${uploadedImages.length} ảnh${mainImages.length > 0 ? ' (bao gồm 1 ảnh chính)' : ''}`;
        }
        
        res.status(201).json({
            success: true,
            message: message,
            data: {
                MaKS: newHotelId,
                TenKS: TenKS,
                TenNguoiQuanLy: manager.HoTen,
                uploadedImages: uploadedImages
            }
        });
    }
    catch (err) {
        console.error('Lỗi createHotel:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};

exports.updateHotel = async (req, res) => {
    const {MaKS} = req.params;
    const {
        TenKS,
        DiaChi,
        HangSao,
        LoaiHinh,
        MoTaCoSoVatChat,
        QuyDinh,
        MotaChung,
        MaNguoiQuanLy,
        mainImageType, // 'new' hoặc 'existing'
        mainImageIndex, // Index của ảnh mới trong selectedImages (nếu mainImageType = 'new')
        mainImageId, // MaAnh của ảnh cũ (nếu mainImageType = 'existing')
        deleteImageIds, //MaAnh cua anh se xoa
        deleteAllImages //true/false
    } = req.body;

    if(!MaKS || isNaN(MaKS))
        return res.status(400).json({error: 'Mã khách sạn không hợp lệ'});

    try
    {
        const pool = await poolPromise;
        const fs = require('fs');
        const path = require('path');
        //Kiem tra khach san ton tai
        const hotelCheck = await pool.request()
            .input('MaKS', sql.Int, parseInt(MaKS))
            .query('SELECT MaKS, TenKS FROM KhachSan WHERE MaKS = @MaKS AND IsActive = 1');

        if(hotelCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy khách sạn'
            });
        }

        // Nếu có MaNguoiQuanLy, validate role của người được chỉ định
        if (
          MaNguoiQuanLy !== undefined &&
          MaNguoiQuanLy !== null &&
          MaNguoiQuanLy !== '' &&
          !isNaN(MaNguoiQuanLy)
        ) {
            const managerValidation = await pool.request()
                .input('MaKH', sql.Int, parseInt(MaNguoiQuanLy, 10))
                .query(`
                    SELECT MaKH, LoaiUser, HoTen 
                    FROM NguoiDung 
                    WHERE MaKH = @MaKH AND IsActive = 1
                `);

            if (managerValidation.recordset.length === 0) {
                return res.status(400).json({
                    error: 'Không tìm thấy người dùng với mã này hoặc tài khoản đã bị vô hiệu hóa'
                });
            }

            const manager = managerValidation.recordset[0];
            if (manager.LoaiUser !== 'QuanLyKS' && manager.LoaiUser !== 'Admin') {
                return res.status(400).json({
                    error: `Người dùng "${manager.HoTen}" không có quyền làm người quản lý khách sạn. Chỉ người dùng có role "QuanLyKS" hoặc "Admin" mới có thể được chỉ định làm người quản lý.`
                });
            }
        }

        //1. Xu ly xoa anh
        let deletedImagesCount = 0;
        let imageActions = [];

        if(deleteAllImages === 'true' || deleteAllImages === true) {
            //Xoa tat ca anh hien tai
            const currentImages = await pool.request()
                .input('MaKS', sql.Int, parseInt(MaKS))
                .query(`
                    SELECT MaAnh, TenFile, DuongDanAnh, LoaiAnh, ThuTu, MoTa
                    FROM AnhKhachSan
                    WHERE MaKS = @MaKS AND IsActive = 1
                `);
            
            for (const img of currentImages.recordset) {
                try {
                    //Xoa file vat ly
                    const filePath = path.join(__dirname, '../../', img.DuongDanAnh);
                    if(fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }

                    //Soft delete trong database
                    await pool.request()
                        .input('MaAnh', sql.Int, img.MaAnh)
                        .query(`
                            UPDATE AnhKhachSan
                            SET IsActive = 0
                            WHERE MaAnh = @MaAnh
                        `);
                    deletedImagesCount++;
                } catch (error) {
                    console.warn(`Lỗi xóa ảnh ${img.TenFile}:`, error);
                }
            }

            if (deletedImagesCount > 0) {
                imageActions.push(`Đã xóa ${deletedImagesCount} ảnh`);
            }
        } else if (deleteImageIds) {
            //Xoa cac anh cu the
            let imageIds = [];
            if (typeof deleteImageIds === 'string') {
                imageIds = deleteImageIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            } else if (Array.isArray(deleteImageIds)) {
                imageIds = deleteImageIds.map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            }

            if (imageIds.length > 0) {
                for (const imageId of imageIds) {
                    try {
                        //Lay thong tin anh
                        const imageInfo = await pool.request()
                            .input('MaAnh', sql.Int, imageId)
                            .input('MaKS', sql.Int, parseInt(MaKS))
                            .query(`
                                SELECT MaAnh, TenFile, DuongDanAnh, LoaiAnh, ThuTu, MoTa
                                FROM AnhKhachSan
                                WHERE MaAnh = @MaAnh AND MaKS = @MaKS AND IsActive = 1
                            `);

                        if (imageInfo.recordset.length > 0) {
                            const img = imageInfo.recordset[0];

                            //Xoa file vat ly
                            const filePath = path.join(__dirname, '../../', img.DuongDanAnh);
                            if(fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }

                            //Soft delete trong database
                            await pool.request()
                                .input('MaAnh', sql.Int, img.MaAnh)
                                .query(`
                                    UPDATE AnhKhachSan
                                    SET IsActive = 0
                                    WHERE MaAnh = @MaAnh
                                `);
                            deletedImagesCount++;
                        }
                    }   catch (error) {
                        console.warn(`Lỗi xóa ảnh ID ${imageId}:`, error);
                    } 
                }

                if(deletedImagesCount > 0) {
                    imageActions.push(`Đã xóa ${deletedImagesCount} ảnh được chỉ định`);
                }
            }
        }

        

        //2.Xây dựng query update động
        let updateFields = [];
        let queryParams = { MaKS: parseInt(MaKS) };

        if (TenKS !== undefined) {
            updateFields.push('TenKS = @TenKS');
            queryParams.TenKS = TenKS;
        }
        if (DiaChi !== undefined) {
            updateFields.push('DiaChi = @DiaChi');
            queryParams.DiaChi = DiaChi;
        }
        if (HangSao !== undefined) {
            updateFields.push('HangSao = @HangSao');
            queryParams.HangSao = HangSao;
        }
        if (LoaiHinh !== undefined) {
            updateFields.push('LoaiHinh = @LoaiHinh');
            queryParams.LoaiHinh = LoaiHinh;
        }
        if (MoTaCoSoVatChat !== undefined) {
            updateFields.push('MoTaCoSoVatChat = @MoTaCoSoVatChat');
            queryParams.MoTaCoSoVatChat = MoTaCoSoVatChat;
        }
        if (QuyDinh !== undefined) {
            updateFields.push('QuyDinh = @QuyDinh');
            queryParams.QuyDinh = QuyDinh;
        }
        if (MotaChung !== undefined) {
            updateFields.push('MotaChung = @MotaChung');
            queryParams.MotaChung = MotaChung;
        }
        if (MaNguoiQuanLy !== undefined) {
            updateFields.push('MaNguoiQuanLy = @MaNguoiQuanLy');
            queryParams.MaNguoiQuanLy = MaNguoiQuanLy;
        }
        if (req.body.Latitude !== undefined) {
            updateFields.push('Latitude = @Latitude');
            queryParams.Latitude = req.body.Latitude ? parseFloat(req.body.Latitude) : null;
        }
        if (req.body.Longitude !== undefined) {
            updateFields.push('Longitude = @Longitude');
            queryParams.Longitude = req.body.Longitude ? parseFloat(req.body.Longitude) : null;
        }

        if (updateFields.length > 0) {
            const query = `
                UPDATE KhachSan
                SET ${updateFields.join(', ')}
                WHERE MaKS = @MaKS
            `;

            const request = pool.request();
            Object.keys(queryParams).forEach(key => {
                if (key === 'MaKS' || key === 'MaNguoiQuanLy') {
                    request.input(key, sql.Int, queryParams[key]);
                } else if (key === 'Latitude') {
                    request.input(key, sql.Decimal(10, 8), queryParams[key]);
                } else if (key === 'Longitude') {
                    request.input(key, sql.Decimal(11, 8), queryParams[key]);
                } else if (key === 'HangSao') {
                    request.input(key, sql.Decimal(3, 1), queryParams[key]);
                } else if (key === 'MoTaCoSoVatChat' || key === 'QuyDinh' || key === 'MotaChung') {
                    request.input(key, sql.NVarChar(sql.MAX), queryParams[key]);
                } else {
                    request.input(key, sql.NVarChar, queryParams[key]);
                }
            });
            
            const result = await request.query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy khách sạn để cập nhật'
                });
            }   
        }

        //3. Xu ly upload anh neu co
        const uploadedImages = [];
        let newMainImageId = null;
        
        // Xử lý ảnh main từ ảnh cũ nếu có
        if (mainImageType === 'existing' && mainImageId) {
            const existingImageId = parseInt(mainImageId);
            if (!isNaN(existingImageId)) {
                // Kiểm tra ảnh có tồn tại và thuộc hotel này không
                const imageCheck = await pool.request()
                    .input('MaAnh', sql.Int, existingImageId)
                    .input('MaKS', sql.Int, parseInt(MaKS))
                    .query(`
                        SELECT MaAnh FROM AnhKhachSan 
                        WHERE MaAnh = @MaAnh AND MaKS = @MaKS AND IsActive = 1
                    `);
                    
                if (imageCheck.recordset.length > 0) {
                    newMainImageId = existingImageId;
                }
            }
        }
        
        if (req.files && req.files.length > 0) {
            //Tao thu muc neu chua co
            const hotelDir = path.join(__dirname, `../../uploads/hotels/${MaKS}`);
            if(!fs.existsSync(hotelDir)) {
                fs.mkdirSync(hotelDir, {recursive: true});
            }

            //Upload tung file
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                
                try {
                    //Di chuyen file vao thu muc khach san
                    let finalPath = file.path;
                    let targetPath = path.join(hotelDir, file.filename);
                    let relativePath = `uploads/hotels/${MaKS}/${file.filename}`;

                    if(file.path !== targetPath) {
                        fs.renameSync(file.path, targetPath);
                        finalPath = targetPath;
                    }

                    const insertResult = await pool.request()
                    .input('MaKS', sql.Int, parseInt(MaKS))
                    .input('TenFile', sql.NVarChar, file.filename)
                    .input('DuongDanAnh', sql.NVarChar, relativePath)
                    .input('LoaiAnh', sql.NVarChar, 'gallery') // Tạm thời để gallery
                    .input('ThuTu', sql.Int, i)
                    .input('MoTa', sql.NVarChar, `Ảnh khách sạn ${TenKS || hotelCheck.recordset[0].TenKS}`)
                    .query(`
                        INSERT INTO AnhKhachSan (MaKS, TenFile, DuongDanAnh, LoaiAnh, ThuTu, MoTa)
                        OUTPUT INSERTED.MaAnh
                        VALUES (@MaKS, @TenFile, @DuongDanAnh, @LoaiAnh, @ThuTu, @MoTa)
                    `);

                    const newImageId = insertResult.recordset[0].MaAnh;
                    
                    // Kiểm tra nếu ảnh mới này được chọn làm main
                    if (mainImageType === 'new' && mainImageIndex !== undefined && mainImageIndex !== null) {
                        const selectedIndex = parseInt(mainImageIndex);
                        if (!isNaN(selectedIndex) && selectedIndex === i) {
                            newMainImageId = newImageId;
                        }
                    }

                    uploadedImages.push({
                        MaAnh: newImageId,
                        TenFile: file.filename,
                        DuongDanAnh: relativePath,
                        LoaiAnh: 'gallery',
                        IsMain: false,
                        FullPath: `${req.protocol}://${req.get('host')}/${relativePath}`
                    });

                } catch (error) {
                    console.error(`Lỗi xử lý file ${file.filename}:`, error);
                }
            }
            
            if (uploadedImages.length > 0) {
                imageActions.push(`Đã upload ${uploadedImages.length} ảnh mới`);
            }
        }
        
        // Cập nhật ảnh main nếu có chỉ định
        if (newMainImageId) {
            // Đặt tất cả ảnh về gallery
            await pool.request()
                .input('MaKS', sql.Int, parseInt(MaKS))
                .query(`
                    UPDATE AnhKhachSan
                    SET LoaiAnh = 'gallery'
                    WHERE MaKS = @MaKS AND IsActive = 1
                `);
            
            // Đặt ảnh được chọn làm main
            const mainUpdateResult = await pool.request()
                .input('MaAnh', sql.Int, newMainImageId)
                .query(`
                    UPDATE AnhKhachSan
                    SET LoaiAnh = 'main'
                    WHERE MaAnh = @MaAnh AND IsActive = 1
                `);
            
            if (mainUpdateResult.rowsAffected[0] > 0) {
                imageActions.push('Đã cập nhật ảnh chính');
            }
            
            // Cập nhật uploadedImages để reflect việc thay đổi main
            const updatedImage = uploadedImages.find(img => img.MaAnh === newMainImageId);
            if (updatedImage) {
                updatedImage.LoaiAnh = 'main';
                updatedImage.IsMain = true;
            }
        } else if (req.files && req.files.length > 0) {
            // Nếu upload ảnh mới nhưng không chỉ định main, kiểm tra xem có ảnh main nào không
            const mainImageCheck = await pool.request()
                .input('MaKS', sql.Int, parseInt(MaKS))
                .query(`
                    SELECT COUNT(*) as mainCount 
                    FROM AnhKhachSan 
                    WHERE MaKS = @MaKS AND IsActive = 1 AND LoaiAnh = 'main'
                `);
            
            // Nếu không có ảnh main nào, đặt ảnh đầu tiên vừa upload làm main
            if (mainImageCheck.recordset[0].mainCount === 0 && uploadedImages.length > 0) {
                const firstImageId = uploadedImages[0].MaAnh;
                
                await pool.request()
                    .input('MaAnh', sql.Int, firstImageId)
                    .query(`
                        UPDATE AnhKhachSan
                        SET LoaiAnh = 'main'
                        WHERE MaAnh = @MaAnh AND IsActive = 1
                    `);
                
                uploadedImages[0].LoaiAnh = 'main';
                uploadedImages[0].IsMain = true;
                imageActions.push('Đã đặt ảnh đầu tiên làm ảnh chính (do chưa có ảnh chính)');
            }
        }

        //4. Tạo response message
        let message = 'Thông tin khách sạn đã được cập nhật thành công';
        if (imageActions.length > 0) {
            message += '. ' + imageActions.join(', ');
        }

        if (MaNguoiQuanLy !== undefined) {
            if (MaNguoiQuanLy === null) {
                message += '. Đã xóa người quản lý khỏi khách sạn.';
            } else {
                // Lấy tên người quản lý mới
                const managerInfo = await pool.request()
                    .input('MaKH', sql.Int, MaNguoiQuanLy)
                    .query('SELECT HoTen FROM NguoiDung WHERE MaKH = @MaKH');
                
                if (managerInfo.recordset.length > 0) {
                    message += `. Đã chỉ định "${managerInfo.recordset[0].HoTen}" làm người quản lý khách sạn.`;
                }
            }
        }

        res.json({
            success: true,
            message: message,
            data: {
                MaKS: parseInt(MaKS),
                uploadedImages: uploadedImages,
                deletedImagesCount: deletedImagesCount,
                imageActions: imageActions
            }
        });
    }
    catch (err) {
        console.error('Lỗi updateHotel:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
};

exports.uploadHotelWithImages = async (req, res) => {
    const { MaKS } = req.params;
    const {
        TenKS,
        DiaChi,
        HangSao,
        LoaiHinh,
        MoTaCoSoVatChat,
        QuyDinh,
        MotaChung,
        MaNguoiQuanLy,
        mainImageIndex // Index của ảnh sẽ làm main trong danh sách files được upload
    } = req.body;

    if (!MaKS || isNaN(MaKS)) {
        return res.status(400).json({ error: 'Mã khách sạn không hợp lệ' });
    }

    try {
        const pool = await poolPromise;

        // Kiểm tra khách sạn tồn tại
        const hotelCheck = await pool.request()
            .input('MaKS', sql.Int, parseInt(MaKS))
            .query('SELECT MaKS, TenKS FROM KhachSan WHERE MaKS = @MaKS AND IsActive = 1');

        if (hotelCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy khách sạn' });
        }

        // Validate manager nếu có
        if (MaNguoiQuanLy !== undefined && MaNguoiQuanLy !== null) {
            const managerValidation = await pool.request()
                .input('MaKH', sql.Int, MaNguoiQuanLy)
                .query(`
                    SELECT MaKH, LoaiUser, HoTen 
                    FROM NguoiDung 
                    WHERE MaKH = @MaKH AND IsActive = 1
                `);

            if (managerValidation.recordset.length === 0) {
                return res.status(400).json({
                    error: 'Không tìm thấy người dùng với mã này hoặc tài khoản đã bị vô hiệu hóa'
                });
            }

            const manager = managerValidation.recordset[0];
            if (manager.LoaiUser !== 'QuanLyKS' && manager.LoaiUser !== 'Admin') {
                return res.status(400).json({
                    error: `Người dùng "${manager.HoTen}" không có quyền làm người quản lý khách sạn.`
                });
            }
        }

        // 1. Cập nhật thông tin khách sạn
        let updateFields = [];
        let queryParams = { MaKS: parseInt(MaKS) };

        if (TenKS !== undefined) {
            updateFields.push('TenKS = @TenKS');
            queryParams.TenKS = TenKS;
        }
        if (DiaChi !== undefined) {
            updateFields.push('DiaChi = @DiaChi');
            queryParams.DiaChi = DiaChi;
        }
        if (HangSao !== undefined) {
            updateFields.push('HangSao = @HangSao');
            queryParams.HangSao = HangSao;
        }
        if (LoaiHinh !== undefined) {
            updateFields.push('LoaiHinh = @LoaiHinh');
            queryParams.LoaiHinh = LoaiHinh;
        }
        if (MoTaCoSoVatChat !== undefined) {
            updateFields.push('MoTaCoSoVatChat = @MoTaCoSoVatChat');
            queryParams.MoTaCoSoVatChat = MoTaCoSoVatChat;
        }
        if (QuyDinh !== undefined) {
            updateFields.push('QuyDinh = @QuyDinh');
            queryParams.QuyDinh = QuyDinh;
        }
        if (MotaChung !== undefined) {
            updateFields.push('MotaChung = @MotaChung');
            queryParams.MotaChung = MotaChung;
        }
        if (MaNguoiQuanLy !== undefined) {
            updateFields.push('MaNguoiQuanLy = @MaNguoiQuanLy');
            queryParams.MaNguoiQuanLy = MaNguoiQuanLy;
        }

        // Cập nhật thông tin khách sạn nếu có thay đổi
        if (updateFields.length > 0) {
            const query = `
                UPDATE KhachSan
                SET ${updateFields.join(', ')}
                WHERE MaKS = @MaKS
            `;

            const request = pool.request();
            Object.keys(queryParams).forEach(key => {
                if (key === 'MaKS' || key === 'MaNguoiQuanLy') {
                    request.input(key, sql.Int, queryParams[key]);
                } else if (key === 'MoTaCoSoVatChat' || key === 'QuyDinh' || key === 'MotaChung') {
                    request.input(key, sql.NVarChar(sql.MAX), queryParams[key]);
                } else {
                    request.input(key, sql.NVarChar, queryParams[key]);
                }
            });

            await request.query(query);
        }

        // 2. Xử lý upload ảnh nếu có
        const uploadedImages = [];
        if (req.files && req.files.length > 0) {
            // Đặt tất cả ảnh hiện tại về gallery trước
            if (mainImageIndex !== undefined && mainImageIndex !== null) {
                await pool.request()
                    .input('MaKS', sql.Int, parseInt(MaKS))
                    .query(`
                        UPDATE AnhKhachSan 
                        SET LoaiAnh = 'gallery' 
                        WHERE MaKS = @MaKS AND LoaiAnh = 'main'
                    `);
            }

            // Upload từng file
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const isMainImage = (mainImageIndex == i); // So sánh index
                
                try {
                    const insertResult = await pool.request()
                        .input('MaKS', sql.Int, parseInt(MaKS))
                        .input('TenFile', sql.NVarChar, file.filename)
                        .input('DuongDanAnh', sql.NVarChar, `uploads/hotels/${file.filename}`)
                        .input('LoaiAnh', sql.NVarChar, isMainImage ? 'main' : 'gallery')
                        .input('ThuTu', sql.Int, i)
                        .input('MoTa', sql.NVarChar, `Ảnh khách sạn ${TenKS || ''}`)
                        .query(`
                            INSERT INTO AnhKhachSan (MaKS, TenFile, DuongDanAnh, LoaiAnh, ThuTu, MoTa)
                            OUTPUT INSERTED.MaAnh
                            VALUES (@MaKS, @TenFile, @DuongDanAnh, @LoaiAnh, @ThuTu, @MoTa)
                        `);

                    uploadedImages.push({
                        MaAnh: insertResult.recordset[0].MaAnh,
                        TenFile: file.filename,
                        DuongDanAnh: `uploads/hotels/${file.filename}`,
                        LoaiAnh: isMainImage ? 'main' : 'gallery',
                        IsMain: isMainImage
                    });
                } catch (error) {
                    console.error(`Lỗi xử lý file ${file.filename}:`, error);
                }
            }
        }

        let message = 'Thông tin khách sạn đã được cập nhật thành công';
        if (uploadedImages.length > 0) {
            message += `. Đã upload ${uploadedImages.length} ảnh mới`;
            const mainImages = uploadedImages.filter(img => img.IsMain);
            if (mainImages.length > 0) {
                message += ` (bao gồm 1 ảnh chính)`;
            }
        }

        res.json({
            success: true,
            message,
            data: {
                MaKS: parseInt(MaKS),
                uploadedImages: uploadedImages
            }
        });

    } catch (error) {
        console.error('Lỗi updateHotelWithImages:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật khách sạn' });
    }
};

// Hàm đặt ảnh làm ảnh chính
exports.setMainImage = async (req, res) => {
    try {
        const { MaAnh } = req.params;
        const pool = await poolPromise;

        // Lấy thông tin ảnh để biết MaKS
        const imageResult = await pool.request()
            .input('MaAnh', sql.Int, parseInt(MaAnh))
            .query('SELECT MaKS, TenFile FROM AnhKhachSan WHERE MaAnh = @MaAnh AND IsActive = 1');

        if (imageResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy ảnh' });
        }

        const { MaKS } = imageResult.recordset[0];

        // Đặt tất cả ảnh của khách sạn về gallery
        await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                UPDATE AnhKhachSan 
                SET LoaiAnh = 'gallery' 
                WHERE MaKS = @MaKS AND IsActive = 1
            `);

        // Đặt ảnh được chọn làm main
        await pool.request()
            .input('MaAnh', sql.Int, parseInt(MaAnh))
            .query(`
                UPDATE AnhKhachSan 
                SET LoaiAnh = 'main' 
                WHERE MaAnh = @MaAnh
            `);

        res.json({
            success: true,
            message: 'Đã đặt ảnh làm ảnh chính thành công'
        });

    } catch (error) {
        console.error('Lỗi setMainImage:', error);
        res.status(500).json({ error: 'Lỗi server khi đặt ảnh chính' });
    }
};
// exports.deleteHotel = async (req, res) => {
//     const { MaKS } = req.params;
    
//     if(!MaKS || isNaN(MaKS))
//         return res.status(400).json({error: 'Mã khách sạn không hợp lệ'});

//     try
//     {
//         const pool = await poolPromise;

//         const result = await pool.request()
//             .input('MaKS', sql.Int, parseInt(MaKS))
//             .query(`DELETE FROM KhachSan WHERE MaKS = @MaKS`);
            
//         if (result.rowsAffected[0] === 0) 
//             return res.status(404).json({error: 'Không tìm thấy khách sạn để xoá'});

//         res.json({message: 'Khách sạn đã được xóa thành công'});
//     }
//     catch (err)
//     {
//         console.error('Lỗi deleteHotel:', err);
//         res.status(500).json({error: 'Lỗi server'});
//     }
// };

exports.getAllHotels = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'rating', sortOrder = 'desc' } = req.query;
        const offset = (page - 1) * limit;
        const pool = await poolPromise;
        const countResult = await pool.request().query(`
            SELECT COUNT(*) as total
            FROM KhachSan
        `);

        // Base query
        let query = `
            SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh, ks.IsActive,
                   nd.HoTen AS NguoiQuanLy,
                   MIN(lp.GiaCoSo) as GiaThapNhat,
                   ak.DuongDanAnh as MainImagePath
            FROM KhachSan ks
            LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
            LEFT JOIN Phong p ON ks.MaKS = p.MaKS
            LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
            LEFT JOIN AnhKhachSan ak ON ks.MaKS = ak.MaKS
                AND ak.LoaiAnh = 'main'
                AND ak.IsActive = 1
                AND ak.MaAnh = (
                    SELECT TOP 1 MaAnh 
                    FROM AnhKhachSan 
                    WHERE MaKS = ks.MaKS AND IsActive = 1 AND LoaiAnh = 'main'
                    ORDER BY ThuTu ASC, NgayThem ASC
                )
        `;

        // Add GROUP BY
        query += `
            GROUP BY ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh, ak.DuongDanAnh, ks.IsActive, nd.HoTen
        `;

        // Handle sorting based on parameters
        let orderByClause = '';
        const validSortFields = ['rating', 'price', 'name'];
        const validSortOrders = ['asc', 'desc'];
        
        // Validate parameters
        const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'rating';
        const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
        
        switch (safeSortBy) {
            case 'rating':
                orderByClause = `ORDER BY ks.HangSao ${safeSortOrder}`;
                break;
            case 'price':
                orderByClause = `ORDER BY MIN(lp.GiaCoSo) ${safeSortOrder}`;
                break;
            case 'name':
                orderByClause = `ORDER BY ks.TenKS ${safeSortOrder}`;
                break;
            default:
                orderByClause = 'ORDER BY ks.HangSao DESC'; // Default fallback
        }

        // Add ORDER BY and pagination
        query += `
            ${orderByClause}
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const result = await pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(query);

        const hotelsWithImages = result.recordset.map(hotel => ({
            ...hotel,
            MainImagePath: hotel.MainImagePath
                ? `${req.protocol}://${req.get('host')}/${hotel.MainImagePath}`
                : null
        }));

        res.json({
            success: true,
            data: hotelsWithImages,
            pagination: {
                total: countResult.recordset[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.recordset[0].total / parseInt(limit))
            },
            sorting: {
                sortBy: safeSortBy,
                sortOrder: safeSortOrder
            }
        });
    } catch (err) {
        console.error('Lỗi getAllHotels:', err);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
};

exports.getHotelById = async (req, res) => {
    const { MaKS } = req.params;

    if (!MaKS || isNaN(Number(MaKS))) {
        return res.status(400).json({
            success: false,
            message: 'Mã khách sạn không hợp lệ'
        });
    }

    try {
        const pool = await poolPromise;

        // Get hotel basic information
        const hotelResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh,
                       ks.MoTaCoSoVatChat, ks.QuyDinh, ks.MoTaChung, ks.Latitude, ks.Longitude, ks.IsActive, ks.MaNguoiQuanLy
                FROM KhachSan ks
                WHERE ks.MaKS = @MaKS
            `);

        if (hotelResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách sạn'
            });
        }

        const imagesResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
               SELECT 
                    MaAnh,
                    TenFile,
                    DuongDanAnh,
                    LoaiAnh,
                    IsActive,
                    ThuTu,
                    MoTa,
                    NgayThem
                FROM AnhKhachSan
                WHERE MaKS = @MaKS AND IsActive = 1
                ORDER BY 
                    CASE WHEN LoaiAnh = 'main' THEN 1 ELSE 2 END,
                    ThuTu ASC,
                    NgayThem ASC
            `);


        // Get room types and pricing information
        const roomTypesResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT DISTINCT lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo, lp.SoGiuong,
                       lp.DienTich, lp.MoTa, lp.TienNghi, lp.DuongDanAnh,
                       chg.TenCauHinh as CauHinhGiuong,
                       chg.SoGiuongDoi,
                       chg.SoGiuongDon,
                       COUNT(DISTINCT CASE WHEN p.TrangThaiPhong = N'Trong' THEN p.MaPhong END) as SoPhongTrong
                FROM LoaiPhong lp
                LEFT JOIN Phong p ON lp.MaLoaiPhong = p.MaLoaiPhong
                LEFT JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE lp.MaKS = @MaKS AND lp.IsActive = 1
                GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo, lp.SoGiuong,
                         lp.DienTich, lp.MoTa, lp.TienNghi, lp.DuongDanAnh,
                         chg.TenCauHinh, chg.SoGiuongDoi, chg.SoGiuongDon
                ORDER BY lp.GiaCoSo ASC
            `);

        // Get hotel amenities/services
        const servicesResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT ldv.MaLoaiDV, ldv.TenLoaiDV, ldv.MoTaDV, ldv.GiaDV
                FROM LoaiDichVu ldv
                WHERE ldv.MaKS = @MaKS
                ORDER BY ldv.TenLoaiDV
            `);

        const images = imagesResult.recordset.map(img => ({
            ...img,
            FullPath: `${req.protocol}://${req.get('host')}/${img.DuongDanAnh}`
        }));

        // Phân loại ảnh
        const mainImage = images.find(img => img.LoaiAnh === 'main');
        const galleryImages = images.filter(img => img.LoaiAnh === 'gallery');

        const roomTypesWithImages = roomTypesResult.recordset.map(roomType => ({
            ...roomType,
            RoomImagePath: roomType.DuongDanAnh
                ? `${req.protocol}://${req.get('host')}/${roomType.DuongDanAnh}`
                : null
        }));

        // Calculate price range
        const priceRange = roomTypesResult.recordset.length > 0 ? {
            min: Math.min(...roomTypesResult.recordset.map(room => room.GiaCoSo)),
            max: Math.max(...roomTypesResult.recordset.map(room => room.GiaCoSo))
        } : { min: 0, max: 0 };

        const hotelData = {
            ...hotelResult.recordset[0],
            MainImagePath: mainImage ? mainImage.FullPath : null,
            GalleryImages: galleryImages,
            AllImages: images,
            TotalImages: images.length,
            roomTypes: roomTypesWithImages,
            services: servicesResult.recordset,
            priceRange: priceRange,
            totalRoomTypes: roomTypesResult.recordset.length
        };

        res.json({
            success: true,
            data: hotelData
        });
    } catch (err) {
        console.error('Lỗi getHotelById:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.getHotelsByNguoiQuanLy = async (req, res) => {
    const {MaKH} = req.params;

    if(!MaKH || isNaN(MaKH))
        return res.status(400).json({error: 'Mã người quản lý không hợp lệ'});

    try
    {
        const pool = await poolPromise;
        const result = await pool.request()
        .input('MaKH', sql.Int, parseInt(MaKH))
        .query(`
            SELECT 
                ks.MaKS, 
                ks.TenKS, 
                ks.DiaChi, 
                ks.HangSao, 
                ks.LoaiHinh,
                ks.MoTaCoSoVatChat,
                ks.QuyDinh,
                ks.MotaChung,
                ks.IsActive,
                ak.DuongDanAnh as MainImagePath
            FROM KhachSan ks
            LEFT JOIN AnhKhachSan ak ON ks.MaKS = ak.MaKS
                AND ak.LoaiAnh = 'main'
                AND ak.IsActive = 1
                AND ak.MaAnh = (
                    SELECT TOP 1 MaAnh 
                    FROM AnhKhachSan 
                    WHERE MaKS = ks.MaKS AND IsActive = 1 AND LoaiAnh = 'main'
                    ORDER BY ThuTu ASC, NgayThem ASC
                )
            WHERE ks.MaNguoiQuanLy = @MaKH
            ORDER BY ks.TenKS
        `);

        const hotelsWithImages = result.recordset.map(hotel => ({
            ...hotel,
            MainImagePath: hotel.MainImagePath
                ? `${req.protocol}://${req.get('host')}/${hotel.MainImagePath}`
                : null
        }));

        res.json({
            success: true,
            data: hotelsWithImages
        });
    }
    catch (err)
    {
        console.error('Lỗi getHotelByNguoiQuanLy:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};

// Lấy danh sách khách sạn nổi bật
exports.getFeaturedHotels = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 6
                ks.MaKS,
                ks.TenKS,
                ks.DiaChi,
                ks.HangSao,
                MIN(lp.GiaCoSo) as GiaThapNhat,
                ak.DuongDanAnh as MainImagePath
            FROM KhachSan ks
            LEFT JOIN Phong p ON ks.MaKS = p.MaKS
            LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
            LEFT JOIN AnhKhachSan ak ON ks.MaKS = ak.MaKS
                AND ak.LoaiAnh = 'main'
                AND ak.IsActive = 1
                AND ak.MaAnh = (
                    SELECT TOP 1 MaAnh 
                    FROM AnhKhachSan 
                    WHERE MaKS = ks.MaKS AND IsActive = 1 AND LoaiAnh = 'main'
                    ORDER BY ThuTu ASC, NgayThem ASC
                )
            GROUP BY ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ak.DuongDanAnh
            ORDER BY ks.HangSao DESC
        `);

        const hotelsWithImages = result.recordset.map(hotel => ({
            ...hotel,
            MainImagePath: hotel.MainImagePath
                ? `${req.protocol}://${req.get('host')}/${hotel.MainImagePath}`
                : null
        }));

        res.json({
            success: true,
            data: hotelsWithImages
        });
    } catch (error) {
        console.error('Lỗi getFeaturedHotels:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách khách sạn nổi bật'
        });
    }
};

exports.suggestLocations = async (req, res) => {
    try {
        const keyword = req.query.keyword; //từ khóa tìm kiếm
        const pool = await poolPromise;
        const result = await pool.request()
            .input('keyword', sql.NVarChar, keyword)
            .query(`
                SELECT DISTINCT DiaChi
                FROM KhachSan
                WHERE DiaChi  COLLATE Latin1_General_CI_AI LIKE '%' + @keyword + '%'
            `);
        
        res.json({
            success: true,
            data: result.recordset.map(r => r.DiaChi)
        });
    }
    catch (err)
    {
        console.error('Lỗi suggestLocations:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
}

/**
 * Tìm kiếm khách sạn và phòng trống
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.searchAvailableHotels = async (req, res) => {
    try {
        const { location, startDate, endDate, numberOfGuests } = req.body;

        // Validate required parameters
        if (!startDate || !endDate || !numberOfGuests) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: ngày nhận phòng, ngày trả phòng và số lượng khách'
            });
        }

        // Validate dates and guests
        const checkIn = new Date(startDate);
        const checkOut = new Date(endDate);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng ngày không hợp lệ'
            });
        }

        if (checkIn >= checkOut) {
            return res.status(400).json({
                success: false,
                message: 'Ngày trả phòng phải sau ngày nhận phòng'
            });
        }

        const guests = parseInt(numberOfGuests);
        if (isNaN(guests) || guests < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng khách không hợp lệ'
            });
        }

        const pool = await poolPromise;

        // First, get all hotels and their room types that match the location
        const hotelsResult = await pool.request()
            .input('numberOfGuests', sql.Int, guests)
            .input('location', sql.NVarChar, location ? `%${location}%` : '%')
            .query(`
                SELECT DISTINCT
                    ks.MaKS,
                    ks.TenKS,
                    ks.DiaChi,
                    ks.HangSao,
                    ks.LoaiHinh,
                    ks.MoTaChung,
                    ks.Latitude,
                    ks.Longitude,
                    lp.MaLoaiPhong,
                    lp.TenLoaiPhong,
                    lp.GiaCoSo,
                    lp.DienTich,
                    lp.TienNghi,
                    lp.DuongDanAnh as RoomImagePath,
                    chg.TenCauHinh as CauHinhGiuong,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon,
                    ak.DuongDanAnh as HotelMainImagePath
                FROM KhachSan ks
                JOIN LoaiPhong lp ON ks.MaKS = lp.MaKS
                JOIN Phong p ON lp.MaLoaiPhong = p.MaLoaiPhong
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                LEFT JOIN AnhKhachSan ak ON ks.MaKS = ak.MaKS
                    AND ak.LoaiAnh = 'main'
                    AND ak.IsActive = 1
                    AND ak.MaAnh = (
                        SELECT TOP 1 MaAnh 
                        FROM AnhKhachSan 
                        WHERE MaKS = ks.MaKS AND IsActive = 1 AND LoaiAnh = 'main'
                        ORDER BY ThuTu ASC, NgayThem ASC
                    )
                WHERE (chg.SoGiuongDoi * 2 + chg.SoGiuongDon) >= @numberOfGuests
                AND (ks.DiaChi COLLATE Latin1_General_CI_AI LIKE @location OR ks.TenKS COLLATE Latin1_General_CI_AI LIKE @location)
                ORDER BY ks.HangSao DESC, lp.GiaCoSo ASC;
            `);

        // Then, check availability for each room type
        const availableRoomsResult = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('numberOfGuests', sql.Int, guests)
            .query(`
                WITH AvailableRooms AS (
                    SELECT
                        p.MaKS,
                        p.MaLoaiPhong,
                        COUNT(*) as SoPhongTrong
                    FROM Phong p
                    JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                    WHERE p.TrangThaiPhong != N'Bảo trì'
                    AND (chg.SoGiuongDoi * 2 + chg.SoGiuongDon) >= @numberOfGuests
                    AND NOT EXISTS (
                        SELECT 1 FROM Booking b
                        WHERE b.MaPhong = p.MaPhong
                        AND b.TrangThaiBooking != N'Đã hủy'
                        AND (
                            b.NgayNhanPhong < @endDate
                            AND b.NgayTraPhong > @startDate
                        )
                        AND (
                            b.TrangThaiBooking != N'Tạm giữ'
                            OR (b.TrangThaiBooking = N'Tạm giữ' AND b.ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15)
                        )
                    )
                    GROUP BY p.MaKS, p.MaLoaiPhong
                )
                SELECT * FROM AvailableRooms;
            `);

        // Create a map of available rooms
        const availableRoomsMap = new Map();
        availableRoomsResult.recordset.forEach(room => {
            availableRoomsMap.set(`${room.MaKS}-${room.MaLoaiPhong}`, room.SoPhongTrong);
        });

        // Format response - Group by room type to avoid duplicates
        const hotels = {};
        const roomTypeMap = new Map(); // Track processed room types to avoid duplicates

        for (const record of hotelsResult.recordset) {
            // Initialize hotel if not exists
            if (!hotels[record.MaKS]) {
                hotels[record.MaKS] = {
                    MaKS: record.MaKS,
                    TenKS: record.TenKS,
                    DiaChi: record.DiaChi,
                    HangSao: record.HangSao,
                    LoaiHinh: record.LoaiHinh,
                    MoTaChung: record.MoTaChung,
                    Latitude: record.Latitude,
                    Longitude: record.Longitude,
                    MainImagePath: record.HotelMainImagePath
                        ? `${req.protocol}://${req.get('host')}/${record.HotelMainImagePath}`
                        : null,
                    roomTypes: []
                };
            }

            const roomTypeKey = `${record.MaKS}-${record.MaLoaiPhong}`;
            
            // Check if this room type is already processed
            if (roomTypeMap.has(roomTypeKey)) {
                // Add bed configuration to existing room type
                const existingRoomType = roomTypeMap.get(roomTypeKey);
                if (!existingRoomType.bedConfigurations) {
                    existingRoomType.bedConfigurations = [existingRoomType.CauHinhGiuong];
                }
                if (!existingRoomType.bedConfigurations.includes(record.CauHinhGiuong)) {
                    existingRoomType.bedConfigurations.push(record.CauHinhGiuong);
                }
                continue;
            }

            const availableRooms = availableRoomsMap.get(roomTypeKey) || 0;

            const roomType = {
                MaLoaiPhong: record.MaLoaiPhong,
                TenLoaiPhong: record.TenLoaiPhong,
                GiaCoSo: record.GiaCoSo,
                DienTich: record.DienTich,
                TienNghi: record.TienNghi,
                RoomImagePath: record.RoomImagePath
                    ? `${req.protocol}://${req.get('host')}/${record.RoomImagePath}`
                    : null,
                CauHinhGiuong: record.CauHinhGiuong, // Keep first bed config for compatibility
                SoGiuongDoi: record.SoGiuongDoi,
                SoGiuongDon: record.SoGiuongDon,
                SoPhongTrong: availableRooms,
                bedConfigurations: [record.CauHinhGiuong] // Array of all bed configurations
            };

            // If no rooms available, get alternative dates
            if (availableRooms === 0) {
                console.log(`No rooms available for room type ${record.MaLoaiPhong}, getting alternative dates...`);
                try {
                    const alternativeDatesResult = await exports.suggestAlternativeDates({
                        body: {
                            NgayNhanPhong: startDate,
                            NgayTraPhong: endDate,
                            MaLoaiPhong: record.MaLoaiPhong
                        }
                    });

                    console.log('Alternative dates result:', alternativeDatesResult);

                    if (alternativeDatesResult && alternativeDatesResult.success) {
                        roomType.alternativeDates = alternativeDatesResult.data.suggestions;
                        console.log(`Added ${alternativeDatesResult.data.suggestions.length} alternative dates to room type ${record.MaLoaiPhong}`);
                    }
                } catch (error) {
                    console.error('Error getting alternative dates:', error);
                }
            }

            // Store in map to track processed room types
            roomTypeMap.set(roomTypeKey, roomType);
            
            // Add to hotel's room types array
            hotels[record.MaKS].roomTypes.push(roomType);
        }

        // Return only the first matching hotel
        const matchingHotels = Object.values(hotels);
        const result = matchingHotels.length > 0 ? matchingHotels[0] : null;

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error searching hotels:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm khách sạn'
        });
    }
};

/**
 * Gợi ý các khoảng thời gian thay thế khi phòng không còn trống
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.suggestAlternativeDates = async (req, res) => {
    try {
        const { NgayNhanPhong, NgayTraPhong, MaLoaiPhong } = req.body;

        if (!NgayNhanPhong || !NgayTraPhong || !MaLoaiPhong) {
            const response = { 
                success: false, 
                message: 'Vui lòng cung cấp đầy đủ thông tin: NgayNhanPhong, NgayTraPhong, MaLoaiPhong' 
            };
            if (res && res.json) {
                return res.status(400).json(response);
            }
            return response;
        }

        const pool = await poolPromise;
        const originalDuration = Math.ceil((new Date(NgayTraPhong) - new Date(NgayNhanPhong)) / (1000 * 60 * 60 * 24));

        // Tìm các khoảng thời gian thay thế
        console.log('suggestAlternativeDates - Input parameters:', {
            NgayNhanPhong,
            NgayTraPhong,
            MaLoaiPhong,
            originalDuration
        });

        const result = await pool.request()
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .input('originalDuration', sql.Int, originalDuration)
            .query(`
                WITH DateRange AS (
                    SELECT 
                        DATEADD(DAY, -7, @NgayNhanPhong) as StartDate,
                        DATEADD(DAY, 7, @NgayTraPhong) as EndDate
                ),
                BookedDates AS (
                    SELECT 
                        b.NgayNhanPhong,
                        b.NgayTraPhong
                    FROM Booking b
                    JOIN Phong p ON b.MaPhong = p.MaPhong
                    WHERE p.MaLoaiPhong = @MaLoaiPhong
                    AND b.TrangThaiBooking != N'Đã hủy'
                    AND p.TrangThaiPhong != N'Bảo trì'
                    AND (
                        b.TrangThaiBooking != N'Tạm giữ'
                        OR (b.TrangThaiBooking = N'Tạm giữ' AND b.ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15)
                    )
                    AND b.NgayNhanPhong < (SELECT EndDate FROM DateRange)
                    AND b.NgayTraPhong > (SELECT StartDate FROM DateRange)
                ),
                AvailableRanges AS (
                    -- Khoảng trống trước booking đầu tiên
                    SELECT 
                        (SELECT StartDate FROM DateRange) as GapStart,
                        DATEADD(DAY, -1, MIN(NgayNhanPhong)) as GapEnd
                    FROM BookedDates
                    WHERE NOT EXISTS (
                        SELECT 1 FROM BookedDates b2 
                        WHERE b2.NgayNhanPhong < BookedDates.NgayNhanPhong
                    )
                    UNION ALL
                    -- Khoảng trống giữa các booking
                    SELECT 
                        DATEADD(DAY, 1, NgayTraPhong) as GapStart,
                        DATEADD(DAY, -1, NextCheckIn) as GapEnd
                    FROM (
                        SELECT 
                            NgayNhanPhong,
                            NgayTraPhong,
                            LEAD(NgayNhanPhong) OVER (ORDER BY NgayNhanPhong) as NextCheckIn
                        FROM BookedDates
                    ) AS BookedDatesWithNext
                    WHERE NextCheckIn IS NOT NULL
                    UNION ALL
                    -- Khoảng trống sau booking cuối cùng
                    SELECT 
                        DATEADD(DAY, 1, MAX(NgayTraPhong)) as GapStart,
                        (SELECT EndDate FROM DateRange) as GapEnd
                    FROM BookedDates
                    WHERE NOT EXISTS (
                        SELECT 1 FROM BookedDates b2 
                        WHERE b2.NgayNhanPhong > BookedDates.NgayNhanPhong
                    )
                    UNION ALL
                    -- Trường hợp không có booking nào
                    SELECT 
                        StartDate,
                        EndDate
                    FROM DateRange
                    WHERE NOT EXISTS (SELECT 1 FROM BookedDates)
                ),
                ValidRanges AS (
                    SELECT 
                        GapStart,
                        GapEnd,
                        DATEDIFF(DAY, GapStart, GapEnd) + 1 as AvailableDuration
                    FROM AvailableRanges
                    WHERE DATEDIFF(DAY, GapStart, GapEnd) + 1 >= @originalDuration
                ),
                SuggestedDates AS (
                    -- Before suggestions
                    SELECT 
                        DATEADD(DAY, -@originalDuration, GapEnd) as CheckInDate,
                        GapEnd as CheckOutDate,
                        'before' as Period,
                        @originalDuration as Duration,
                        ABS(DATEDIFF(DAY, DATEADD(DAY, -@originalDuration, GapEnd), @NgayNhanPhong)) as DaysFromOriginal
                    FROM ValidRanges
                    WHERE GapEnd <= @NgayNhanPhong
                    AND DATEDIFF(DAY, GapStart, GapEnd) >= @originalDuration
                    AND NOT EXISTS (
                        SELECT 1 FROM BookedDates b
                        WHERE b.NgayNhanPhong < GapEnd
                        AND b.NgayTraPhong > DATEADD(DAY, -@originalDuration, GapEnd)
                    )
                    UNION ALL
                    -- After suggestions
                    SELECT 
                        GapStart as CheckInDate,
                        DATEADD(DAY, @originalDuration, GapStart) as CheckOutDate,
                        'after' as Period,
                        @originalDuration as Duration,
                        ABS(DATEDIFF(DAY, GapStart, @NgayNhanPhong)) as DaysFromOriginal
                    FROM ValidRanges
                    WHERE DATEADD(DAY, @originalDuration, GapStart) <= GapEnd
                    AND GapStart > @NgayTraPhong
                    AND NOT EXISTS (
                        SELECT 1 FROM BookedDates b
                        WHERE b.NgayNhanPhong < DATEADD(DAY, @originalDuration, GapStart)
                        AND b.NgayTraPhong > GapStart
                    )
                )
                SELECT 
                    CheckInDate,
                    CheckOutDate,
                    Period,
                    Duration,
                    DaysFromOriginal
                FROM SuggestedDates
                ORDER BY 
                    CASE 
                        WHEN Period = 'after' THEN 1
                        ELSE 2
                    END,
                    DaysFromOriginal
            `);

        console.log('suggestAlternativeDates - Query result:', result.recordset);

        const suggestions = result.recordset.map(date => ({
            checkIn: date.CheckInDate,
            checkOut: date.CheckOutDate,
            period: date.Period,
            duration: date.Duration,
            daysFromOriginal: date.DaysFromOriginal
        }));

        const response = {
            success: true,
            data: {
                originalDates: {
                    checkIn: NgayNhanPhong,
                    checkOut: NgayTraPhong,
                    duration: originalDuration
                },
                suggestions
            }
        };

        if (res && res.json) {
            return res.json(response);
        }
        return response;
    } catch (err) {
        console.error('Lỗi suggestAlternativeDates:', err);
        const errorResponse = { 
            success: false, 
            message: 'Lỗi server khi tìm kiếm thời gian thay thế' 
        };
        if (res && res.json) {
            return res.status(500).json(errorResponse);
        }
        return errorResponse;
    }
};
// HÀM MỚI: Lấy danh sách khách sạn cơ bản cho Admin (MaKS, TenKS)
exports.getBasicHotelListForAdmin = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh,
                   nd.HoTen AS NguoiQuanLy
            FROM KhachSan ks
            LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
            ORDER BY ks.HangSao DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Lỗi getBasicHotelListForAdmin:', err);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
};

// API để assign/unassign manager cho khách sạn
exports.assignManager = async (req, res) => {
    const { MaKS } = req.params;
    const { MaNguoiQuanLy } = req.body; // null để unassign

    if (!MaKS || isNaN(MaKS)) {
        return res.status(400).json({ error: 'Mã khách sạn không hợp lệ' });
    }

    try {
        const pool = await poolPromise;

        // Kiểm tra khách sạn có tồn tại không
        const hotelCheck = await pool.request()
            .input('MaKS', sql.Int, parseInt(MaKS))
            .query('SELECT MaKS, TenKS FROM KhachSan WHERE MaKS = @MaKS');

        if (hotelCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy khách sạn' });
        }

        const hotel = hotelCheck.recordset[0];

        // Nếu MaNguoiQuanLy không phải null, validate role
        if (MaNguoiQuanLy !== null && MaNguoiQuanLy !== undefined) {
            const managerValidation = await pool.request()
                .input('MaKH', sql.Int, MaNguoiQuanLy)
                .query(`
                    SELECT MaKH, LoaiUser, HoTen 
                    FROM NguoiDung 
                    WHERE MaKH = @MaKH AND IsActive = 1
                `);

            if (managerValidation.recordset.length === 0) {
                return res.status(400).json({
                    error: 'Không tìm thấy người dùng với mã này hoặc tài khoản đã bị vô hiệu hóa'
                });
            }

            const manager = managerValidation.recordset[0];
            if (manager.LoaiUser !== 'QuanLyKS' && manager.LoaiUser !== 'Admin') {
                return res.status(400).json({
                    error: `Người dùng "${manager.HoTen}" không có quyền làm người quản lý khách sạn. Chỉ người dùng có role "QuanLyKS" hoặc "Admin" mới có thể được chỉ định làm người quản lý.`
                });
            }
        }

        // Update manager
        const result = await pool.request()
            .input('MaKS', sql.Int, parseInt(MaKS))
            .input('MaNguoiQuanLy', sql.Int, MaNguoiQuanLy)
            .query(`
                UPDATE KhachSan
                SET MaNguoiQuanLy = @MaNguoiQuanLy
                WHERE MaKS = @MaKS
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(500).json({ error: 'Không thể cập nhật người quản lý' });
        }

        let message;
        if (MaNguoiQuanLy === null || MaNguoiQuanLy === undefined) {
            message = `Đã xóa người quản lý khỏi khách sạn "${hotel.TenKS}"`;
        } else {
            // Lấy tên người quản lý mới
            const managerInfo = await pool.request()
                .input('MaKH', sql.Int, MaNguoiQuanLy)
                .query('SELECT HoTen FROM NguoiDung WHERE MaKH = @MaKH');
            
            const managerName = managerInfo.recordset[0]?.HoTen || 'Không xác định';
            message = `Đã chỉ định "${managerName}" làm người quản lý khách sạn "${hotel.TenKS}"`;
        }

        res.json({
            success: true,
            message
        });

    } catch (err) {
        console.error('Lỗi assignManager:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// API để lấy danh sách người dùng có thể làm quản lý khách sạn
exports.getAvailableManagers = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const result = await pool.request()
            .query(`
                SELECT MaKH, HoTen, Email, LoaiUser
                FROM NguoiDung
                WHERE (LoaiUser = 'QuanLyKS' OR LoaiUser = 'Admin') 
                AND IsActive = 1
                ORDER BY HoTen ASC
            `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (err) {
        console.error('Lỗi getAvailableManagers:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

exports.getHotelWithImages = async (req, res) => {
    try {
        const { MaKS } = req.params;
        const pool = await poolPromise;

        // Lấy thông tin khách sạn
        const hotelResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT 
                    ks.*,
                    nd.HoTen as TenNguoiQuanLy
                FROM KhachSan ks
                LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
                WHERE ks.MaKS = @MaKS AND ks.IsActive = 1
            `);

        if (hotelResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy khách sạn' });
        }

        const hotel = hotelResult.recordset[0];

        // Lấy ảnh khách sạn
        const imagesResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT 
                    MaAnh,
                    TenFile,
                    DuongDanAnh,
                    LoaiAnh,
                    ThuTu,
                    MoTa,
                    NgayThem
                FROM AnhKhachSan
                WHERE MaKS = @MaKS AND IsActive = 1
                ORDER BY 
                    CASE WHEN LoaiAnh = 'main' THEN 1 ELSE 2 END,
                    ThuTu ASC,
                    NgayThem ASC
            `);

        // Tạo đường dẫn đầy đủ cho ảnh
        const images = imagesResult.recordset.map(img => ({
            ...img,
            FullPath: `${req.protocol}://${req.get('host')}/${img.DuongDanAnh}`
        }));

        // Phân loại ảnh
        const mainImage = images.find(img => img.LoaiAnh === 'main');
        const galleryImages = images.filter(img => img.LoaiAnh === 'gallery');

        res.json({
            success: true,
            data: {
                ...hotel,
                MainImage: mainImage ? mainImage.FullPath : null,
                GalleryImages: galleryImages,
                AllImages: images
            }
        });

    } catch (error) {
        console.error('Lỗi lấy thông tin khách sạn:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Hàm xóa ảnh khách sạn
exports.deleteHotelImage = async (req, res) => {
    try {
        const { MaAnh } = req.params;
        const pool = await poolPromise;
        const fs = require('fs').promises;
        const path = require('path');

        // Lấy thông tin ảnh trước khi xóa
        const imageResult = await pool.request()
            .input('MaAnh', sql.Int, parseInt(MaAnh))
            .query(`
                SELECT 
                    MaAnh, 
                    TenFile, 
                    DuongDanAnh, 
                    LoaiAnh, 
                    MaKS
                FROM AnhKhachSan 
                WHERE MaAnh = @MaAnh AND IsActive = 1
            `);

        if (imageResult.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy ảnh hoặc ảnh đã bị xóa' 
            });
        }

        const imageInfo = imageResult.recordset[0];

        // Kiểm tra xem có phải ảnh chính không
        if (imageInfo.LoaiAnh === 'main') {
            // Kiểm tra xem còn ảnh nào khác không
            const otherImagesResult = await pool.request()
                .input('MaKS', sql.Int, imageInfo.MaKS)
                .input('MaAnh', sql.Int, parseInt(MaAnh))
                .query(`
                    SELECT COUNT(*) as SoAnhKhac
                    FROM AnhKhachSan 
                    WHERE MaKS = @MaKS AND MaAnh != @MaAnh AND IsActive = 1
                `);

            if (otherImagesResult.recordset[0].SoAnhKhac > 0) {
                // Có ảnh khác, đặt ảnh đầu tiên làm main
                await pool.request()
                    .input('MaKS', sql.Int, imageInfo.MaKS)
                    .input('MaAnh', sql.Int, parseInt(MaAnh))
                    .query(`
                        UPDATE AnhKhachSan 
                        SET LoaiAnh = 'main' 
                        WHERE MaKS = @MaKS 
                        AND MaAnh != @MaAnh 
                        AND IsActive = 1
                        AND MaAnh = (
                            SELECT TOP 1 MaAnh 
                            FROM AnhKhachSan 
                            WHERE MaKS = @MaKS AND MaAnh != @MaAnh AND IsActive = 1
                            ORDER BY ThuTu ASC, NgayThem ASC
                        )
                    `);
            }
        }

        // Xóa record trong database (soft delete)
        await pool.request()
            .input('MaAnh', sql.Int, parseInt(MaAnh))
            .query(`
                UPDATE AnhKhachSan 
                SET IsActive = 0, NgayThem = GETDATE()
                WHERE MaAnh = @MaAnh
            `);

        // Xóa file vật lý
        try {
            const filePath = path.join(__dirname, '../../uploads/hotels', imageInfo.TenFile);
            await fs.access(filePath); // Kiểm tra file tồn tại
            await fs.unlink(filePath); // Xóa file
        } catch (fileError) {
            console.warn(`Không thể xóa file vật lý: ${imageInfo.TenFile}`, fileError);
            // Không return error vì database đã cập nhật thành công
        }

        res.json({
            success: true,
            message: 'Đã xóa ảnh thành công',
            data: {
                deletedImage: {
                    MaAnh: parseInt(MaAnh),
                    TenFile: imageInfo.TenFile,
                    WasMainImage: imageInfo.LoaiAnh === 'main'
                }
            }
        });

    } catch (error) {
        console.error('Lỗi deleteHotelImage:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi server khi xóa ảnh' 
        });
    }
};

// Hàm cập nhật thông tin ảnh
exports.updateHotelImage = async (req, res) => {
    try {
        const { MaAnh } = req.params;
        const { MoTa, ThuTu } = req.body;
        const pool = await poolPromise;

        // Kiểm tra ảnh tồn tại
        const imageCheck = await pool.request()
            .input('MaAnh', sql.Int, parseInt(MaAnh))
            .query(`
                SELECT MaAnh, MaKS 
                FROM AnhKhachSan 
                WHERE MaAnh = @MaAnh AND IsActive = 1
            `);

        if (imageCheck.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy ảnh' 
            });
        }

        // Chuẩn bị câu update
        const updateFields = [];
        const params = { MaAnh: parseInt(MaAnh) };

        if (MoTa !== undefined) {
            updateFields.push('MoTa = @MoTa');
            params.MoTa = MoTa;
        }

        if (ThuTu !== undefined && !isNaN(ThuTu)) {
            updateFields.push('ThuTu = @ThuTu');
            params.ThuTu = parseInt(ThuTu);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Không có thông tin nào để cập nhật' 
            });
        }

        updateFields.push('NgayThem = GETDATE()');

        // Thực hiện update
        const request = pool.request();
        Object.keys(params).forEach(key => {
            if (key === 'MaAnh' || key === 'ThuTu') {
                request.input(key, sql.Int, params[key]);
            } else {
                request.input(key, sql.NVarChar, params[key]);
            }
        });

        await request.query(`
            UPDATE AnhKhachSan 
            SET ${updateFields.join(', ')}
            WHERE MaAnh = @MaAnh
        `);

        // Lấy thông tin ảnh sau khi update
        const updatedImage = await pool.request()
            .input('MaAnh', sql.Int, parseInt(MaAnh))
            .query(`
                SELECT 
                    MaAnh,
                    TenFile,
                    DuongDanAnh,
                    LoaiAnh,
                    ThuTu,
                    MoTa,
                    NgayThem,
                    NgayThem
                FROM AnhKhachSan
                WHERE MaAnh = @MaAnh
            `);

        res.json({
            success: true,
            message: 'Đã cập nhật thông tin ảnh thành công',
            data: {
                ...updatedImage.recordset[0],
                FullPath: `${req.protocol}://${req.get('host')}/${updatedImage.recordset[0].DuongDanAnh}`
            }
        });

    } catch (error) {
        console.error('Lỗi updateHotelImage:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi server khi cập nhật ảnh' 
        });
    }
};

exports.getHotelWithImages = async (req, res) => {
    try {
        const { MaKS } = req.params;
        const pool = await poolPromise;

        // Lấy thông tin khách sạn
        const hotelResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT 
                    ks.*,
                    nd.HoTen as TenNguoiQuanLy
                FROM KhachSan ks
                LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
                WHERE ks.MaKS = @MaKS AND ks.IsActive = 1
            `);

        if (hotelResult.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy khách sạn' 
            });
        }

        const hotel = hotelResult.recordset[0];

        // Lấy ảnh khách sạn
        const imagesResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT 
                    MaAnh,
                    TenFile,
                    DuongDanAnh,
                    LoaiAnh,
                    ThuTu,
                    MoTa,
                    NgayThem
                FROM AnhKhachSan
                WHERE MaKS = @MaKS AND IsActive = 1
                ORDER BY 
                    CASE WHEN LoaiAnh = 'main' THEN 1 ELSE 2 END,
                    ThuTu ASC,
                    NgayThem ASC
            `);

        // Tạo đường dẫn đầy đủ cho ảnh
        const images = imagesResult.recordset.map(img => {
            return {
                ...img,
                FullPath: `${req.protocol}://${req.get('host')}/${img.DuongDanAnh}`
            };
        });

        // Phân loại ảnh
        const mainImage = images.find(img => img.LoaiAnh === 'main');
        const galleryImages = images.filter(img => img.LoaiAnh === 'gallery');

        res.json({
            success: true,
            data: {
                ...hotel,
                MainImage: mainImage ? mainImage.FullPath : null,
                GalleryImages: galleryImages,
                AllImages: images,
                TotalImages: images.length
            }
        });

    } catch (error) {
        console.error('Lỗi lấy thông tin khách sạn:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi server khi lấy thông tin khách sạn' 
        });
    }
};