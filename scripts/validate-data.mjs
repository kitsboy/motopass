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
      },
    },
  },
}
const validate = ajv.compile(schema)
if (!validate(data)) {
  console.error('Schema validation failed:', validate.errors)
  process.exit(1)
}
console.log(`Validated ${data.programs.length} programs`)