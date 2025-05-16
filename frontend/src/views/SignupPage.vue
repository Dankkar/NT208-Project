<!-- src/views/SignupPage.vue -->
<template>
    <div class="signup-page">
      <!-- Header menu -->
        <header class="position-absolute top-0 w-100 px-4 py-3 d-flex align-items-center">
          <button class="btn btn-link p-0 d-flex text-decoration-none align-items-center text-light">
          <i class="bi bi-list fs-2 me-2"></i>
          <span class="fw-bold">MENU</span>
          </button>
        </header>
    <div class="form-card">
      <!-- Title -->
      <h2 class="form-title">Create your account</h2>

      <!-- Google button -->
      <button 
        @click="signUpWithGoogle" 
        class="btn-google mb-4"
      >
        <i class="bi bi-google me-2"></i>
        Sign up with Google
      </button>

      <!-- Divider -->
      <div class="divider mb-4">
        <span class="line"></span>
        <small>or sign up with email</small>
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
            placeholder="Enter your email"
            required
          />
        </div>
        <div class="mb-4">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="underline-input"
            placeholder="Create a password"
            required
          />
        </div>
        <div class="mb-5">
          <label for="confirm" class="form-label">Confirm Password</label>
          <input
            id="confirm"
            v-model="confirmPassword"
            type="password"
            class="underline-input"
            placeholder="Repeat your password"
            required
          />
        </div>

        <button type="submit" class="btn-signup w-100 mb-3">
          Sign up
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const router = useRouter()

function signUpWithGoogle() {
  // TODO: OAuth sign-up flow
}

function signup() {
  if (password.value !== confirmPassword.value) {
    return alert('Passwords do not match!')
  }
  // TODO: gọi API tạo tài khoản
  router.push('/')
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

/* Google button */
.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: #e2e5e9;
  color: #111;
  border: none;
  border-radius: 8px;
  height: 48px;
  font-weight: 500;
  font-size: 1rem;
  gap: 0.5rem;
}
.btn-google:hover {
  background: #d3d6da;
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
.btn-signup:hover {
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
