import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
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
        assetFileNames: (assetInfo) => {
          // Ensure CSS from Tailwind has a predictable filename so server templates can link to it
          const ext = assetInfo.name ? path.extname(assetInfo.name) : '';
          if (ext === '.css') return 'tailwind.css';
          return '[name]-[hash][extname]';
        },
      },
    },
  },
});
