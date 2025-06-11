// src/store/authStore.js
// Pinia store quản lý trạng thái xác thực người dùng
import { defineStore } from 'pinia'; // Pinia store definition
import axios from 'axios'; // HTTP client để gọi API

/**
 * Auth Store - Quản lý toàn bộ trạng thái xác thực của ứng dụng
 * Bao gồm: đăng nhập, đăng ký, đăng xuất, Google login, session management
 */
export const useAuthStore = defineStore('auth', {
  // Định nghĩa state reactive của store
  state: () => ({
    user: null,          // Thông tin người dùng hiện tại (null nếu chưa đăng nhập)
    authError: null,     // Lỗi xác thực (hiển thị cho user)
    isLoading: false,    // Trạng thái loading khi đang xử lý auth operations
  }),

  // Các computed properties (getters) để truy cập state
  getters: {
    // Kiểm tra user đã đăng nhập chưa (có user data không)
    isAuthenticated: (state) => !!state.user,
    
    // Lấy thông tin user hiện tại
    currentUser: (state) => state.user,
    
    // Kiểm tra có đang loading auth operation không
    isLoadingAuth: (state) => state.isLoading,
    
    // Lấy lỗi auth hiện tại
    getAuthError: (state) => state.authError,
  },

  // Các actions để thay đổi state
  actions: {
    /**
     * Xóa lỗi xác thực và reset loading state
     * Dùng để clear error messages khi user thực hiện action mới
     */
    clearError() {
      console.log("Xóa lỗi xác thực");
      this.isLoading = false;
      this.authError = null;
    },

    /**
     * Xóa toàn bộ dữ liệu xác thực
     * Dùng khi logout hoặc khi session hết hạn
     */
    clearAuthData() {
      console.log("Xóa toàn bộ dữ liệu xác thực");
      this.user = null;
      this.authError = null;
      this.isLoading = false;
    },

    /**
     * Đăng nhập bằng email và mật khẩu
     * @param {Object} credentials - Thông tin đăng nhập
     * @param {string} credentials.Email - Email người dùng
     * @param {string} credentials.MatKhau - Mật khẩu
     * @returns {Promise<Object>} Kết quả đăng nhập {success, message?}
     */
    async login(credentials) {
      console.log("Đang thực hiện đăng nhập với thông tin đăng nhập:")
      this.isLoading = true;
      this.authError = null;
      
      try {
        // Gọi API đăng nhập với credentials
        await axios.post('http://localhost:5000/api/auth/login', {
          Email: credentials.Email,
          MatKhau: credentials.MatKhau
        }, { withCredentials: true }); // Quan trọng: gửi và nhận cookie
        
        // Sau khi login thành công, lấy thông tin user
        await this.fetchCurrentUser();
        
        // Kiểm tra xem có lấy được user data không
        if (!this.user) {
          console.error("Đăng nhập thành công nhưng không lấy được thông tin user.");
          throw new Error("Đăng nhập thành công nhưng không lấy được thông tin user.");
        }
        
        return { success: true };
      } catch (err) {
        // Xử lý lỗi đăng nhập
        const errorMessage = err.response?.data?.message || 'Đăng nhập thất bại.';
        this.$patch({ user: null, authError: errorMessage });
        return { success: false, message: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Đăng nhập bằng Google OAuth
     * @param {Object} googleAuthResponse - Response từ Google OAuth
     * @param {string} googleAuthResponse.credential - JWT token từ Google
     * @returns {Promise<Object>} Kết quả đăng nhập Google {success, message?}
     */
    async loginWithGoogle(googleAuthResponse) {
      console.log("Đang thực hiện đăng nhập bằng Google:")
      this.isLoading = true;
      this.authError = null;
      
      try {
        // Gửi Google token đến backend để xác thực
        const backendResponse = await axios.post('http://localhost:5000/api/auth/google',
          { token: googleAuthResponse.credential },
          { withCredentials: true }
        );
        
        // Kiểm tra response từ backend
        if (!backendResponse.data || !backendResponse.data.success) {
          throw new Error(backendResponse.data.message || "Đăng nhập Google với backend thất bại.");
        }
        
        // Lấy thông tin user sau khi đăng nhập Google thành công
        await this.fetchCurrentUser();
        
        if (!this.user) {
          throw new Error("Đăng nhập Google thành công nhưng không lấy được thông tin user.");
        }
        
        return { success: true };
      } catch (err) {
        // Xử lý lỗi đăng nhập Google
        const errorMessage = err.response?.data?.message || err.message || 'Đăng nhập Google thất bại.';
        this.$patch({ user: null, authError: errorMessage });
        return { success: false, message: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Lấy thông tin user hiện tại từ server (sử dụng cookie session)
     * Dùng để verify session và cập nhật user data
     * @returns {Promise<Object|null>} Thông tin user hoặc null nếu không authenticated
     */
    async fetchCurrentUser() {
      console.log("Đang lấy thông tin user hiện tại...");
      console.log("isAuthenticated:", this.isAuthenticated);
      this.isLoading = true;
      this.authError = null;
      
      try {
        // Gọi API lấy thông tin user (sử dụng cookie để xác thực)
        const response = await axios.get('http://localhost:5000/api/users/me', { withCredentials: true });
        
        // Cập nhật user data vào store
        this.$patch({ user: response.data });
        return this.user;
      } catch (err) {
        // Xử lý lỗi khi lấy user data
        this.$patch({ user: null });
        
        if (err.response?.status === 401) { 
          // 401 = Unauthorized: session hết hạn hoặc không có session
          this.authError = 'Session đã hết hạn hoặc chưa đăng nhập.';
          this.isLoading = false;
        } else { 
          // Lỗi khác: không hiển thị error message
          this.authError = null;
          this.isLoading = false;
        }
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Đăng xuất người dùng
     * Gọi API logout trên server và clear local data
     */
    async logout() {
      console.log("Đang thực hiện đăng xuất...");
      this.isLoading = true;
      
      try {
        // Gọi API logout để hủy session trên server
        await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      } catch (err) {
        console.error('Lỗi khi đăng xuất:', err);
        // Vẫn tiếp tục logout local ngay cả khi server logout thất bại
      } finally {
        // Xóa toàn bộ dữ liệu local
        this.clearAuthData();
      }
    },

    /**
     * Khởi tạo auth store khi app start
     * Kiểm tra xem có user data persist không và verify với server
     */
    initializeAuth() {
      console.log("Đang khởi tạo auth store...");
      
      if (this.user) { 
        // Nếu có user data từ localStorage (persist), verify với server
        this.fetchCurrentUser();
      }
      else {
        // Nếu không có user data, clear tất cả
        this.clearError();
        this.clearAuthData();
      }
    },

    /**
     * Đăng ký tài khoản mới
     * @param {Object} signupData - Dữ liệu đăng ký
     * @param {string} signupData.HoTen - Họ tên
     * @param {string} signupData.Email - Email
     * @param {string} signupData.MatKhau - Mật khẩu
     * @param {string} signupData.SDT - Số điện thoại
     * @param {string} signupData.NgaySinh - Ngày sinh (optional)
     * @param {string} signupData.GioiTinh - Giới tính (optional)
     * @param {string} signupData.CCCD - Số CCCD
     * @returns {Promise<Object>} Kết quả đăng ký {success, message?}
     */
    async signup(signupData) {
      console.log("Đang thực hiện đăng ký với dữ liệu:")
      this.isLoading = true;
      this.authError = null;
      
      try {
        // Gọi API đăng ký của backend
        const response = await axios.post('http://localhost:5000/api/auth/register', signupData, {
          withCredentials: true // Tự động set cookie session sau khi register
        });

        if (response.data && response.data.success) {
          // Sau khi đăng ký thành công, lấy thông tin user để cập nhật store
          await this.fetchCurrentUser();
          
          if (this.user) { 
            // Nếu lấy được user data thành công
            this.$patch({ user: this.user, authError: null });
            console.log('Đăng ký thành công:', this.user);
            console.log("isAuthenticated:", this.isAuthenticated);
            return { success: true };
          } else {
            // Nếu không lấy được user data ngay, vẫn coi như thành công
            // vì account đã được tạo, user có thể đăng nhập lại sau
            console.warn('Tài khoản đã được tạo nhưng không lấy được thông tin user ngay lập tức');
            return { success: true };
          }
        } else {
          // Trường hợp API register trả về success: false
          throw new Error(response.data.message || 'Đăng ký thất bại do lỗi không xác định.');
        }
      } catch (err) {
        console.error('Đăng ký thất bại:', err);
        const errorMessage = err.response?.data?.msg || err.response?.data?.message || err.message || 'Tạo tài khoản thất bại.';
        this.authError = errorMessage;
        return { success: false, message: errorMessage };
      } finally {
        this.isLoading = false;
      }
    }
  },

  // Cấu hình persistence (lưu trữ vào localStorage)
  persist: {
    key: 'auth-store',        // Key trong localStorage
    storage: localStorage,    // Sử dụng localStorage (persistent across browser sessions)
    paths: ['user']          // Chỉ persist user data, không persist loading states hoặc errors
  }
})