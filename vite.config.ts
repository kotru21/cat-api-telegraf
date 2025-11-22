import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src/web/public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'src/web/public/js/app.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
      },
    },
  },
});
