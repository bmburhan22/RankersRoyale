import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    API_URL: JSON.stringify('http://192.168.3.100:3000')
  }
})
