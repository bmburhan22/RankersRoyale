import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server:{port:3000},
  plugins: [react()],
  define: {
    API_URL: JSON.stringify('https://moray-organic-robin.ngrok-free.app')
  }
})
