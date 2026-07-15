import { cpSync, createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Bust poisoned CDN asset URLs after SPA-fallback cache incidents */
function readBuildSalt() {
  const info = readFileSync(resolve(__dirname, 'src/lib/buildInfo.ts'), 'utf8')
  const m = info.match(/BUILD_ID\s*=\s*'([^']+)'/)
  return (m?.[1] ?? 'dev').replace(/[^a-zA-Z0-9-]/g, '')
}
const BUILD_SALT = readBuildSalt()

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

const BOOT_GUARD = `<script>
(function(){var shown=false;function recover(){if(shown)return;shown=true;var r=document.getElementById("root");if(!r)return;r.innerHTML='<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;background:#16161f;color:#f5f2ec;font-family:system-ui,sans-serif;text-align:center"><div style="max-width:22rem"><h1 style="margin:0 0 .75rem;font-size:1.25rem">MotoPass is updating</h1><p style="margin:0 0 1.25rem;opacity:.85;font-size:.9rem;line-height:1.5">Your browser cached a deploy artifact. This is not an overlay — the app script failed to load.</p><button type="button" onclick="location.reload()" style="padding:.7rem 1.4rem;border-radius:12px;border:none;background:#ff9500;color:#0a0804;font-weight:600;cursor:pointer">Hard refresh</button></div></div>';}
function poisoned(m){return/Unexpected token '<'|dynamically imported module|Importing a module script failed/i.test(String(m||''));}
window.addEventListener("error",function(e){if(poisoned(e.message))recover();},true);
window.addEventListener("unhandledrejection",function(e){if(poisoned(e.reason&&e.reason.message||e.reason))recover();});
})();
</script>`

function injectBootGuard(): Plugin {
  return {
    name: 'motopass-boot-guard',
    transformIndexHtml(html) {
      return html.replace('</head>', `${BOOT_GUARD}</head>`)
    },
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
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${BUILD_SALT}.js`,
        chunkFileNames: `assets/[name]-[hash]-${BUILD_SALT}.js`,
        assetFileNames: `assets/[name]-[hash]-${BUILD_SALT}[extname]`,
        manualChunks: {
          motion: ['motion'],
          nostr: ['nostr-tools'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  plugins: [react(), injectBootGuard(), motopassStaticAssets()],
  server: {
    fs: {
      strict: false,
    },
  },
})