#!/usr/bin/env node
/** Poll live verify until deploy cache settles (max ~2 min). */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const script = new URL('./verify-live-app.mjs', import.meta.url).pathname
const base = process.argv[2] ?? 'https://motopass.giveabit.io'

function verify() {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [script, base], { stdio: 'inherit' })
    child.on('close', code => resolve(code ?? 1))
  })
}

for (let attempt = 1; attempt <= 12; attempt++) {
  const code = await verify()
  if (code === 0) process.exit(0)
  if (attempt < 12) {
    console.warn(`WARN: live verify attempt ${attempt} failed — retrying in 10s…`)
    await sleep(10_000)
  }
}
console.error('FAIL: live verify did not pass after 12 attempts')
process.exit(1)