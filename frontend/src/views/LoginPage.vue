<template>
  <div class="login-page">
      <!-- Header menu -->
    <header class="position-absolute top-0 w-100 px-4 py-3 d-flex align-items-center">
      <button class="btn btn-link p-0 d-flex text-decoration-none align-items-center text-light">
        <i class="bi bi-list fs-2 me-2"></i>
        <span class="fw-bold">MENU</span>
      </button>
    </header>
  <div class="form-card">
      <h2 class="form-title">Sign in to CHILLCHILL</h2>

      <!-- Google Button -->
      <button
        @click="signInWithGoogle"
        class="btn btn-google mb-4"
      >
        <i class="bi bi-google me-2"></i>
        Sign in with Google
      </button>

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
            placeholder="Enter your email"
          />
        </div>
        <div class="mb-5">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control underline-input"
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" class="btn btn-login w-100 mb-3">
          Login
        </button>
      </form>

      <!-- Links -->
      <p class="text-center small mb-2">
        Don’t have an account?
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const email = ref('')
const password = ref('')
const router = useRouter()
function signInWithGoogle() { /* OAuth */ }
function login() { /* API */ router.push('/homepage') }
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
.btn-login:hover {
  opacity: 0.9;
}

/* 3. “Forgot password?” */
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
</style>
