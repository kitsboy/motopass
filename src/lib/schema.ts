import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

export const countriesSchema = {
  type: 'object',
  required: ['programs'],
  properties: {
    programs: {
      type: 'array',
      minItems: 25,
      items: {
        type: 'object',
        required: ['id', 'name', 'category', 'region', 'status', 'finance', 'details'],
        properties: {
          id: { type: 'number' },
          name: { type: 'string', minLength: 1 },
          sovereignty_score: { type: 'number', minimum: 0, maximum: 10 },
          stacking_synergy: { type: 'string' },
          risk_level: { type: 'string' },
          lightning_ready: { type: 'boolean' },
          last_verified_block: { type: 'number' },
          satohash_proofs: { type: 'array' },
          finance: {
            type: 'object',
            properties: {
              crypto_friendly_score: { type: ['number', 'null'] },
              min_investment_usd: { type: ['number', 'null'] },
            },
          },
        },
      },
    },
  },
} as const

const validateCountries = ajv.compile(countriesSchema)

export function validateCountriesData(data: unknown): { valid: boolean; errors: string[] } {
  const valid = validateCountries(data)
  if (valid) return { valid: true, errors: [] }
  return {
    valid: false,
    errors: (validateCountries.errors ?? []).map(e => `${e.instancePath} ${e.message}`),
  }
}