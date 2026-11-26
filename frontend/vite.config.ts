/// <reference types="node" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { apiDemonstracao } from './dev/apiDemonstracao';

// O front chama sempre /api/... e o Vite repassa para a API.
// No Docker o alvo é http://api:3000 (setado no docker-compose.yml).
export default defineConfig(({ command, mode, isPreview }) => {
  const simulacao = command === 'serve' && !isPreview && mode === 'demonstracao';
  return {
    plugins: [react(), ...(simulacao ? [apiDemonstracao()] : [])],
    server: {
      port: 5173,
      // O Docker Desktop pode não receber eventos de arquivos salvos pelo Windows.
      // O polling verifica alterações a cada 500 ms; pode ser desativado com VITE_USE_POLLING=false.
      watch: {
        usePolling: process.env.VITE_USE_POLLING !== 'false',
        interval: 500,
      },
      proxy: simulacao ? undefined : {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
