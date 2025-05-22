import { ref } from 'vue'
import axios from 'axios'

const isLoggedIn = ref(false)

export function useAuth() {
  return { isLoggedIn, login, logout, checkLogin }
}

async function login(email, password) {
  try {
    await axios.post('http://localhost:5000/api/auth/login', {
      Email: email,
      MatKhau: password
    }, { withCredentials: true })
    isLoggedIn.value = true
    return { success: true }
  } catch (err) {
    isLoggedIn.value = false
    return { success: false, message: err.response?.data?.message || 'Sign in failed' }
  }
}

async function checkLogin() {
  try {
    await axios.get('http://localhost:5000/api/users/me', { withCredentials: true })
    isLoggedIn.value = true
  } catch {
    isLoggedIn.value = false
  }
}
function logout() {
  isLoggedIn.value = false
}