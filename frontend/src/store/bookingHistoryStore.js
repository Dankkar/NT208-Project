// src/store/bookingHistoryStore.js
import { defineStore } from 'pinia';
import axios from 'axios'; // Import axios trực tiếp

const API_BASE_URL = 'http://localhost:5000'; // URL gốc của backend của bạn

/**
 * Store quản lý lịch sử đặt phòng
 * Chức năng chính:
 * - Lấy danh sách booking của user
 * - Hủy booking với lý do
 * - Quản lý pagination cho danh sách lớn
 * - Xử lý loading states và error handling
 */
export const useBookingHistoryStore = defineStore('bookingHistory', {
  state: () => ({
    bookings: [],                 // Danh sách booking của user
    isLoading: false,             // Trạng thái loading khi fetch data
    error: null,                  // Lỗi khi thực hiện các operations
    pagination: {                 // Thông tin phân trang
      total: 0,                   // Tổng số booking
      page: 1,                    // Trang hiện tại
      limit: 10,                  // Số booking mỗi trang
      totalPages: 0,              // Tổng số trang
      hasNextPage: false,         // Có trang tiếp theo
      hasPrevPage: false          // Có trang trước đó
    },
  }),

  getters: {
    // Getter truy xuất danh sách booking
    allBookings: (state) => state.bookings,
    
    // Kiểm tra có booking nào không
    hasBookings: (state) => state.bookings.length > 0,
    
    // Trạng thái loading
    isLoadingHistory: (state) => state.isLoading,
    
    // Lỗi hiện tại
    getHistoryError: (state) => state.error,
    
    // Thông tin pagination
    getPagination: (state) => state.pagination,
    getCurrentPage: (state) => state.pagination.page,
    getTotalPages: (state) => state.pagination.totalPages,
    getHasNextPage: (state) => state.pagination.hasNextPage,
    getHasPrevPage: (state) => state.pagination.hasPrevPage,
  },

  actions: {
    /**
     * Lấy lịch sử đặt phòng của user hiện tại
     * @param {number} page - Trang cần load (default: trang hiện tại)
     * @param {number} limit - Số booking mỗi trang (default: limit hiện tại)
     * @returns {Promise} Kết quả fetch data
     */
    async fetchBookingHistory(page = null, limit = null) {
      console.log('Đang tải lịch sử đặt phòng...');
      const currentPage = page || this.pagination.page;
      const currentLimit = limit || this.pagination.limit;
      
      this.isLoading = true;
      this.error = null;

      try {
        // Call API my-bookings với pagination
        const response = await axios.get(`${API_BASE_URL}/api/bookings/my-bookings`, {
          params: {
            page: currentPage,
            limit: currentLimit
          },
          withCredentials: true,        // Gửi kèm cookie session/auth
        });

        if (response.data && response.data.success) {
          // API trả về URL ảnh đầy đủ (AnhKhachSanUrl, AnhLoaiPhongUrl)
          this.bookings = response.data.data || [];
          this.pagination = response.data.pagination || this.pagination;
          console.log(`Đã tải thành công ${this.bookings.length} booking trang ${currentPage}.`);
          console.log("Thông tin pagination:", response.data.pagination);
        } else {
          this.error = response.data.message || 'Không thể tải lịch sử đặt phòng.';
          this.bookings = [];
          console.error('API báo lỗi khi tải lịch sử:', this.error);
        }
      } catch (err) {
        console.error('Lỗi network/server khi tải lịch sử:', err);
        
        // Xử lý các loại lỗi khác nhau
        if (err.response) {
          if (err.response.status === 401) {
            this.error = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
            // TODO: Có thể tự động logout user
            // import { useAuthStore } from './authStore';
            // const authStore = useAuthStore();
            // authStore.logout();
          } else {
            this.error = err.response.data?.message || err.response.data?.error || `Lỗi ${err.response.status}: Không thể tải dữ liệu.`;
          }
        } else if (err.request) {
          this.error = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
        } else {
          this.error = err.message || 'Đã có lỗi không xác định xảy ra.';
        }
        this.bookings = [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Hủy booking với lý do cụ thể
     * @param {Object} params - Tham số hủy booking
     * @param {number} params.bookingId - ID booking cần hủy
     * @param {string} params.reason - Lý do hủy (default: "Khách hàng yêu cầu hủy trực tuyến")
     * @returns {Object} Kết quả: { success, message, error }
     */
    async cancelBooking({ bookingId, reason = 'Khách hàng yêu cầu hủy trực tuyến' }) {
      console.log(`Store: Đang hủy booking ID ${bookingId}`);
      let success = false;
      let message = '';
      let errorMsg = null;

      try {
        // Call API hủy booking
        const response = await axios.put(`${API_BASE_URL}/api/bookings/${bookingId}`,
          { LyDoHuy: reason },
          { withCredentials: true }
        );

        if (response.data && response.data.message && response.data.message.toLowerCase().includes('hủy đơn thành công')) {
          success = true;
          message = response.data.message;
          
          // Cập nhật trạng thái booking trong store
          const index = this.bookings.findIndex(b => b.MaDat === bookingId || b.MaDat === parseInt(bookingId));
          if (index !== -1) {
            this.bookings[index].TrangThaiBooking = 'Đã hủy';
            
            // Cập nhật thông tin hoàn tiền nếu có
            if (response.data.TienHoanTra !== undefined) {
              this.bookings[index].TienHoanTra = response.data.TienHoanTra;
            }
            
            // Thêm thông tin chính sách hoàn tiền
            if (response.data.refundPolicy !== undefined) {
              this.bookings[index].refundPolicyMessage = response.data.refundPolicy;
              message += ` (${response.data.refundPolicy}, Hoàn tiền: ${response.data.TienHoanTra !== undefined ? response.data.TienHoanTra : 'N/A'})`;
            }
          } else {
             console.warn(`Không tìm thấy booking ID ${bookingId} trong danh sách local sau khi hủy.`);
          }
          console.log(`Hủy booking ID ${bookingId} thành công. Thông báo: ${message}`);
        } else {
          errorMsg = response.data.error || response.data.message || 'Không thể hủy đặt phòng từ API.';
          message = errorMsg;
          console.error('API báo lỗi khi hủy:', errorMsg);
        }
      } catch (err) {
        console.error('Lỗi network/server khi hủy booking:', err);
        
        // Xử lý các loại lỗi
        if (err.response) {
          errorMsg = err.response.data?.error || err.response.data?.message || `Lỗi ${err.response.status} khi hủy đặt phòng.`;
        } else if (err.request) {
          errorMsg = 'Không thể kết nối máy chủ để hủy đặt phòng.';
        } else {
          errorMsg = err.message || 'Lỗi không xác định khi hủy đặt phòng.';
        }
        message = errorMsg;
      }
      
      return { success, message, error: errorMsg };
    },

    /**
     * Xóa lỗi hiện tại
     */
    clearHistoryError() {
      this.error = null;
    },

    // === PAGINATION ACTIONS ===
    
    /**
     * Chuyển đến trang cụ thể
     * @param {number} page - Số trang cần chuyển đến
     */
    async goToPage(page) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        await this.fetchBookingHistory(page);
      }
    },

    /**
     * Chuyển đến trang tiếp theo
     */
    async nextPage() {
      if (this.pagination.hasNextPage) {
        await this.fetchBookingHistory(this.pagination.page + 1);
      }
    },

    /**
     * Chuyển về trang trước đó
     */
    async prevPage() {
      if (this.pagination.hasPrevPage) {
        await this.fetchBookingHistory(this.pagination.page - 1);
      }
    },

    /**
     * Thay đổi số lượng booking mỗi trang
     * @param {number} newLimit - Số booking mỗi trang mới
     */
    async changeLimit(newLimit) {
      this.pagination.limit = newLimit;
      await this.fetchBookingHistory(1, newLimit); // Reset về trang 1 khi thay đổi limit
    },
  },
});