const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

//Tạo thư mục nếu chưa tồn tại
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};
//Cấu hình storage cho ảnh khách sạn KHI TẠO MỚI (chưa có MaKS)
const hotelCreateStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Tạo thư mục temp để lưu ảnh tạm thời khi tạo mới khách sạn
        const tempPath = path.join(__dirname, '../../uploads/temp/hotels');
        ensureDirectoryExists(tempPath);
        cb(null, tempPath);
    },
    filename: function(req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `hotel_temp_${uuidv4()}_${Date.now()}${fileExtension}`;
        cb(null, fileName);
    }
});

//Cấu hình storage cho ảnh khách sạn
const hotelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const hotelId = req.params.MaKS || req.body.MaKS;
        if(!hotelId) {
            return cb(new Error('Không tìm thấy mã khách sạn'), null);
        }
        const uploadPath = path.join(__dirname, `../../uploads/hotels/${hotelId}`);
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `hotel_${uuidv4()}_${Date.now()}${fileExtension}`;
        cb(null, fileName);
    }
});

const roomTypeStorage = multer.diskStorage({
    //Lay MaKS tu params hoac body, hoac tu db
    destination: (req, file, cb) => {
        let hotelId = req.params.MaKS || req.body.MaKS;

        if(!hotelId && req.params.MaLoaiPhong) {
            //xu ly trong controller, dung tam temp
            const tempPath = path.join(__dirname, '../../uploads/temp');
            ensureDirectoryExists(tempPath);
            return cb(null, tempPath);
        }

        if (!hotelId) {
            return cb(new Error('Không tìm thấy mã khách sạn'), null);
        }
        const uploadPath = path.join(__dirname, `../../uploads/hotels/${hotelId}/room-types`);
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `room_type_${uuidv4()}_${Date.now()}${fileExtension}`;
        cb(null, fileName);
    }
});

//Kiểm tra file type
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh'), false);
    }
};
// Cấu hình multer cho TẠO MỚI khách sạn
const uploadHotelImagesCreate = multer({
    storage: hotelCreateStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 25, // 5MB
        files: 10
    }
});
// Cấu hình multer
const uploadHotelImages = multer({
    storage: hotelStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 25, // 5MB
        files: 10
    }
});

const uploadRoomTypeImage = multer({
    storage: roomTypeStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 25, // 3MB
        files: 1
    }
});

module.exports = {
    uploadHotelImages,
    uploadHotelImagesCreate,
    uploadRoomTypeImage
};