import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/interviews': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/favorites': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/shares': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/share': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/experiences': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/comments': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/ai-configs': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/admin': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/files': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
