const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authenticateToken = (req, res, next) => {
    // Lấy token từ header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Không tìm thấy token xác thực' 
        });
    }

    try {
        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu thông tin user vào request
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
    if (req.user && req.user.role === 'admin') {
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
    if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
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