// backend/src/middlewares/auth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authenticateToken = (req, res, next) => {
    const token = req.cookies?.access_token;

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Không tìm thấy token xác thực trong cookie' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn' 
        });
    }
};

/**
 * Middleware kiểm tra quyền admin
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Không có quyền truy cập' 
        });
    }
};

/**
 * Middleware kiểm tra quyền nhân viên
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const isStaff = (req, res, next) => {
    if (req.user && (req.user.role === 'QuanLyKS' || req.user.role === 'Admin')) {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Không có quyền truy cập' 
        });
    }
};

module.exports = {
    authenticateToken,
    isAdmin,
    isStaff
}; 