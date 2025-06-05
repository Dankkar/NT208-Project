// src/store/bookingHistoryStore.js
import { defineStore } from 'pinia';
import axios from 'axios'; // Import axios trực tiếp

const API_BASE_URL = 'http://localhost:5000'; // URL gốc của backend của bạn

export const useBookingHistoryStore = defineStore('bookingHistory', {
  state: () => ({
    bookings: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    allBookings: (state) => state.bookings,
    hasBookings: (state) => state.bookings.length > 0,
    isLoadingHistory: (state) => state.isLoading,
    getHistoryError: (state) => state.error,
  },

  actions: {
    async fetchBookingHistory() {
      console.log('Attempting to fetch booking history...');
      this.isLoading = true;
      this.error = null;

      try {
        const response = await axios.get(`${API_BASE_URL}/api/bookings/my-bookings`, {
          withCredentials: true,
        });

        if (response.data && response.data.success) {
          // API đã trả về AnhKhachSanUrl và AnhLoaiPhongUrl là URL đầy đủ
          this.bookings = response.data.data || [];
          console.log(`Successfully fetched ${this.bookings.length} bookings.`);
          console.log("Response data:", response.data.data)
        } else {
          this.error = response.data.message || 'Không thể tải lịch sử đặt phòng.';
          this.bookings = [];
          console.error('API indicated failure fetching booking history:', this.error);
        }
      } catch (err) {
        console.error('Network or server error fetching booking history:', err);
        if (err.response) {
          if (err.response.status === 401) {
            this.error = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
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

    async cancelBooking({ bookingId, reason = 'Khách hàng yêu cầu hủy trực tuyến' }) {
      console.log(`Store action: Attempting to cancel booking ID ${bookingId}`);
      let success = false;
      let message = '';
      let errorMsg = null;

      try {
        const response = await axios.put(`${API_BASE_URL}/api/bookings/${bookingId}`,
          { LyDoHuy: reason },
          { withCredentials: true }
        );

        if (response.data && response.data.message && response.data.message.toLowerCase().includes('hủy đơn thành công')) {
          success = true;
          message = response.data.message;
          const index = this.bookings.findIndex(b => b.MaDat === bookingId || b.MaDat === parseInt(bookingId));
          if (index !== -1) {
            this.bookings[index].TrangThaiBooking = 'Đã hủy';
            if (response.data.TienHoanTra !== undefined) {
              this.bookings[index].TienHoanTra = response.data.TienHoanTra;
            }
            if (response.data.refundPolicy !== undefined) {
              this.bookings[index].refundPolicyMessage = response.data.refundPolicy;
              message += ` (${response.data.refundPolicy}, Hoàn tiền: ${response.data.TienHoanTra !== undefined ? response.data.TienHoanTra : 'N/A'})`;
            }
          } else {
             console.warn(`Booking ID ${bookingId} not found in local list after cancellation.`);
          }
          console.log(`Booking ID ${bookingId} cancelled successfully. Message: ${message}`);
        } else {
          errorMsg = response.data.error || response.data.message || 'Không thể hủy đặt phòng từ API.';
          message = errorMsg;
          console.error('API indicated failure during cancellation:', errorMsg);
        }
      } catch (err) {
        console.error('Network or server error during cancellation:', err);
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

    clearHistoryError() {
      this.error = null;
    },
  },
});