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

/** Lighter schema for custom program JSON imports (Zod-like Ajv checks). */
export const programImportSchema = {
  type: 'object',
  required: ['id', 'name', 'category', 'region', 'status', 'finance', 'details'],
  properties: {
    id: { type: 'number' },
    name: { type: 'string', minLength: 1 },
    category: { type: 'string', minLength: 1 },
    region: { type: 'string', minLength: 1 },
    status: { type: 'string', minLength: 1 },
    bitcoin_integration: { type: 'string' },
    details: { type: 'string', minLength: 1 },
    last_checked: { type: 'string' },
    sovereignty_score: { type: 'number', minimum: 0, maximum: 10 },
    stacking_synergy: { type: 'string' },
    risk_level: { type: 'string' },
    lightning_ready: { type: 'boolean' },
    finance: {
      type: 'object',
      properties: {
        min_investment_usd: { type: ['number', 'null'] },
        typical_investment_usd: { type: ['number', 'null'] },
        gov_fees_usd: { type: ['number', 'null'] },
        processing_time_months: { type: ['string', 'null'] },
        tax_benefits: { type: 'string' },
        crypto_friendly_score: { type: ['number', 'null'], minimum: 0, maximum: 10 },
        bitcoin_specific: { type: 'string' },
      },
    },
  },
} as const

const validateProgramImport = ajv.compile(programImportSchema)

export function validateProgramImportEntry(entry: unknown): { valid: boolean; errors: string[] } {
  const valid = validateProgramImport(entry)
  if (valid) return { valid: true, errors: [] }
  return {
    valid: false,
    errors: (validateProgramImport.errors ?? []).map(e => `${e.instancePath || '/'} ${e.message}`),
  }
}