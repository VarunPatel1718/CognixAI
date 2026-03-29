import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          clerk: ['@clerk/clerk-react'],
          pdf: ['pdfjs-dist'],
        }
      }
    },
    chunkSizeWarningLimit: 2000,
    timeout: 120000
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
})
