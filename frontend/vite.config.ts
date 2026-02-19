import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Recursively copy a directory
function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    entry.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d)
  }
}

// Plugin: after build, copy backend + data into dist/ and write .htaccess
function assembleDistPlugin(basePath: string) {
  return {
    name: 'assemble-dist',
    closeBundle() {
      const root = path.resolve(__dirname, '..')
      const dist = path.resolve(root, 'dist')

      // 1. .htaccess
      const htaccess = [
        'Options -Indexes',
        '',
        'RewriteEngine On',
        `RewriteBase ${basePath}/`,
        '',
        '# Block data/ directory',
        'RewriteRule ^data(/|$) - [F,L]',
        '',
        '# Route /api/* to PHP router',
        'RewriteCond %{REQUEST_FILENAME} !-f',
        'RewriteRule ^api/(.*)$ api/index.php [QSA,L]',
        '',
        '# SPA fallback: everything else → index.html',
        'RewriteCond %{REQUEST_FILENAME} !-f',
        'RewriteCond %{REQUEST_FILENAME} !-d',
        'RewriteRule ^(.*)$ index.html [QSA,L]',
      ].join('\n')
      fs.writeFileSync(path.join(dist, '.htaccess'), htaccess)
      console.log('✓ .htaccess written')

      // 2. Copy backend/api/ → dist/api/
      const apiSrc  = path.join(root, 'backend', 'api')
      const apiDest = path.join(dist, 'api')
      copyDirSync(apiSrc, apiDest)
      // Patch BASE_PATH in config.php
      const configPath = path.join(apiDest, 'config.php')
      let config = fs.readFileSync(configPath, 'utf8')
      config = config.replace(
        /define\('BASE_PATH',.*\);/,
        `define('BASE_PATH', '${basePath}');`
      )
      fs.writeFileSync(configPath, config)
      // Patch RewriteBase in api/.htaccess
      const apiHtaccess = path.join(apiDest, '.htaccess')
      let ah = fs.readFileSync(apiHtaccess, 'utf8')
      ah = ah.replace(/RewriteBase .*/, `RewriteBase ${basePath}/api/`)
      fs.writeFileSync(apiHtaccess, ah)
      console.log('✓ backend/api copied → dist/api/ (BASE_PATH patched)')

      // 3. Copy data/ → dist/data/
      const dataSrc  = path.join(root, 'data')
      const dataDest = path.join(dist, 'data')
      copyDirSync(dataSrc, dataDest)
      console.log('✓ data/ copied → dist/data/')
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/jurysystem'

  return {
    plugins: [react(), assembleDistPlugin(basePath)],
    base: basePath + '/',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
    server: {
      proxy: {
        // Proxy /jurysystem/api/* → PHP dev server
        // The key must match the full prefix the frontend sends
        [`${basePath}/api`]: {
          target: env.VITE_API_TARGET || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
