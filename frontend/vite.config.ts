import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id?: string) {
          if (!id) return
          if (!id.includes('node_modules')) return
          const pathSegments = id.split(/[/\\]/)
          const pkg = pathSegments.includes('node_modules')
            ? pathSegments[pathSegments.indexOf('node_modules') + 1] ?? ''
            : ''
          if (pkg.startsWith('react')) {
            return 'vendor-react'
          }
          if (pkg.includes('react-router')) {
            return 'vendor-router'
          }
          if (pkg === 'sonner') {
            return 'vendor-notifications'
          }
          return undefined
        }
      }
    }
  }
})
