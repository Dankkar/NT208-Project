<template>
  <div class="login-page">
   
  <div class="form-card">
      <h2 class="form-title">Sign in to CHILLCHILL</h2>

      <!-- Alert messages -->
      <div v-if="alertMessage" :class="['alert', alertType]" role="alert">
        {{ alertMessage }}
      </div>

      <!-- Google Button -->
      <GoogleLogin :callback="signInWithGoogle" class="w-100" />
        
      <!-- Divider -->
      <div class="divider mb-4">
        <span class="line"></span>
        <small>or sign in with account</small>
        <span class="line"></span>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="login">
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
          />
          <div v-if="passwordError" class="invalid-feedback">
            {{ passwordError }}
          </div>
        </div>
        <button 
          type="submit" 
          class="btn btn-login w-100 mb-3"
          :disabled="isLoading || !!emailError || !!passwordError"
        >
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <!-- Links -->
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
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const isLoading = ref(false)
const alertMessage = ref('')
const alertType = ref('')
const router = useRouter()

function validateEmail() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value) {
    emailError.value = 'Email is required'
  } else if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address'
  } else {
    emailError.value = ''
  }
}

function validatePassword() {
  if (!password.value) {
    passwordError.value = 'Password is required'
  } else if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
  } else {
    passwordError.value = ''
  }
}

function showAlert(message, type = 'info') {
  alertMessage.value = message
  alertType.value = `alert-${type}`
  setTimeout(() => {
    alertMessage.value = ''
  }, 5000)
}

async function signInWithGoogle(response) { 
  try {
    isLoading.value = true
    const res = await axios.post('http://localhost:5000/api/auth/google', 
      { token: response.credential },
      { withCredentials: true }
    )
    showAlert('Successfully signed in with Google', 'success')
    router.push('/UserInfo')
  }
  catch (err) {
    showAlert(err.response?.data?.message || 'Google sign in failed', 'danger')
  } finally {
    isLoading.value = false
  }
}

async function login() { 
  if (emailError.value || passwordError.value) return
  
  isLoading.value = true
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      Email: email.value,
      MatKhau: password.value
    }, {
      withCredentials: true
    })
    showAlert('Successfully signed in', 'success')
    router.push('/UserInfo')
  }
  catch (err) {
    showAlert(err.response?.data?.message || 'Sign in failed', 'danger')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 1. Nền cả trang */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('../assets/mountain.jpg') no-repeat center/cover;
  min-height: 100vh;
  opacity: 90%;
  padding: 2rem;
}

/* Card trắng bo tròn */
.form-card {
  background: #ffffff;
  max-width: 420px;
  width: 100%;
  padding: 2rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

/* Tiêu đề */
.form-title {
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  font-weight: 600;
  text-align: center;
  color: #111;
}

/* 2. Google button full-width, icon cân giữa */
.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;             /* full width */
  background: #e2e5e9;
  color: #111;
  border: none;
  border-radius: 8px;
  height: 48px;
  font-weight: 500;
  font-size: 1rem;
  gap: 0.5rem;             /* khoảng cách icon/text */
}
.btn-google:hover {
  background: #d3d6da;
}

/* 3. Divider đơn giản */
.divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
}
.divider .line {
  flex: 1;
  height: 1px;
  background: #ccc;
}
.divider small {
  padding: 0 0.75rem;
  color: #666;
  font-size: 0.9rem;
}

/* Input chỉ underline */
.underline-input {
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  background: transparent;
  padding: 0.5rem 0;
}
.underline-input:focus {
  outline: none;
  border-bottom-color: #888;
}
.underline-input.is-invalid {
  border-bottom-color: #dc3545;
}

/* 4. Login button */
.btn-login {
  width: 100%;
  padding: 0.75rem 0;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.btn-login:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 3. "Forgot password?" */
.divider.small a,
.card-footer a {
  text-decoration: none;
  color: #666;
}
.card-footer {
  margin-top: 1rem;
  font-size: 0.9rem;
  text-align: center;
}
.card-footer a {
  color: #007bff;
}

/* Alert styles */
.alert {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}
.alert-info {
  background-color: #cce5ff;
  border: 1px solid #b8daff;
  color: #004085;
}
.alert-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}
.alert-danger {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}
</style>
