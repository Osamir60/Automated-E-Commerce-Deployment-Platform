import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      'k8s-ecom-ecomingr-92a6a1c1da-784454221.us-east-1.elb.amazonaws.com'
    ],
    watch: {
      usePolling: true,
    },
  },
})
