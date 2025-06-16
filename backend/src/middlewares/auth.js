// backend/src/middlewares/auth.js
// Middleware xử lý xác thực và phân quyền người dùng
const jwt = require('jsonwebtoken'); // Thư viện xử lý JWT token

/**
 * Middleware xác thực token bắt buộc
 * Kiểm tra xem người dùng có JWT token hợp lệ trong cookie không
 * Nếu có token hợp lệ, thêm thông tin user vào req.user
 * Nếu không có token hoặc token không hợp lệ, trả về lỗi 401/403
 * 
 * @param {Object} req - Request object từ Express
 * @param {Object} res - Response object từ Express  
 * @param {Function} next - Function để chuyển sang middleware tiếp theo
 */
const authenticateToken = (req, res, next) => {
    // Lấy token từ cookie có tên 'access_token'
    const token = req.cookies?.access_token;

    // Nếu không có token, trả về lỗi unauthorized
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Không tìm thấy token xác thực trong cookie' 
        });
    }

    try {
        // Xác thực và giải mã token bằng JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lưu thông tin user đã giải mã vào req.user để sử dụng ở middleware/controller khác
        req.user = decoded;
        console.log('Thông tin user từ token:', decoded);
        
        // Chuyển sang middleware/controller tiếp theo
        next();
    } catch (error) {
        // Token không hợp lệ hoặc đã hết hạn
        return res.status(403).json({ 
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn' 
        });
    }
};

/**
 * Middleware kiểm tra quyền admin
 * Chỉ cho phép user có role 'Admin' tiếp tục
 * Phải sử dụng sau authenticateToken để có req.user
 * 
 * @param {Object} req - Request object (phải có req.user từ authenticateToken)
 * @param {Object} res - Response object từ Express
 * @param {Function} next - Function để chuyển sang middleware tiếp theo
 */
const isAdmin = (req, res, next) => {
    // Kiểm tra xem user có role Admin không
    if (req.user && req.user.role === 'Admin') {
        next(); // Có quyền admin, cho phép tiếp tục
    } else {
        // Không có quyền admin, từ chối truy cập
        res.status(403).json({ 
            success: false,
            message: 'Không có quyền truy cập - Chỉ Admin mới có quyền' 
        });
    }
};

/**
 * Middleware kiểm tra quyền nhân viên (staff)
 * Cho phép user có role 'QuanLyKS' hoặc 'Admin' tiếp tục
 * Phải sử dụng sau authenticateToken để có req.user
 * 
 * @param {Object} req - Request object (phải có req.user từ authenticateToken)
 * @param {Object} res - Response object từ Express
 * @param {Function} next - Function để chuyển sang middleware tiếp theo
 */
const isStaff = (req, res, next) => {
    // Kiểm tra xem user có role QuanLyKS hoặc Admin không
    if (req.user && (req.user.role === 'QuanLyKS' || req.user.role === 'Admin')) {
        next(); // Có quyền staff, cho phép tiếp tục
    } else {
        // Không có quyền staff, từ chối truy cập
        res.status(403).json({ 
            success: false,
            message: 'Không có quyền truy cập - Chỉ nhân viên và Admin mới có quyền' 
        });
    }
};

/**
 * Middleware xác thực token tùy chọn (optional)
 * Không bắt buộc phải có token, nếu có token hợp lệ thì set req.user
 * Nếu không có token hoặc token không hợp lệ thì vẫn cho phép tiếp tục (guest user)
 * Thường dùng cho các API mà cả guest và authenticated user đều có thể truy cập
 * 
 * @param {Object} req - Request object từ Express
 * @param {Object} res - Response object từ Express
 * @param {Function} next - Function để chuyển sang middleware tiếp theo
 */
function optionalAuthenticationToken(req, res, next){
    // Lấy token từ cookie
    const token = req.cookies?.access_token;
    
    // Nếu không có token, coi như guest user và tiếp tục
    if(!token) return next();

    // Nếu có token, thử xác thực
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        // Nếu token hợp lệ, set req.user
        if(!err) req.user = user;
        
        // Dù token có hợp lệ hay không cũng cho phép tiếp tục
        // Controller sẽ tự kiểm tra req.user để xử lý logic phù hợp
        return next();
    });
}

// Export tất cả middleware để sử dụng ở routes
module.exports = {
    authenticateToken,           // Xác thực bắt buộc
    isAdmin,                    // Kiểm tra quyền Admin
    isStaff,                    // Kiểm tra quyền Staff
    optionalAuthenticationToken // Xác thực tùy chọn
}; 