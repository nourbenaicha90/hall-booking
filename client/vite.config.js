import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// في التطوير: كل طلبات /api و /uploads تُحوَّل إلى الخادم
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
