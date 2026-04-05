import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const securityHeaders = {
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large dependencies into separate chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-markdown': ['markdown-it', 'prismjs', 'dompurify'],
          'vendor-time': ['luxon', '@vvo/tzdb'],
        },
      },
    },
  },
});
