import { cpSync, createReadStream, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const STATIC_DIRS = ['research', 'website', 'images'] as const
// public/ is served automatically by Vite (logo.png, images/kimi.jpg, sitemap, robots)

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
}

function shouldSkipAsset(name: string) {
  return name.endsWith('.tmp') || name.includes('_backup_')
}

function copyDirFiltered(source: string, dest: string) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(source)) {
    if (shouldSkipAsset(entry)) continue
    const from = resolve(source, entry)
    const to = resolve(dest, entry)
    if (statSync(from).isDirectory()) {
      copyDirFiltered(from, to)
    } else {
      cpSync(from, to)
    }
  }
}

function copyStaticAssets(outDir: string) {
  for (const dir of STATIC_DIRS) {
    const source = resolve(__dirname, dir)
    if (!existsSync(source)) continue
    copyDirFiltered(source, resolve(outDir, dir))
  }
}

function serveStaticRoot(root: string) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url) return next()
    const urlPath = decodeURIComponent(req.url.split('?')[0])
    const filePath = resolve(root, '.' + urlPath)
    if (!filePath.startsWith(root) || !existsSync(filePath)) return next()
    const stat = statSync(filePath)
    if (!stat.isFile()) return next()
    const ext = extname(filePath)
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
    createReadStream(filePath).pipe(res)
  }
}

function motopassStaticAssets(): Plugin {
  return {
    name: 'motopass-static-assets',
    configureServer(server) {
      for (const dir of STATIC_DIRS) {
        const source = resolve(__dirname, dir)
        if (!existsSync(source)) continue
        server.middlewares.use(`/${dir}`, serveStaticRoot(source))
      }
    },
    closeBundle() {
      copyStaticAssets(resolve(__dirname, 'dist'))
    },
  }
}

export default defineConfig({
  plugins: [react(), motopassStaticAssets()],
  server: {
    fs: {
      strict: false,
    },
  },
})