import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // NOTE: Never `define` GEMINI_API_KEY here. Anything defined in this block is
    // inlined into the client bundle and is readable by every visitor. The key
    // stays server-side only and is used exclusively by server.ts.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      // HMR is disabled in AI Studio via the DISABLE_HMR env var to prevent
      // flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
