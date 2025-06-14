import { defineConfig } from 'vite';

export default defineConfig({
  base: '/f1/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
});