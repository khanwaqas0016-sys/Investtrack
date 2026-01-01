
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This allows the code to use process.env.API_KEY in the browser
    'process.env': {
      API_KEY: process.env.VITE_API_KEY || process.env.API_KEY
    }
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['lucide-react', 'recharts'],
          'vendor-ai': ['@google/genai']
        }
      }
    }
  }
});
