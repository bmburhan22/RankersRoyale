import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { DISCORD_OAUTH2_URL } from './config.js';
const { redirect_uri } = Object.fromEntries(new URL(DISCORD_OAUTH2_URL).searchParams);
const API_URL = JSON.stringify(new URL(redirect_uri).origin);
console.log({ API_URL })
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const BUILDEXT = mode == 'ext';
  return {
    build: {
      outDir: BUILDEXT ? 'dist-ext' : 'dist'
    },
    define: { API_URL, BUILDEXT },
    server: {
      host: true,
      port: 3001,
      https: {
        key: fs.readFileSync('./certs/key.pem'),
        cert: fs.readFileSync('./certs/cert.pem'),
      },
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets:
          !BUILDEXT ? [] :
            [{
              src: 'src/extension/manifest.json',
              dest: '.',
            }
            ],
      }),
    ],
  }
}
)