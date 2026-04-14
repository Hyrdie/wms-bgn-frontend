import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['3864-2001-448a-2004-527f-548d-755f-cb8f-3cc8.ngrok-free.app'],
  },
})
