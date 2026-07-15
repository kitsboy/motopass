#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const countriesPath = resolve(root, 'research/countries.json')
const extPath = resolve(root, 'research/flagship-extensions.json')

const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
const extensions = JSON.parse(readFileSync(extPath, 'utf8'))

let applied = 0
for (const program of data.programs) {
  const ext = extensions[program.name]
  if (!ext) continue
  Object.assign(program, ext)
  if (program.name === 'Bolivia' && program.status === 'To be filled') {
    program.status = 'Researching - Flagship'
  }
  if (program.name === 'Uruguay') {
    program.sovereignty_score = 9
    program.status = 'Flagship - Verified Template'
  }
  applied++
}

writeFileSync(countriesPath, JSON.stringify(data, null, 2) + '\n')
console.log(`Applied flagship extensions to ${applied} programs`)