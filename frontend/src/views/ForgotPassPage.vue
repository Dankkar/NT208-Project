<!-- src/views/ForgotPasswordPage.vue -->
<template>
  <div class="forgot-pass-page">
      <!-- Header menu -->
    <header class="position-absolute top-0 w-100 px-4 py-3 d-flex align-items-center">
      <button class="btn btn-link p-0 d-flex text-decoration-none align-items-center text-light">
        <i class="bi bi-list fs-2 me-2"></i>
        <span class="fw-bold">MENU</span>
      </button>
    </header>
    <div class="form-card">
      <!-- Title -->
      <h2 class="form-title">Forgot your password?</h2>

      <!-- Divider -->
      <div class="divider mb-4">
        <span class="line"></span>
        <small>enter your email to reset password</small>
        <span class="line"></span>
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
            placeholder="Enter your email"
            required
          />
        </div>

        <button type="submit" class="btn-login w-100 mb-3">
          Send reset link
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const router = useRouter()

function sendResetLink() {
  // TODO: gọi API gửi email reset
  console.log('Sending reset link to', email.value)
  // Có thể hiển thị thông báo thành công rồi tự động quay về login sau 3s:
  alert('If that email exists, you’ll receive a reset link shortly.')
  router.push('/')
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
.btn-login:hover {
  opacity: 0.9;
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
</style>
