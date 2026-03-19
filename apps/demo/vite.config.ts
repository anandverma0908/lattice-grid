import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Point workspace dep to local source for hot-reload DX
      '@virtual-grid/core': resolve(__dirname, '../../packages/virtual-grid/src/index.ts'),
    },
  },
  server: {
    port: 3000,
  },
});
