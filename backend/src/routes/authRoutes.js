//backend/src/routes/authRoutes.js
const express = require('express');
const {check, validationResult} = require('express-validator');
const {register} = require('../controllers/authController');
const router = express.Router();

router.post(
    '/register',
    [
        check('HoTen', 'Họ tên không được để trống').notEmpty(),,
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

module.exports = router;