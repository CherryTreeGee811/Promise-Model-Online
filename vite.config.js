import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'PromiseModelOnline.Client/wwwroot',
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'PromiseModelOnline.Client/wwwroot/js/router.mjs'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
