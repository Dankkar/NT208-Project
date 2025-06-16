// Service tính toán giá phòng và dịch vụ
const moment = require('moment'); // Thư viện xử lý thời gian

/**
 * Class PriceCalculationService - Xử lý tất cả các tính toán liên quan đến giá
 * Bao gồm tính giá phòng, dịch vụ, áp dụng khuyến mãi, VAT
 */
class PriceCalculationService {
    /**
     * Tính số đêm ở giữa ngày check-in và check-out
     * @param {Date} checkIn - Ngày check-in (nhận phòng)
     * @param {Date} checkOut - Ngày check-out (trả phòng)
     * @returns {number} - Số đêm ở (số ngày chênh lệch)
     */
    static calculateNights(checkIn, checkOut) {
        // Sử dụng moment để tính số ngày chênh lệch
        return moment(checkOut).diff(moment(checkIn), 'days');
    }

    /**
     * Tính tổng giá phòng cơ bản (không bao gồm dịch vụ)
     * @param {number} basePrice - Giá phòng cơ bản theo đêm
     * @param {number} nights - Số đêm ở
     * @returns {number} - Tổng giá phòng (giá cơ bản × số đêm)
     */
    static calculateRoomPrice(basePrice, nights) {
        return basePrice * nights;
    }

    /**
     * Tính tổng giá dịch vụ đã đặt
     * @param {Array} services - Danh sách dịch vụ đã chọn
     * @param {number} nights - Số đêm ở (một số dịch vụ tính theo đêm)
     * @returns {number} - Tổng giá tất cả dịch vụ
     */
    static calculateServicesPrice(services, nights) {
        return services.reduce((total, service) => {
            // Hỗ trợ cả cấu trúc cũ và mới của database
            // GiaDV (từ database) hoặc price (từ frontend)
            const servicePrice = (service.GiaDV || service.price || 0);
            const quantity = service.quantity || 1; // Số lượng dịch vụ
            const serviceTotal = servicePrice * quantity;
            
            return total + serviceTotal;
        }, 0);
    }

    /**
     * Áp dụng mã khuyến mãi/ưu đãi vào tổng giá
     * @param {number} totalPrice - Tổng giá trước khi áp dụng ưu đãi
     * @param {Object} promotion - Thông tin mã khuyến mãi
     * @param {string} promotion.type - Loại khuyến mãi: 'PERCENTAGE' hoặc 'FIXED'
     * @param {number} promotion.value - Giá trị khuyến mãi (% hoặc số tiền cố định)
     * @returns {number} - Giá sau khi đã áp dụng ưu đãi
     */
    static applyPromotion(totalPrice, promotion) {
        // Nếu không có mã khuyến mãi, trả về giá gốc
        if (!promotion) return totalPrice;

        let discountAmount = 0;
        // Áp dụng khuyến mãi theo phần trăm
        if (promotion.type === 'PERCENTAGE') {
            discountAmount = totalPrice * (promotion.value / 100);
        } 
        // Áp dụng khuyến mãi số tiền cố định
        else if (promotion.type === 'FIXED') {
            discountAmount = promotion.value;
        }

        // Đảm bảo giá cuối không âm
        return Math.max(0, totalPrice - discountAmount);
    }

    /**
     * Tính tổng giá cuối cùng cho toàn bộ đặt phòng
     * Bao gồm: giá phòng + dịch vụ - khuyến mãi + VAT
     * @param {Object} bookingDetails - Chi tiết thông tin đặt phòng
     * @param {number} bookingDetails.basePrice - Giá phòng cơ bản theo đêm
     * @param {Date} bookingDetails.checkIn - Ngày check-in
     * @param {Date} bookingDetails.checkOut - Ngày check-out
     * @param {Array} bookingDetails.services - Danh sách dịch vụ đã chọn
     * @param {Object} bookingDetails.promotion - Thông tin mã khuyến mãi (optional)
     * @returns {Object} - Kết quả chi tiết tính giá với tất cả thông tin breakdown
     */
    static calculateTotalPrice(bookingDetails) {
        // Kiểm tra dữ liệu đầu vào
        if (!bookingDetails.basePrice || bookingDetails.basePrice <= 0) {
            throw new Error('Giá phòng cơ bản là bắt buộc và phải lớn hơn 0');
        }
        
        if (!bookingDetails.checkIn || !bookingDetails.checkOut) {
            throw new Error('Ngày check-in và check-out là bắt buộc');
        }

        // Tính toán từng phần
        const nights = this.calculateNights(bookingDetails.checkIn, bookingDetails.checkOut);
        const roomPrice = this.calculateRoomPrice(bookingDetails.basePrice, nights);
        const servicesPrice = this.calculateServicesPrice(bookingDetails.services || [], nights);
        
        // Log chi tiết để debug
        console.log('Chi tiết tính giá:', {
            nights,
            basePrice: bookingDetails.basePrice,
            roomPrice,
            servicesPrice,
            services: bookingDetails.services
        });
        
        // Tính tổng trước thuế và khuyến mãi
        const subtotal = roomPrice + servicesPrice;
        
        // Áp dụng khuyến mãi
        const subtotalAfterPromotion = this.applyPromotion(subtotal, bookingDetails.promotion);
        
        // Tính VAT 10%
        const vatAmount = subtotalAfterPromotion * 0.1;
        
        // Tổng giá cuối cùng
        const finalPrice = subtotalAfterPromotion + vatAmount;

        // Kiểm tra kết quả tính toán có hợp lệ không
        if (isNaN(finalPrice)) {
            console.error('Giá cuối cùng là NaN!', {
                roomPrice,
                servicesPrice,
                subtotal,
                promotion: bookingDetails.promotion
            });
            throw new Error('Không thể tính giá cuối cùng - kết quả không hợp lệ');
        }

        // Trả về chi tiết đầy đủ để frontend hiển thị breakdown
        return {
            nights,                    // Số đêm ở
            roomPrice,                 // Giá phòng
            servicesPrice,             // Giá dịch vụ
            subtotal,                  // Tổng trước khuyến mãi và VAT
            vatAmount,                 // Tiền thuế VAT
            finalPrice,                // Tổng cuối cùng
            promotion: bookingDetails.promotion ? {
                type: bookingDetails.promotion.type,
                value: bookingDetails.promotion.value,
                discountAmount: subtotal - subtotalAfterPromotion // Số tiền được giảm
            } : null
        };
    }
}

// Export class để sử dụng ở các controller khác
module.exports = PriceCalculationService; 