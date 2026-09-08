import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    port: 5173,
    // Same-origin in dev: the browser only ever talks to :5173.
    // Mirrors the production rewrite, so cookies stay SameSite=Strict.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
