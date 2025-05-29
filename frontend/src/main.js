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

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000'
axios.defaults.withCredentials = true // Important for session handling

// Initialize session
const initializeSession = async () => {
    try {
        await axios.get('/api/auth/init-session')
        console.log('Session initialized successfully')
    } catch (error) {
        console.error('Error initializing session:', error)
    }
}

// Initialize Pinia with persistence
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Create and configure app
const app = createApp(App)

// Register components
app.component('Datepicker', Datepicker)

// Use plugins
app.use(router)
app.use(vue3GoogleLogin, {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})
app.use(pinia)

// Initialize session before mounting
initializeSession().then(() => {
    app.mount('#app')
})
