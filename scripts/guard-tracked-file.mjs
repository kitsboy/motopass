#!/usr/bin/env node
// Fail unless the only tracked change is the path passed as argv[2].
// Shares the porcelain parser with the quote-status guard so a leading
// status space is not trimmed off and eaten as part of the filename.
import { spawnSync } from 'node:child_process'
import { foreignChanges } from './guard-quote-status-pr.mjs'

const allowed = process.argv[2]
if (!allowed) {
  console.error('usage: guard-tracked-file.mjs <path>')
  process.exit(2)
}
const st = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
const changed = foreignChanges(st.stdout, allowed)
if (changed.length) {
  console.error(`diff must touch only ${allowed}; got: ${changed.join(', ')}`)
  process.exit(1)
}
console.log(`diff limited to ${allowed}`)
