import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'socket.io-client',
      'zustand',
    ],
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
      '/assets': {
        target: 'http://localhost:3001',
        bypass: (req) => {
          // 只代理图片文件到后端，其他请求交给 Vite 自己处理
          if (/\.(png|jpe?g|svg|gif|webp|avif|bmp|ico)$/i.test(req.url || '')) {
            return // undefined → 走代理
          }
          return req.url // 返回路径 → Vite 自己处理，不代理
        },
      },
    },
  },
})
