<!-- src/views/ResetPasswordPage.vue -->
<template>
  <div class="reset-password-page">
    <router-link class="logo-wrapper" to="/homepage">
      <Logo
        :src="logoSrc"
        alt="UIT_Logo"
        hoverFilter="brightness(0.8)" 
        width="50px"
      />
    </router-link>
    <div class="form-card">
      <!-- Title -->
      <h2 class="form-title">Reset your password</h2>

      <!-- Divider -->
      <div class="divider mb-4">
        <span class="line"></span>
        <small>enter your new password</small>
        <span class="line"></span>
      </div>

      <!-- Alert messages -->
      <div v-if="alertMessage" :class="['alert', alertType]" role="alert">
        {{ alertMessage }}
      </div>

      <!-- Reset form -->
      <form @submit.prevent="resetPassword">
        <div class="mb-4">
          <label for="password" class="form-label">New Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="underline-input"
            :class="{ 'is-invalid': passwordError }"
            placeholder="Enter your new password"
            required
            @input="validatePassword"
          />
          <div v-if="passwordError" class="invalid-feedback">
            {{ passwordError }}
          </div>
        </div>

        <div class="mb-5">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="underline-input"
            :class="{ 'is-invalid': confirmPasswordError }"
            placeholder="Confirm your new password"
            required
            @input="validateConfirmPassword"
          />
          <div v-if="confirmPasswordError" class="invalid-feedback">
            {{ confirmPasswordError }}
          </div>
        </div>

        <button 
          type="submit" 
          class="btn-login w-100 mb-3"
          :disabled="isLoading || !!passwordError || !!confirmPasswordError || !password || !confirmPassword"
        >
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ isLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <p class="card-footer">
        <router-link to="/login" class="link-primary">
          ← Back to sign in
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Logo from '../components/Logo.vue'
import uit_logo from '../assets/Logo_UIT_blue.jpg'

const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const isLoading = ref(false)
const alertMessage = ref('')
const alertType = ref('')
const router = useRouter()
const route = useRoute()
const logoSrc = ref(uit_logo)
const resetToken = ref('')

// Get token from URL params
onMounted(() => {
  // Support both path parameter (/reset-password/:token) and query parameter (/reset-password?token=xxx)
  resetToken.value = route.params.token || route.query.token
  if (!resetToken.value) {
    showAlert('Invalid or missing reset token. Please request a new password reset.', 'danger')
    setTimeout(() => {
      router.push('/forgotpass')
    }, 3000)
  }
})

function validatePassword() {
  if (!password.value) {
    passwordError.value = 'Password is required'
  } else if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
  } 
    else {
    passwordError.value = ''
  }
  // Re-validate confirm password if it has been entered
  if (confirmPassword.value) {
    validateConfirmPassword()
  }
}


function validateConfirmPassword() {
  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password'
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match'
  } else {
    confirmPasswordError.value = ''
  }
}

function showAlert(message, type = 'info') {
  alertMessage.value = message
  alertType.value = `alert-${type}`
  setTimeout(() => {
    alertMessage.value = ''
  }, 5000)
}

async function resetPassword() {
  validatePassword()
  validateConfirmPassword()
  
  if (passwordError.value || confirmPasswordError.value) return
  
  isLoading.value = true
  try {
    await axios.put('/api/auth/reset-password', {
      token: resetToken.value,
      newPassword: password.value
    })
    
    showAlert('Password reset successfully! Redirecting to login...', 'success')
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.msg || 'Failed to reset password. Please try again.'
    showAlert(message, 'danger')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Reuse Login/Signup styles */

/* full-screen bg */
.reset-password-page {
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('../assets/mountain.jpg') no-repeat center/cover;
  min-height: 100vh;
  width: 100%;
  padding: 2rem;
  opacity: 90%;
}

/* white card */
.form-card {
  background: #fff;
  max-width: 420px;
  width: 100%;
  padding: 2rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

/* title */
.form-title {
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  font-weight: 600;
  text-align: center;
  color: #111;
}

/* divider */
.divider {
  display: flex;
  align-items: center;
  margin: 1rem 0 1.5rem;
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

/* form labels */
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

/* underline input */
.underline-input {
  width: 100%;
  border: none;
  border-bottom: 1px solid #ccc;
  background: transparent;
  padding: 0.5rem 0;
  font-size: 1rem;
  border-radius: 0;
}
.underline-input:focus {
  outline: none;
  border-bottom-color: #888;
  box-shadow: none;
}
.underline-input.is-invalid {
  border-bottom-color: #dc3545;
}

/* validation feedback */
.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #dc3545;
}

/* reset button */
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
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-login:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* footer link */
.card-footer {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
}
.card-footer a {
  color: #007bff;
  text-decoration: none;
}
.card-footer a:hover {
  text-decoration: underline;
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

/* Logo positioning */
.logo-wrapper {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  z-index: 10;
}

/* Utility classes */
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mb-5 { margin-bottom: 2rem; }
.w-100 { width: 100%; }

/* Spinner */
.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 0.125em solid currentcolor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}
.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 0.125em;
}
.me-2 { margin-right: 0.5rem; }

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}
</style> 