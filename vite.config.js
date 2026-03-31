import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backendTarget = 'http://172.16.219.107:8080'

const withBackendOrigin = () => ({
  target: backendTarget,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.setHeader('Origin', backendTarget)
      proxyReq.setHeader('Referer', `${backendTarget}/`)
    })
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': withBackendOrigin(),
      '/api': withBackendOrigin(),
    },
  },
})
