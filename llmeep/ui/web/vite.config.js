import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative asset URLs, because where this is mounted is a runtime fact, not a
// build-time one — a k8s service decides it, and the same image has to work at
// `/llmeep` or at a domain root. The server injects a <base> tag to match.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:8080' } },
})
