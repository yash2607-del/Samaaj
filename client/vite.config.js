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
    // Proxy API requests to the deployed backend during local development
    proxy: {
      '/login': {
        target: 'https://samaaj-backend-kj3r.onrender.com',
        changeOrigin: true,
        secure: true
      },
      '/signup': {
        target: 'https://samaaj-backend-kj3r.onrender.com',
        changeOrigin: true,
        secure: true
      },
      '/profile': {
        target: 'https://samaaj-backend-kj3r.onrender.com',
        changeOrigin: true,
        secure: true
      },
      '/logout': {
        target: 'https://samaaj-backend-kj3r.onrender.com',
        changeOrigin: true,
        secure: true
      },
      '/api': {
        target: 'https://samaaj-backend-kj3r.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/uploads': {
        // During local development prefer the local backend (PORT=3000)
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
