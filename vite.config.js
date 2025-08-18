import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { HOST, PORT, CLIENT_PORT } from './config.js';
const API_URL = JSON.stringify(new URL(`https://${HOST}:${PORT}`).origin);
console.log({ API_URL })

export default defineConfig(({ mode }) => {
  const BUILDEXT = mode == 'ext';
  return {
    build: {
      outDir: BUILDEXT ? 'dist-ext' : 'dist'
    },
    define: { API_URL, BUILDEXT },
    server: {
      host: true,
      port: CLIENT_PORT,
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