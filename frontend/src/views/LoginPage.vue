<!-- src/views/LoginPage.vue -->
<template>
  <div class="login-page">
    <div class="form-card">
      <h2 class="form-title">Sign in to CHILLCHILL</h2>

      <div v-if="authStore.getAuthError" class="alert alert-danger" role="alert">
        {{ authStore.getAuthError }}
      </div>
      <div v-if="successMessage" class="alert alert-success" role="alert">
        {{ successMessage }}
      </div>

      <GoogleLogin :callback="handleGoogleSignIn" class="w-100" />
        
      <div class="divider mb-4">
        <span class="line"></span>
        <small>or sign in with account</small>
        <span class="line"></span>
      </div>

      <form @submit.prevent="handleEmailLogin">
        <div class="mb-4">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-control underline-input"
            :class="{ 'is-invalid': emailError }"
            placeholder="Enter your email"
            @input="validateEmail"
            required
          />
          <div v-if="emailError" class="invalid-feedback">
            {{ emailError }}
          </div>
        </div>
        <div class="mb-5">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control underline-input"
            :class="{ 'is-invalid': passwordError }"
            placeholder="Enter your password"
            @input="validatePassword"
            required
          />
          <div v-if="passwordError" class="invalid-feedback">
            {{ passwordError }}
          </div>
        </div>
        <button 
          type="submit" 
          class="btn btn-login w-100 mb-3"
          :disabled="authStore.isLoadingAuth || !!emailError || !!passwordError || !email || !password"
        >
          <span v-if="authStore.isLoadingAuth" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          {{ authStore.isLoadingAuth ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="text-center small mb-2">
        Don't have an account?
        <router-link to="/signup" class="link-primary">Sign up</router-link>
      </p>
      <div class="divider small mb-4">
        <span class="line"></span>
        <router-link to="/forgotpass" class="link-secondary px-3">
          forgot your password?
        </router-link>
        <span class="line"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'; // Thêm onUnmounted
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/authStore'; // Đảm bảo đường dẫn đúng

// GoogleLogin component cần được import nếu nó là một component bạn đã tạo hoặc cài đặt
// import { GoogleLogin } from 'vue3-google-login'; // Ví dụ nếu bạn dùng thư viện này

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const emailError = ref('');
const passwordError = ref('');
const successMessage = ref('');
let alertTimeout = null;

// Xóa lỗi khi component unmount để tránh hiển thị lại khi điều hướng
onUnmounted(() => {
  if (authStore.authError) {
    authStore.authError = null;
  }
  if (successMessage.value) {
    successMessage.value = '';
  }
  if(alertTimeout) {
    clearTimeout(alertTimeout);
  }
});

function validateEmail() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value) {
    emailError.value = 'Email is required';
  } else if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address';
  } else {
    emailError.value = '';
  }
}

function validatePassword() {
  if (!password.value) {
    passwordError.value = 'Password is required';
  } else if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters';
  } else {
    passwordError.value = '';
  }
}

function showSuccessAlert(message) {
  authStore.authError = null;
  successMessage.value = message;
  if(alertTimeout) clearTimeout(alertTimeout); // Xóa timeout cũ nếu có
  alertTimeout = setTimeout(() => {
    successMessage.value = '';
  }, 4000);
}

async function handleGoogleSignIn(googleAuthResponse) {
  const result = await authStore.loginWithGoogle(googleAuthResponse);
  if (result && result.success) {
    showSuccessAlert('Successfully signed in with Google!');
    setTimeout(() => {
      //
      // Kiểm tra xem người dùng có định đến trang nào trước đó không (query param 'redirect')
      //
      const redirectPath = router.currentRoute.value.query.redirect || '/homepage';
      router.push(redirectPath);
    }, 1500);
  }
  // Lỗi sẽ được authStore.authError xử lý và hiển thị bởi v-if trong template
}

async function handleEmailLogin() {
  validateEmail();
  validatePassword();
  if (emailError.value || passwordError.value || !email.value || !password.value) {
    //
    // Nếu trường rỗng mà chưa blur/input, chạy validation lại
    //
    if (!email.value) validateEmail();
    if (!password.value) validatePassword();
    return;
  }

  const result = await authStore.login({ Email: email.value, MatKhau: password.value });

  if (result && result.success) {
    showSuccessAlert('Successfully signed in!');
     setTimeout(() => {
      const redirectPath = router.currentRoute.value.query.redirect || '/homepage';
      router.push(redirectPath);
    }, 1500);
  }
}
</script>

<style scoped>
.login-page { display: flex; align-items: center; justify-content: center; background: url('../assets/mountain.jpg') no-repeat center/cover; min-height: 100vh; opacity: 90%; padding: 2rem; }
.form-card { background: #ffffff; max-width: 420px; width: 100%; padding: 2rem 2.5rem; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.form-title { margin-bottom: 1.5rem; font-size: 1.75rem; font-weight: 600; text-align: center; color: #111; }
.btn-google { display: flex; align-items: center; justify-content: center; width: 100%; background: #e2e5e9; color: #111; border: none; border-radius: 8px; height: 48px; font-weight: 500; font-size: 1rem; gap: 0.5rem; }
.btn-google:hover { background: #d3d6da; }
.divider { display: flex; align-items: center; margin: 1.5rem 0; }
.divider .line { flex: 1; height: 1px; background: #ccc; }
.divider small { padding: 0 0.75rem; color: #666; font-size: 0.9rem; }
.underline-input { border: none; border-bottom: 1px solid #ccc; border-radius: 0; background: transparent; padding: 0.5rem 0; }
.underline-input:focus { outline: none; border-bottom-color: #888; }
.underline-input.is-invalid { border-bottom-color: #dc3545; }
.btn-login { width: 100%; padding: 0.75rem 0; background: #000; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.btn-login:hover:not(:disabled) { opacity: 0.9; }
.btn-login:disabled { opacity: 0.7; cursor: not-allowed; }
.divider.small a, .card-footer a { text-decoration: none; color: #666; }
.card-footer { margin-top: 1rem; font-size: 0.9rem; text-align: center; }
.card-footer a { color: #007bff; }
.alert { padding: 0.75rem 1rem; margin-bottom: 1rem; border-radius: 8px; font-size: 0.9rem; }
.alert-info { background-color: #cce5ff; border: 1px solid #b8daff; color: #004085; }
.alert-success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
.alert-danger { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
</style>