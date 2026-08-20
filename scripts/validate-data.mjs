import { readFileSync } from 'node:fs'
import Ajv from 'ajv'

const data = JSON.parse(readFileSync('research/countries.json', 'utf8'))
const ajv = new Ajv()
const schema = {
  type: 'object',
  required: ['programs'],
  properties: {
    programs: {
      type: 'array',
      minItems: 25,
      items: {
        type: 'object',
        required: ['id', 'name', 'sovereignty_score', 'stacking_synergy', 'risk_level'],
        properties: {
          // Schema v3 — intel blocks required once the pipeline is live.
          freshness: {
            type: 'object',
            required: ['status', 'days_stale'],
            properties: {
              status: { enum: ['fresh', 'watch', 'stale'] },
              days_stale: { type: 'integer', minimum: 0 },
            },
          },
          watch: { type: 'object' },
          pros: { type: 'array' },
          cons: { type: 'array' },
          scorecard: { type: 'object' },
          audit_trail: { type: 'array' },
        },
      },
    },
  },
}
const validate = ajv.compile(schema)
if (!validate(data)) {
  console.error('Schema validation failed:', validate.errors)
  process.exit(1)
}

// Staleness is a hard warning (the daily pipeline + research heals it), never
// a deploy blocker — but it must be surfaced so humans see the honest state.
let fresh = 0
let watch = 0
let stale = 0
for (const p of data.programs) {
  const status = p.freshness?.status
  if (status === 'fresh') fresh++
  else if (status === 'watch') watch++
  else stale++
}
if (stale > 0) {
  console.warn(`⚠ Staleness: ${fresh} fresh · ${watch} watch · ${stale} stale (heal via research + daily intel)`)
}
console.log(`Validated ${data.programs.length} programs (schema v3 blocks present)`)
