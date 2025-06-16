// File khởi tạo chính của ứng dụng Vue
import { createApp } from 'vue'           // Vue 3 core
import { createPinia } from 'pinia'       // State management
import App from './App.vue'               // Root component
import router from './router'             // Vue Router để điều hướng
import 'flatpickr/dist/flatpickr.css';    // CSS cho date picker
import Datepicker from '@vuepic/vue-datepicker'; // Component date picker
import '@vuepic/vue-datepicker/dist/main.css';   // CSS cho Vue datepicker
import 'bootstrap/dist/css/bootstrap.min.css'    // Bootstrap CSS
import 'bootstrap/dist/js/bootstrap.bundle.min.js' // Bootstrap JavaScript
import 'bootstrap-icons/font/bootstrap-icons.css' // Bootstrap Icons
import vue3GoogleLogin from 'vue3-google-login'   // Plugin đăng nhập Google
import axios from 'axios'                          // HTTP client
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' // Plugin lưu trữ state
import './assets/styles/variables.css'             // CSS variables tùy chỉnh

// Configure axios defaults
// Import API configuration
import { API_BASE_URL } from './config/api.js'

axios.defaults.baseURL = API_BASE_URL
axios.defaults.withCredentials = true // Important for session handling

/**
 * Khởi tạo session khi cần thiết (chỉ gọi khi user thực hiện hành động cần session)
 * Hàm này sẽ gọi API để tạo session cho guest user
 * @returns {Promise<Object|null>} - Thông tin session hoặc null nếu lỗi
 */
const initializeSessionIfNeeded = async () => {
    try {
        // Gọi API khởi tạo session guest
        const response = await axios.get('/api/auth/init-session')
        console.log('Session đã được khởi tạo:', response.data)
        return response.data
    } catch (error) {
        console.error('Lỗi khi khởi tạo session:', error)
        return null
    }
}

// Đặt hàm vào window object để có thể gọi từ bất kỳ đâu trong ứng dụng
window.initializeSessionIfNeeded = initializeSessionIfNeeded

// Tạo instance ứng dụng Vue
const app = createApp(App)

// Cấu hình Pinia với tính năng lưu trữ persistent (localStorage/sessionStorage)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // Plugin để lưu state khi reload trang
app.use(pinia)

// Đăng ký Vue Router để điều hướng giữa các trang
app.use(router)

// Đăng ký component Datepicker toàn cục để sử dụng trong mọi component
app.component('Datepicker', Datepicker)

// Cấu hình plugin đăng nhập Google
app.use(vue3GoogleLogin, {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID, // Client ID từ Google Console
})

// Lưu ý: app.use(pinia) đã được gọi ở trên, không cần gọi lại
// app.use(pinia) // Đã comment để tránh duplicate

// Mount ứng dụng vào DOM element có id="app"
// Không cần khởi tạo session ngay lập tức, chỉ khi user thực hiện hành động
app.mount('#app')

