#!/usr/bin/env node
/** Poll live verify until deploy cache settles (max 8 attempts, exponential backoff). */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const script = new URL('./verify-live-app.mjs', import.meta.url).pathname
const base = process.argv[2] ?? 'https://motopass.giveabit.io'
const MAX_ATTEMPTS = 8
const BASE_DELAY_MS = 5_000

function verify() {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [script, base], { stdio: 'inherit' })
    child.on('close', code => resolve(code ?? 1))
  })
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  const code = await verify()
  if (code === 0) process.exit(0)
  if (attempt < MAX_ATTEMPTS) {
    const delayMs = BASE_DELAY_MS * 2 ** (attempt - 1)
    console.warn(
      `WARN: live verify attempt ${attempt}/${MAX_ATTEMPTS} failed — retrying in ${delayMs / 1000}s…`,
    )
    await sleep(delayMs)
  }
}
console.error(`FAIL: live verify did not pass after ${MAX_ATTEMPTS} attempts`)
process.exit(1)