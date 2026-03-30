import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/auth": {
        target: "http://172.16.219.107:8080",
        changeOrigin: true,
      },
      "/api": {                              // ← add this block
        target: "http://172.16.219.107:8080",
        changeOrigin: true,
      },
    },
  },
})