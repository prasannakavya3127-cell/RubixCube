import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// cubing.js runs its solver in a Web Worker that imports part of the bundle.
// The rules below keep that worker's import graph free of DOM-only code
// (React DOM, the 3D viewer and the modulepreload helper all touch `document`
// when loaded). Without them the production solver worker fails to start.
const SOLVER_SAFE_CHUNKS = (id) => {
  if (id.includes('node_modules/react')) return 'react';
  if (id.includes('search-worker-entry')) return 'solver-worker';
  if (id.includes('node_modules/cubing/')) {
    return /twisty|puzzle-geometry/.test(id) ? 'cubing-view' : 'cubing';
  }
  return undefined;
};

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    modulePreload: false,
    rollupOptions: { output: { manualChunks: SOLVER_SAFE_CHUNKS } },
    chunkSizeWarningLimit: 1000,
  },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
