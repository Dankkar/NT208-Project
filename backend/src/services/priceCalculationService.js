const moment = require('moment');

class PriceCalculationService {
    /**
     * Tính số đêm ở
     * @param {Date} checkIn - Ngày check-in
     * @param {Date} checkOut - Ngày check-out
     * @returns {number} - Số đêm
     */
    static calculateNights(checkIn, checkOut) {
        return moment(checkOut).diff(moment(checkIn), 'days');
    }

    /**
     * Tính giá phòng cơ bản
     * @param {number} basePrice - Giá phòng cơ bản
     * @param {number} nights - Số đêm
     * @returns {number} - Tổng giá phòng
     */
    static calculateRoomPrice(basePrice, nights) {
        return basePrice * nights;
    }

    /**
     * Tính giá dịch vụ
     * @param {Array} services - Danh sách dịch vụ
     * @param {number} nights - Số đêm
     * @returns {number} - Tổng giá dịch vụ
     */
    static calculateServicesPrice(services, nights) {
        return services.reduce((total, service) => {
            // Support both old structure and new database structure
            const servicePrice = (service.GiaDV || service.price || 0);
            const quantity = service.quantity || 1;
            const serviceTotal = servicePrice * quantity;
            
            return total + serviceTotal;
        }, 0);
    }

    /**
     * Tính giá sau khi áp dụng ưu đãi
     * @param {number} totalPrice - Tổng giá trước khi áp dụng ưu đãi
     * @param {Object} promotion - Thông tin ưu đãi
     * @returns {number} - Giá sau khi áp dụng ưu đãi
     */
    static applyPromotion(totalPrice, promotion) {
        if (!promotion) return totalPrice;

        let discountAmount = 0;
        if (promotion.type === 'PERCENTAGE') {
            discountAmount = totalPrice * (promotion.value / 100);
        } else if (promotion.type === 'FIXED') {
            discountAmount = promotion.value;
        }

        return Math.max(0, totalPrice - discountAmount);
    }

    /**
     * Tính tổng giá đặt phòng
     * @param {Object} bookingDetails - Chi tiết đặt phòng
     * @param {number} bookingDetails.basePrice - Giá phòng cơ bản
     * @param {Date} bookingDetails.checkIn - Ngày check-in
     * @param {Date} bookingDetails.checkOut - Ngày check-out
     * @param {Array} bookingDetails.services - Danh sách dịch vụ
     * @param {Object} bookingDetails.promotion - Thông tin ưu đãi
     * @returns {Object} - Kết quả tính giá
     */
    static calculateTotalPrice(bookingDetails) {
        // Validation
        if (!bookingDetails.basePrice || bookingDetails.basePrice <= 0) {
            throw new Error('Base price is required and must be greater than 0');
        }
        
        if (!bookingDetails.checkIn || !bookingDetails.checkOut) {
            throw new Error('Check-in and check-out dates are required');
        }

        const nights = this.calculateNights(bookingDetails.checkIn, bookingDetails.checkOut);
        const roomPrice = this.calculateRoomPrice(bookingDetails.basePrice, nights);
        const servicesPrice = this.calculateServicesPrice(bookingDetails.services || [], nights);
        
        console.log('Price calculation breakdown:', {
            nights,
            basePrice: bookingDetails.basePrice,
            roomPrice,
            servicesPrice,
            services: bookingDetails.services
        });
        
        const subtotal = roomPrice + servicesPrice;
        const finalPrice = this.applyPromotion(subtotal, bookingDetails.promotion);

        // Ensure final price is not NaN
        if (isNaN(finalPrice)) {
            console.error('Final price is NaN!', {
                roomPrice,
                servicesPrice,
                subtotal,
                promotion: bookingDetails.promotion
            });
            throw new Error('Failed to calculate final price - result is NaN');
        }

        return {
            nights,
            roomPrice,
            servicesPrice,
            subtotal,
            finalPrice,
            promotion: bookingDetails.promotion ? {
                type: bookingDetails.promotion.type,
                value: bookingDetails.promotion.value,
                discountAmount: subtotal - finalPrice
            } : null
        };
    }
}

module.exports = PriceCalculationService; 