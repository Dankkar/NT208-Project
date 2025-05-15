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
            const servicePrice = service.price * (service.isPerNight ? nights : 1);
            return total + servicePrice;
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
        const nights = this.calculateNights(bookingDetails.checkIn, bookingDetails.checkOut);
        const roomPrice = this.calculateRoomPrice(bookingDetails.basePrice, nights);
        const servicesPrice = this.calculateServicesPrice(bookingDetails.services || [], nights);
        
        const subtotal = roomPrice + servicesPrice;
        const finalPrice = this.applyPromotion(subtotal, bookingDetails.promotion);

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