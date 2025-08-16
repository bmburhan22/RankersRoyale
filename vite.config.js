import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { HOST, PORT } from './config.js';
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
      port: 8080,
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