import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow the dev server to serve the pristine demo and research data from root
    fs: {
      strict: false
    }
  }
})