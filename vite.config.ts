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
(function(){var shown=false,retrying=false,KEY="motopass-cache-retry",COUNT=3;
function bust(){var u=new URL(location.href);u.searchParams.set("cb",String(Date.now()));location.replace(u.toString());}
function shell(title,body,extra){var r=document.getElementById("root");if(!r)return;r.innerHTML='<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;background:#16161f;color:#f5f2ec;font-family:system-ui,sans-serif;text-align:center"><div style="max-width:24rem"><h1 style="margin:0 0 .75rem;font-size:1.2rem;font-weight:600">'+title+'</h1><p style="margin:0 0 1rem;opacity:.88;font-size:.9rem;line-height:1.55">'+body+'</p>'+extra+'</div></div>';}
function showCountdown(sec,cb){var n=sec;function tick(){if(n<=0){cb();return;}shell("Almost there","Your browser kept an older deploy. We will fetch a fresh copy automatically.",'<p id="mp-count" style="margin:0 0 1rem;font-variant-numeric:tabular-nums;opacity:.7;font-size:.85rem">Retrying in <strong>'+n+'</strong>s…</p><button type="button" id="mp-reload-btn" style="padding:.65rem 1.3rem;border-radius:12px;border:none;background:#ff9500;color:#0a0804;font-weight:600;cursor:pointer">Load now</button>');var b=document.getElementById("mp-reload-btn");if(b)b.onclick=function(){sessionStorage.removeItem(KEY);cb();};n--;setTimeout(tick,1000);}tick();}
function showUI(){shell("MotoPass needs a quick refresh","Cached deploy files blocked startup — your account and data are fine. Load a fresh copy below, or hard-refresh your browser.",'<button type="button" id="mp-reload-btn" style="padding:.7rem 1.4rem;border-radius:12px;border:none;background:#ff9500;color:#0a0804;font-weight:600;cursor:pointer">Load fresh copy</button><p style="margin:1rem 0 0;opacity:.55;font-size:.75rem;line-height:1.4">Mac: Cmd+Shift+R · Windows: Ctrl+Shift+R</p>');var b=document.getElementById("mp-reload-btn");if(b)b.onclick=function(){sessionStorage.removeItem(KEY);bust();};}
function recover(){if(shown||retrying)return;if(!sessionStorage.getItem(KEY)){retrying=true;showCountdown(COUNT,function(){sessionStorage.setItem(KEY,"1");retrying=false;bust();});return;}sessionStorage.removeItem(KEY);shown=true;showUI();}
window.__mpRetryLoad=recover;
function poisoned(m){return/Unexpected token '<'|dynamically imported module|Importing a module script failed/i.test(String(m||""));}
window.addEventListener("error",function(e){if(poisoned(e.message))recover();},true);
window.addEventListener("unhandledrejection",function(e){if(poisoned(e.reason&&e.reason.message||e.reason))recover();});
})();
</script>`

function injectBootGuard(): Plugin {
  return {
    name: 'motopass-boot-guard',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace('<head>', `<head>${BOOT_GUARD}`)
      },
    },
  }
}

/** Cache-bust all /assets/ URLs and load entry via dynamic import (retry on poison). */
function safeAssetLoader(): Plugin {
  const bust = BUILD_SALT
  return {
    name: 'motopass-safe-assets',
    enforce: 'post',
    transformIndexHtml(html) {
      let out = html.replace(
        /(<(?:script|link)[^>]+(?:src|href)=")(\/assets\/[^"?]+)(")/g,
        `$1$2?b=${bust}$3`,
      )
      out = out.replace(
        /<script type="module" crossorigin src="(\/assets\/index-[^"]+\.js)\?b=[^"]+"><\/script>/,
        `<script type="module">import("$1?b=${bust}").catch(function(){window.__mpRetryLoad&&window.__mpRetryLoad();});</script>`,
      )
      return out
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
  plugins: [react(), injectBootGuard(), safeAssetLoader(), motopassStaticAssets()],
  server: {
    fs: {
      strict: false,
    },
  },
})