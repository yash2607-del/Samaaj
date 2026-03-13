import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Ensure PWA files are included in build
    rollupOptions: {
      input: {
        main: './index.html',
      }
    }
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
  // Proxy API requests to the local backend during local development
    proxy: {
      '/login': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/signup': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/profile': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/logout': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/uploads': {
        // During local development prefer the local backend (PORT=3000)
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
