const rateLimit = require('express-rate-limit');

const LocationSuggestLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 36,
    message: {
        success: false,
        error: 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng thử lại sau.'
    }
}); 

module.exports = { LocationSuggestLimiter };