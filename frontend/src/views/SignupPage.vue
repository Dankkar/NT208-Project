<!-- src/views/SignupPage.vue -->
<template>
    <div class="signup-page">
    <div class="form-card">
      <!-- Title -->
      <h2 class="form-title">Create your account</h2>

      <!-- Alert messages -->
      <div v-if="alertMessage" :class="['alert', alertType]" role="alert">
        {{ alertMessage }}
      </div>

      <!-- Divider -->
      <div class="divider mb-4">
        <span class="line"></span>
        <span class="line"></span>
      </div>

      <!-- Email / Password form -->
      <form @submit.prevent="signup">
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
            placeholder="Create a password"
            @input="validatePassword"
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
          />
          <div v-if="confirmPasswordError" class="invalid-feedback">
            {{ confirmPasswordError }}
          </div>
        </div>

        <button 
          type="submit" 
          class="btn-signup w-100 mb-3"
          :disabled="isLoading || !!emailError || !!passwordError || !!confirmPasswordError"
        >
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ isLoading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <!-- Footer link -->
      <p class="card-footer">
        Already have an account?
        <router-link to="/login" class="link-primary">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const emailError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
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
  // Revalidate confirm password when password changes
  if (confirmPassword.value) {
    validateConfirmPassword()
  }
}

function validateConfirmPassword() {
  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password'
  } else if (confirmPassword.value !== password.value) {
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

async function signup() {
  if (emailError.value || passwordError.value || confirmPasswordError.value) return
  
  isLoading.value = true
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      HoTen: email.value.split('@')[0], // hoặc lấy từ input tên nếu có
      Email: email.value,
      MatKhau: password.value,
      SDT: '0123456798', // hoặc lấy từ input nếu có
      NgaySinh: null,    // hoặc lấy từ input nếu có
      GioiTinh: null,    // hoặc lấy từ input nếu có
      CCCD: '123456789312' // hoặc lấy từ input nếu có
    }, {
      withCredentials: true
    })
    showAlert('Account created successfully', 'success')
    router.push('/homepage')
  }
  catch (err) {
    showAlert(err.response?.data?.msg || 'Failed to create account', 'danger')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* full-screen bg */
.signup-page {
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

/* inputs underline */
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

/* sign-up button */
.btn-signup {
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
.btn-signup:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-signup:disabled {
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
</style>
