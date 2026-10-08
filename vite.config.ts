import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
  server: {
    port: 5173,
    host: true, // reachable from your phone on the same Wi-Fi
  },
});
