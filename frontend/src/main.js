import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'flatpickr/dist/flatpickr.css';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import vue3GoogleLogin from 'vue3-google-login'
import axios from 'axios'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './assets/styles/variables.css'

// Configure axios defaults
// Import API configuration
import { API_BASE_URL } from './config/api.js'

axios.defaults.baseURL = API_BASE_URL
axios.defaults.withCredentials = true // Important for session handling

// Initialize session only when needed (moved to authentication flow)
const initializeSessionIfNeeded = async () => {
    try {
        const response = await axios.get('/api/auth/init-session')
        console.log('Session initialized:', response.data)
        return response.data
    } catch (error) {
        console.error('Error initializing session:', error)
        return null
    }
}

// Make session initialization available globally
window.initializeSessionIfNeeded = initializeSessionIfNeeded

// Create app instance
const app = createApp(App)

// Configure Pinia with persistence
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// Configure router
app.use(router)

// Configure Vue Datepicker
app.component('Datepicker', Datepicker)

// Configure Google Login
app.use(vue3GoogleLogin, {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})
app.use(pinia)

// Mount app directly - no need to initialize session on startup
app.mount('#app')

