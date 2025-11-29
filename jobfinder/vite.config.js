import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend dev server runs on 5174 and proxies API calls to backend on 5173
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // If your backend does not have /api prefix, remove rewrite
        // and call full paths in your API client.
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
