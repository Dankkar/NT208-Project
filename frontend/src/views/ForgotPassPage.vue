<!-- src/views/ForgotPasswordPage.vue -->
<template>
  <div class="forgot-pass-page">
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
      <h2 class="form-title">Forgot your password?</h2>

      <!-- Divider -->
      <div class="divider mb-4">
        <span class="line"></span>
        <small>enter your email to reset password</small>
        <span class="line"></span>
      </div>

      <!-- Alert messages -->
      <div v-if="alertMessage" :class="['alert', alertType]" role="alert">
        {{ alertMessage }}
      </div>

      <!-- Reset form -->
      <form @submit.prevent="sendResetLink">
        <div class="mb-5">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="underline-input"
            :class="{ 'is-invalid': emailError }"
            placeholder="Enter your email"
            required
            @input="validateEmail"
          />
          <div v-if="emailError" class="invalid-feedback">
            {{ emailError }}
          </div>
        </div>

        <button 
          type="submit" 
          class="btn-login w-100 mb-3"
          :disabled="isLoading || !!emailError"
        >
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ isLoading ? 'Sending...' : 'Send reset link' }}
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '../components/Logo.vue'
import uit_logo from '../assets/Logo_UIT_blue.jpg'

const email = ref('')
const emailError = ref('')
const isLoading = ref(false)
const alertMessage = ref('')
const alertType = ref('')
const router = useRouter()
const logoSrc = ref(uit_logo)

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

function showAlert(message, type = 'info') {
  alertMessage.value = message
  alertType.value = `alert-${type}`
  setTimeout(() => {
    alertMessage.value = ''
  }, 5000)
}

async function sendResetLink() {
  if (emailError.value) return
  
  isLoading.value = true
  try {
    await axios.post('http://localhost:5000/api/auth/forgot-password',
      { Email: email.value }
    )
    showAlert('If that email exists, you\'ll receive a reset link shortly.', 'success')
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error) {
    const message = error.response?.data?.msg || 'Failed to send reset link. Please try again.'
    showAlert(message, 'danger')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Reuse Login/Signup styles */

/* full-screen bg */
.forgot-pass-page {
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('../assets/mountain.jpg') no-repeat center/cover;
  min-height: 100vh;
  width: 100%;
  padding: 2rem;
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

/* underline input */
.underline-input {
  width: 100%;
  border: none;
  border-bottom: 1px solid #ccc;
  background: transparent;
  padding: 0.5rem 0;
  font-size: 1rem;
}
.underline-input:focus {
  outline: none;
  border-bottom-color: #888;
}
.underline-input.is-invalid {
  border-bottom-color: #dc3545;
}

/* send button (reuse .btn-login) */
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

.logo-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 700px;
  display: flex;
  align-items: center;
}
</style>
