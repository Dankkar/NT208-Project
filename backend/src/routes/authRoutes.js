//backend/src/routes/authRoutes.js
// Routes xử lý các chức năng xác thực người dùng
const express = require('express');
const {check, validationResult} = require('express-validator'); // Validation middleware
const {
    register, 
    login, 
    forgotPassword, 
    resetPassword, 
    logout,
    googleLogin,
    changePassword,
    initializeGuestSession,
    checkEmailExists
} = require('../controllers/authController'); // Import các controller xác thực
const {authenticateToken} = require('../middlewares/auth'); // Middleware xác thực token

const router = express.Router();

// Route kiểm tra email đã tồn tại hay chưa (dùng khi đăng ký)
router.post('/check-email', checkEmailExists);

// Route đăng ký tài khoản mới
router.post(
    '/register',
    // Validation rules đã được comment để tạm thời bypass validation
    // Có thể uncomment khi cần validate nghiêm ngặt
    // [
    //     check('HoTen', 'Họ tên không được để trống').notEmpty(),
    //     check('Email', 'Email không hợp lệ').isEmail(),
    //     check('MatKhau', 'Mật khẩu tối thiểu 8 ký tự').isLength({ min: 8 }),
    //     check('SDT', 'Số điện thoại không hợp lệ')
    //         .matches(/^(84|0[3|5|7|8|9])+([0-9]{8})\b/)
    //         .withMessage('Số điện thoại phải đúng định dạng Việt Nam'),
    //     check('CCCD', 'CCCD không hợp lệ')
    //         .matches(/^[0-9]{12}$/)
    //         .withMessage('CCCD phải có 12 chữ số'),
    //     check('NgaySinh', 'Ngày sinh không hợp lệ')
    //         .optional()
    //         .isDate()
    //         .withMessage('Ngày sinh phải đúng định dạng YYYY-MM-DD'),
    //     check('GioiTinh', 'Giới tính không hợp lệ')
    //         .optional()
    //         .isIn(['Nam', 'Nữ', 'Khác'])
    //         .withMessage('Giới tính phải là Nam, Nữ hoặc Khác')
    // ],
    // Middleware xử lý lỗi validation
    // (req, res, next) => {
    //     const errs = validationResult(req);
    //     if(!errs.isEmpty())
    //         return res.status(400).json({errors: errs.array()});
    //     next();
    // },
    register // Controller xử lý đăng ký
);

// Route đăng nhập
router.post(
    '/login',
    [
        // Validation: Email phải đúng định dạng
        check('Email', 'Email không hợp lệ').isEmail(),
        // Validation: Mật khẩu không được để trống
        check('MatKhau', 'Mật khẩu không được để trống').notEmpty()
    ],
    // Middleware kiểm tra kết quả validation
    (req, res, next) => {
        const errs = validationResult(req);
        if(!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
        next();
    },
    login // Controller xử lý đăng nhập
);  

// Route quên mật khẩu (gửi email reset)
router.post(
    '/forgot-password',
    [
        // Validation: Email phải đúng định dạng
        check('Email', 'Email không hợp lệ').isEmail(),
    ],
    // Middleware kiểm tra validation
    (req, res, next) => {
        const errs = validationResult(req);
        if(!errs.isEmpty()) return res.status(400).json({errors: errs.array() });
        next();
    },
    forgotPassword // Controller xử lý gửi email reset
);

// Route đặt lại mật khẩu (từ link trong email)
router.put(
    '/reset-password',
    [
        // Validation: Token không được để trống
        check('token').notEmpty().withMessage('Token không được để trống'),
        // Validation: Mật khẩu mới tối thiểu 8 ký tự
        check('newPassword').isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự'),
    ],
    // Middleware kiểm tra validation
    (req, res, next) => {
        const errs = validationResult(req);
        if(!errs.isEmpty()) {
            return res.status(400).json({ errors: errs.array() });
        }
        next();
    },
    resetPassword // Controller xử lý reset mật khẩu
);

// Route đổi mật khẩu (yêu cầu đăng nhập)
router.put(
    '/change-password',
    authenticateToken, // Middleware xác thực: yêu cầu user đã đăng nhập
    [
        // Validation: Mật khẩu hiện tại không được để trống
        check('currentPassword', 'Mật khẩu hiện tại không được để trống').notEmpty(),
        // Validation: Mật khẩu mới tối thiểu 8 ký tự
        check('newPassword', 'Mật khẩu mới tối thiểu 8 ký tự').isLength({ min: 8 }),
    ],
    // Middleware kiểm tra validation
    (req, res, next) => {
        const errs = validationResult(req);
        if(!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
        next();
    },
    changePassword // Controller xử lý đổi mật khẩu
);

// Route đăng xuất (hủy session và cookie)
router.post('/logout', logout);

// Route đăng nhập bằng Google OAuth
router.post('/google', googleLogin);

// Route khởi tạo session cho guest user (không yêu cầu đăng nhập)
router.get('/init-session', initializeGuestSession);

// Export router để sử dụng trong app chính
module.exports = router;