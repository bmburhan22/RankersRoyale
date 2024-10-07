import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from  'dotenv';
dotenv.config();
const {DISCORD_OAUTH2_URL} = process.env;
const { redirect_uri } = Object.fromEntries(new URL(DISCORD_OAUTH2_URL).searchParams);
const  API_URL= JSON.stringify(new URL(redirect_uri).origin);
console.log({API_URL})
// https://vitejs.dev/config/
export default defineConfig({
  server:{port:3000},
  plugins: [react()],
  define: {API_URL}
})
