//backend/src/routes/authRoutes.js
const express = require('express');
const {check, validationResult} = require('express-validator');
const {
    register, 
    login, 
    forgotPassword, 
    resetPassword, 
    logout,
    googleLogin,
    changePassword,
    initializeGuestSession
} = require('../controllers/authController');
const {authenticateToken} = require('../middlewares/auth');

const router = express.Router();

// Dang ky
router.post(
    '/register',
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
    // (req, res, next) => {
    //     const errs = validationResult(req);
    //     if(!errs.isEmpty())
    //         return res.status(400).json({errors: errs.array()});
    //     next();
    // },
    register
);

// Dang nhap 
router.post(
    '/login',
    [
        check('Email', 'Email không hợp lệ').isEmail(),
        check('MatKhau', 'Mật khẩu không được để trống').notEmpty()
    ],
    (req, res, next) => {
        const errs = validationResult(req);
        if(!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
        next();
    },
    login
);  


// Quen mat khau
router.post(
    '/forgot-password',
    [
        check('Email', 'Email khong hop le').isEmail(),
    ],
    (req, res, next) => {
        const errs = validationResult(req);
        if(!errs.isEmpty()) return res.status(400).json({errors: errs.array() });
        next();
    },
    forgotPassword
);

// Dat lai mat khau
router.put(
    '/reset-password',
    [
        check('token').notEmpty().withMessage('Token khong duoc de trong'),
        check('newPassword').isLength({ min: 8 }).withMessage('Mat khau toi thieu 8 ky tu'),
    ],
    (req, res, next) => {
        const errs = validationResult(req);
        if(!errs.isEmpty()) {
            return res.status(400).json({ errors: errs.array() });
        }
        next();
    },
    resetPassword
);

// Doi mat khau
router.put(
    '/change-password',
    authenticateToken,
    [
        check('currentPassword', 'Mật khẩu hiện tại không được để trống').notEmpty(),
        check('newPassword', 'Mật khẩu mới tối thiểu 8 ký tự').isLength({ min: 8 }),
    ],
    (req, res, next) => {
        const errs = validationResult(req);
        if(!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
        next();
    },
    changePassword
);
 // Đăng xuất
router.post('/logout', logout);

//Đăng nhập bằng google
router.post('/google', googleLogin);

// In authRoutes.js
router.get('/init-session', initializeGuestSession);

module.exports = router;