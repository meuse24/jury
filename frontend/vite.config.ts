import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/jurysystem'

  return {
    plugins: [react()],
    base: basePath + '/',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
    server: {
      proxy: {
        // Forward /api calls to the PHP dev server during local dev
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
    },
  }
})
