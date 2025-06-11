import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // so "@/assets/foo.jpg" => "<project-root>/src/assets/foo.jpg"
      '@': path.resolve(__dirname, 'src')
    }
  },
  define: {
    // Make sure environment variables are available
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Load environment variables
  envPrefix: 'VITE_'
})

