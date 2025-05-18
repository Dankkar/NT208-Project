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
  server: {
    port: 3000,
  open: '/',
  //root: '.', 
  },
})

