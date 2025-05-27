<!-- src/views/SignupPage.vue -->
<template>
    <div class="signup-page">
    <div class="form-card">
      <h2 class="form-title">Create your account</h2>

      <div v-if="authStore.getAuthError" class="alert alert-danger" role="alert">
        {{ authStore.getAuthError }}
      </div>
      <div v-if="successMessage" class="alert alert-success" role="alert">
        {{ successMessage }}
      </div>
        
      <div class="divider mb-4">
        <span class="line"></span>
        <span class="line"></span>
      </div>

      <form @submit.prevent="handleSignup">
        <div class="mb-4">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="underline-input"
            :class="{ 'is-invalid': emailError }"
            placeholder="Enter your email"
            @input="validateEmail"
            required
          />
          <div v-if="emailError" class="invalid-feedback">
            {{ emailError }}
          </div>
        </div>
        <div class="mb-4">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="underline-input"
            :class="{ 'is-invalid': passwordError }"
            placeholder="Create a password (min. 8 characters)"
            @input="validatePassword"
            required
          />
          <div v-if="passwordError" class="invalid-feedback">
            {{ passwordError }}
          </div>
        </div>
        <div class="mb-5">
          <label for="confirm" class="form-label">Confirm Password</label>
          <input
            id="confirm"
            v-model="confirmPassword"
            type="password"
            class="underline-input"
            :class="{ 'is-invalid': confirmPasswordError }"
            placeholder="Repeat your password"
            @input="validateConfirmPassword"
            required
          />
          <div v-if="confirmPasswordError" class="invalid-feedback">
            {{ confirmPasswordError }}
          </div>
        </div>

        <button 
          type="submit" 
          class="btn-signup w-100 mb-3"
          :disabled="authStore.isLoadingAuth || !!emailError || !!passwordError || !!confirmPasswordError || !email || !password || !confirmPassword"
        >
          <span v-if="authStore.isLoadingAuth" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ authStore.isLoadingAuth ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="card-footer">
        Already have an account?
        <router-link to="/login" class="link-primary">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/authStore'; // Import authStore

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const emailError = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');
const successMessage = ref('');
let alertTimeout = null;

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
  if (!email.value) { emailError.value = 'Email is required'; }
  else if (!emailRegex.test(email.value)) { emailError.value = 'Please enter a valid email address'; }
  else { emailError.value = ''; }
}
function validatePassword() {
  if (!password.value) { passwordError.value = 'Password is required'; }
  else if (password.value.length < 8) { passwordError.value = 'Password must be at least 8 characters'; }
  else { passwordError.value = ''; }
  if (confirmPassword.value) { validateConfirmPassword(); }
}
function validateConfirmPassword() {
  if (!confirmPassword.value) { confirmPasswordError.value = 'Please confirm your password'; }
  else if (confirmPassword.value !== password.value) { confirmPasswordError.value = 'Passwords do not match'; }
  else { confirmPasswordError.value = ''; }
}

function showSuccessAlert(message) {
  authStore.authError = null;
  successMessage.value = message;
  if(alertTimeout) clearTimeout(alertTimeout);
  alertTimeout = setTimeout(() => {
    successMessage.value = '';
  }, 4000);
}

async function handleSignup() {
  validateEmail();
  validatePassword();
  validateConfirmPassword();
  if (emailError.value || passwordError.value || confirmPasswordError.value || !email.value || !password.value || !confirmPassword.value) {
    if (!email.value) validateEmail();
    if (!password.value) validatePassword();
    if (!confirmPassword.value) validateConfirmPassword();
    return;
  }
  
  const signupData = {
      HoTen: email.value.split('@')[0], // Lấy phần trước @ làm HoTen (tạm thời)
      Email: email.value,
      MatKhau: password.value,
      // Bạn có thể thêm các trường này vào form nếu muốn người dùng nhập
      SDT: '1234456788', // Ví dụ, để trống nếu không có input
      NgaySinh: null,
      GioiTinh: null,
      CCCD: '12 '
  };

  const result = await authStore.signup(signupData);

  if (result && result.success && authStore.isAuthenticated) {
    showSuccessAlert('Account created successfully! You are now logged in.');
    setTimeout(() => {
      const redirectPath = router.currentRoute.value.query.redirect || '/homepage';
      router.push(redirectPath);
    }, 1500);
  }
  // Lỗi đã được authStore.authError xử lý và hiển thị bởi v-if trong template
}
</script>

<style scoped>
/* CSS scoped giữ nguyên như bạn đã cung cấp */
.signup-page { display: flex; align-items: center; justify-content: center; background: url('../assets/mountain.jpg') no-repeat center/cover; min-height: 100vh; width: 100%; padding: 2rem; }
.form-card { background: #fff; max-width: 420px; width: 100%; padding: 2rem 2.5rem; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.form-title { margin-bottom: 1.5rem; font-size: 1.75rem; font-weight: 600; text-align: center; color: #111; }
.divider { display: flex; align-items: center; margin: 1.5rem 0; }
.divider .line { flex: 1; height: 1px; background: #ccc; }
.divider small { padding: 0 0.75rem; color: #666; font-size: 0.9rem; }
.underline-input { width: 100%; border: none; border-bottom: 1px solid #ccc; background: transparent; padding: 0.5rem 0; font-size: 1rem; }
.underline-input:focus { outline: none; border-bottom-color: #888; }
.underline-input.is-invalid { border-bottom-color: #dc3545; }
.btn-signup { width: 100%; padding: 0.75rem 0; background: #000; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.btn-signup:hover:not(:disabled) { opacity: 0.9; }
.btn-signup:disabled { opacity: 0.7; cursor: not-allowed; }
.card-footer { margin-top: 1rem; text-align: center; font-size: 0.9rem; }
.card-footer a { color: #007bff; text-decoration: none; }
.card-footer a:hover { text-decoration: underline; }
.alert { padding: 0.75rem 1rem; margin-bottom: 1rem; border-radius: 8px; font-size: 0.9rem; }
.alert-info { background-color: #cce5ff; border: 1px solid #b8daff; color: #004085; }
.alert-success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
.alert-danger { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
</style>