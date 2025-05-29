// src/store/authStore.js
import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    authError: null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    currentUser: (state) => state.user,
    isLoadingAuth: (state) => state.isLoading,
    getAuthError: (state) => state.authError,
  },

  actions: {
    async login(credentials) {
      this.isLoading = true;
      this.authError = null;
      try {
        await axios.post('http://localhost:5000/api/auth/login', {
          Email: credentials.Email,
          MatKhau: credentials.MatKhau
        }, { withCredentials: true });
        await this.fetchCurrentUser();
        if (!this.user) {
          console.error("Login succeeded but user data is null.");
          throw new Error("Login succeeded but failed to fetch user details.");
        }
        return { success: true };
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Sign in failed.';
        this.$patch({ user: null, authError: errorMessage });
        return { success: false, message: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },

    async loginWithGoogle(googleAuthResponse) {
      this.isLoading = true;
      this.authError = null;
      try {
        const backendResponse = await axios.post('http://localhost:5000/api/auth/google',
          { token: googleAuthResponse.credential },
          { withCredentials: true }
        );
        if (!backendResponse.data || !backendResponse.data.success) {
          throw new Error(backendResponse.data.message || "Google sign-in with backend failed.");
        }
        await this.fetchCurrentUser();
        if (!this.user) {
          throw new Error("Google sign-in with backend succeeded but failed to retrieve user data.");
        }
        return { success: true };
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Google sign-in failed.';
        this.$patch({ user: null, authError: errorMessage });
        return { success: false, message: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchCurrentUser() {
      console.log("isAuthenticated:", this.isAuthenticated);
      this.isLoading = true;
      this.authError = null;
      try {
        const response = await axios.get('http://localhost:5000/api/users/me', { withCredentials: true });
        this.$patch({ user: response.data });
        return this.user;
      } catch (err) {
        this.$patch({ user: null });
        if (err.response?.status === 401) { this.authError = 'Session expired or not authenticated.';}
        else { this.authError = null; } // Không hiển thị lỗi nếu chỉ là không có session
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      this.isLoading = true;
      this.authError = null;
      try {
        await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      } catch (err) {
        console.error('API Logout failed, but proceeding with client-side logout:', err);
      } finally {
        this.$patch({ user: null, authError: null, isLoading: false });
      }
    },

    initializeAuth() {
      if (this.user) { // user được khôi phục từ persist
        this.fetchCurrentUser();
      }
    },

    async signup(signupData) { // signupData: { HoTen, Email, MatKhau, SDT, NgaySinh, GioiTinh, CCCD }
      this.isLoading = true;
      this.authError = null;
      try {
        // Gọi API đăng ký của backend
        const response = await axios.post('http://localhost:5000/api/auth/register', signupData, {
          withCredentials: true // Nếu API register cũng set cookie session ngay
        });

        //
        // Xử lý response từ backend
        // Giả sử API register thành công sẽ tự động đăng nhập người dùng (set cookie)
        // hoặc trả về thông tin để có thể login ngay sau đó.
        //

        if (response.data && response.data.success) {
          //
          // Nếu đăng ký thành công, gọi fetchCurrentUser để lấy thông tin user
          // dựa trên session/cookie vừa được backend tạo.
          //
          await this.fetchCurrentUser();
          if (this.user) { // Nếu fetchCurrentUser thành công
            this.$patch({ user: this.user, authError: null });
            console.log('AuthStore Signup successful:', this.user);
            console.log("isAuthenticated:", this.isAuthenticated);
            return { success: true };
          } else {
            //
            // Trường hợp API register báo success nhưng không lấy được user (hiếm gặp nếu backend đúng)
            //
            throw new Error('Account created, but failed to retrieve user data immediately.');
          }
        } else {
          //
          // Trường hợp API register trả về success: false hoặc không có success field
          //
          throw new Error(response.data.message || 'Signup failed due to an unknown error.');
        }
      } catch (err) {
        console.error('AuthStore Signup failed:', err);
        const errorMessage = err.response?.data?.msg || err.response?.data?.message || err.message || 'Failed to create account.';
        this.authError = errorMessage;
        return { success: false, message: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },
    async clearError() {
      this.authError = null;
    }
  },
  persist: {
    paths: ['user'],
  },
});