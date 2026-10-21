import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import {defineConfig} from 'vite';

dotenv.config({ override: true });

export default defineConfig(() => {
  const fallbackClientId = '398274708628-jlja4cs8fpbe7n8677ra3uorid2fr5ck.apps.googleusercontent.com';
  const rawClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
  const cleanCandidate = rawClientId.replace(/^["']|["']$/g, '').trim();

  const isCandidateValid = Boolean(
    cleanCandidate &&
    !cleanCandidate.startsWith('http://') &&
    !cleanCandidate.startsWith('https://') &&
    !cleanCandidate.includes('/') &&
    !cleanCandidate.includes('your-google-client-id') &&
    /^[0-9]+[a-z0-9_-]*\.apps\.googleusercontent\.com$/i.test(cleanCandidate)
  );

  const cleanClientId = isCandidateValid ? cleanCandidate : fallbackClientId;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(cleanClientId),
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
