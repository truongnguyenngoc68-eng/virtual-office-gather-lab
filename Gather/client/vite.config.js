import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true,
      interval: 300,
    },
    hmr: {
      port: 5173,
    },
  },
  resolve: {
    alias: {
      events: path.resolve('node_modules/events'),
      util: path.resolve('node_modules/util'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})