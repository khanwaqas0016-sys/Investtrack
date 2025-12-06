import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite automatically loads VITE_ env vars, no need for manual 'define' for them
  // unless replacing process.env which is not recommended for Vite apps.
});