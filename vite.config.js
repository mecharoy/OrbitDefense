import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'esbuild'
  },
  server: {
    port: 3000,
    open: true
  }
});
