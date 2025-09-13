import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This is needed to expose the server to the host machine
    host: true,
    port: 5173,
    // The proxy configuration for API requests
    proxy: {
      '/api': {
        // We use the service name 'backend' here because Docker's internal
        // DNS will resolve it to the backend container's IP address.
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
});