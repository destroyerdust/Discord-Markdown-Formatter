import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const DEV_CSP_NONCE = 'vite-dev-csp-nonce';
const securityHeaders = {
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
};

function cspScriptSrcPlugin(scriptSrcValue: string): Plugin {
  return {
    name: 'csp-script-src-transform',
    transformIndexHtml(html) {
      return html.replace('__CSP_SCRIPT_SRC__', scriptSrcValue);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDevServer = command === 'serve';
  const scriptSrcValue = isDevServer ? `'self' 'nonce-${DEV_CSP_NONCE}'` : "'self'";

  return {
    plugins: [react(), tailwindcss(), cspScriptSrcPlugin(scriptSrcValue)],
    html: isDevServer
      ? {
          cspNonce: DEV_CSP_NONCE,
        }
      : undefined,
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
  };
});
