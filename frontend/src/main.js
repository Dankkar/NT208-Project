import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'flatpickr/dist/flatpickr.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import vue3GoogleLogin from 'vue3-google-login'
import flatpickr from 'flatpickr'



const app = createApp(App)

app.use(router)
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})

app.mount('#app')
