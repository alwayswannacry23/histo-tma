import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('lucide-react')) {
              return 'vendor';
            }
          }
          if (
            id.includes('src/data/histoData') ||
            id.includes('src/data/examQuestionsData') ||
            id.includes('src/data/electronogramsData')
          ) {
            return 'histo-data';
          }
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
});
