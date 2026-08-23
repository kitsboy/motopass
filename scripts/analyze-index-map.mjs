#!/usr/bin/env node
/* Analyze the built index chunk sourcemap to list the largest contributing modules. */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '../dist/assets')
import { readdirSync } from 'node:fs'

// Find the index chunk
const files = readdirSync(DIST)
const indexJs = files.find(f => /^index-.*\.js$/.test(f) && !f.endsWith('.map'))
const indexMap = files.find(f => /^index-.*\.js\.map$/.test(f))
console.log('index js :', indexJs)
console.log('index map:', indexMap)

if (!indexMap) { console.log('no map'); process.exit(0) }

const map = JSON.parse(readFileSync(resolve(DIST, indexMap), 'utf8'))
const sources = map.sources || []
const contents = map.sourcesContent || []

// Group by top-level source root (node_modules vs src)
const rows = []
for (let i = 0; i < sources.length; i++) {
  const src = sources[i]
  const content = contents[i] || ''
  rows.push({ src, bytes: Buffer.byteLength(content) })
}

// Aggregate by category
const cat = {}
let srcTotal = 0
for (const r of rows) {
  let c
  if (r.src.startsWith('node_modules/')) {
    const parts = r.src.split('/')
    c = 'nm:' + (parts[1] || '?')
  } else {
    c = 'src'
  }
  cat[c] = (cat[c] || 0) + r.bytes
  srcTotal += r.bytes
}

console.log('\n=== Source bytes by category (from map) ===')
Object.entries(cat).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>{
  console.log(`${(v/1024).toFixed(1).padStart(9)} KB  ${k}`)
})
console.log(`\nTotal source bytes mapped: ${(srcTotal/1024).toFixed(1)} KB`)

// Top node_modules by size
console.log('\n=== Top node_modules contributors ===')
Object.entries(cat).filter(([k])=>k.startsWith('nm:')).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([k,v])=>{
  console.log(`${(v/1024).toFixed(1).padStart(9)} KB  ${k}`)
})

// Top individual src files
console.log('\n=== Top src modules ===')
rows.filter(r=>r.src.startsWith('src/') || !r.src.startsWith('node_modules'))
  .sort((a,b)=>b.bytes-a.bytes).slice(0,30).forEach(r=>{
  console.log(`${(r.bytes/1024).toFixed(1).padStart(9)} KB  ${r.src}`)
})
