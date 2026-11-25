/// <reference types="node" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// O front chama sempre /api/... e o Vite repassa para a API.
// No Docker o alvo é http://api:3000 (setado no docker-compose.yml).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
