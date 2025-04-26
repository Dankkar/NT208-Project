//backend/src/routes/authRoutes.js
const express = require('express');
const {check, validationResult} = require('express-validator');
const {register, forgotPassword, resetPassword} = require('../controllers/authController');

const router = express.Router();

// Dang ky
router.post(
    '/register',
    [
        check('HoTen', 'Họ tên không được để trống').notEmpty(),
        check('Email', 'Email không hợp lệ').isEmail(),
        check('MatKhau', 'Mật khẩu tối thiểu 8 ký tự').isLength({ min: 8 }),    
        
    ],
    (req, res, next) => {
        const errs = validationResult(req);
        if(!errs.isEmpty())
            return res.status(400).json({errors: errs.array()});
        next();
    },
    register
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
        check('token', 'Token khong duoc de trong').notEmpty(),
        check('newPassword', 'Mat khau toi thieu 8 ky tu').isLength({ min: 8}),
    ],
    (req, res, next) => {
        const errs = validationResult(req);
        if(!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
        next();
    },
    resetPassword
);

module.exports = router;