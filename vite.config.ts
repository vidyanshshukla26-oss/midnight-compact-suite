import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Midnight's wasm-backed runtime packages sometimes need this to
    // avoid pre-bundling issues in dev. Adjust if you hit wasm/module
    // resolution errors — check the docs MCP for the current guidance.
    exclude: ['@midnight-ntwrk/onchain-runtime'],
  },
  server: {
    fs: { strict: false },
  },
});
