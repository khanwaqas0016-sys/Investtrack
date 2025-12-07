import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      // Map VITE_API_KEY from Vercel to process.env.API_KEY for compatibility
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
          'vendor-ai': ['@google/generative-ai']
        }
      }
    }
  }
});