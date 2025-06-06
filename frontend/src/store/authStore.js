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
    // Clear authentication errors
    clearError() {
      console.log("Clearing auth error");
      this.isLoading = false;
      this.authError = null;
    },

    // Clear all auth data
    clearAuthData() {
      console.log("Clearing auth data");
      this.user = null;
      this.authError = null;
      this.isLoading = false;
    },

    async login(credentials) {
      console.log("Attempting to login with credentials:")
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
      console.log("Attempting to login with Google token:")
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
      console.log("Fetching current user data...");
      console.log("isAuthenticated:", this.isAuthenticated);
      this.isLoading = true;
      this.authError = null;
      try {
        const response = await axios.get('http://localhost:5000/api/users/me', { withCredentials: true });
        this.$patch({ user: response.data });
        return this.user;
      } catch (err) {
        this.$patch({ user: null });
        if (err.response?.status === 401) { 
          this.authError = 'Session expired or not authenticated.';
          this.isLoading = false;
        } else { 
          this.authError = null;
          this.isLoading = false; // Không hiển thị lỗi nếu chỉ là không có session
        }
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    // Logout action
    async logout() {
      console.log("Logging out...");
      this.isLoading = true;
      try {
        await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      } catch (err) {
        console.error('Logout error:', err);
        // Continue with local logout even if server logout fails
      } finally {
        this.clearAuthData();
      }
    },

    initializeAuth() {
      console.log("Initializing auth store...");
      if (this.user) { // user được khôi phục từ persist
        this.fetchCurrentUser();
      }
      else {
        this.clearError();
        this.clearAuthData();
      }
    },

    async signup(signupData) { // signupData: { HoTen, Email, MatKhau, SDT, NgaySinh, GioiTinh, CCCD }
      console.log("Attempting to sign up with data:")
      this.isLoading = true;
      this.authError = null;
      try {
        // Gọi API đăng ký của backend
        const response = await axios.post('http://localhost:5000/api/auth/register', signupData, {
          withCredentials: true // Set cookie session ngay sau khi register
        });

        if (response.data && response.data.success) {
          // Sau khi đăng ký thành công, fetch user data để cập nhật store
          await this.fetchCurrentUser();
          if (this.user) { // Nếu fetchCurrentUser thành công
            this.$patch({ user: this.user, authError: null });
            console.log('AuthStore Signup successful:', this.user);
            console.log("isAuthenticated:", this.isAuthenticated);
            return { success: true };
          } else {
            // Nếu không lấy được user data, vẫn coi như thành công
            // vì account đã được tạo, user có thể đăng nhập lại sau
            console.warn('Account created but could not fetch user data immediately');
            return { success: true };
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
    }
  },

  // Enable persistence
  persist: {
    key: 'auth-store',
    storage: localStorage,
    paths: ['user'] // Only persist user data, not loading states or errors
  }
})