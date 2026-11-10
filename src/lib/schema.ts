/**
 * Lightweight runtime validation for the published country snapshot and for
 * optional user-imported programs.
 *
 * This used to compile Ajv schemas in the browser, which put a ~136 KB
 * validator chunk on the critical path for a feature most visitors never use.
 * The accepted shape is deliberately small, so explicit checks are smaller,
 * easier to audit and produce the same public result.
 */

type Validation = { valid: boolean; errors: string[] }
type RecordValue = Record<string, unknown>

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function optionalNumber(errors: string[], value: unknown, path: string, min = 0, max = Number.MAX_SAFE_INTEGER): void {
  if (value == null) return
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push(`${path} must be a number`)
  } else if (value < min || value > max) {
    errors.push(`${path} must be between ${min} and ${max}`)
  }
}

function optionalString(errors: string[], value: unknown, path: string): void {
  if (value != null && typeof value !== 'string') errors.push(`${path} must be a string`)
}

function validateRequiredProgram(errors: string[], value: unknown, path: string): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return
  }
  if (typeof value.id !== 'number' || !Number.isFinite(value.id)) errors.push(`${path}/id must be a number`)
  for (const field of ['name', 'category', 'region', 'status', 'details'] as const) {
    if (!nonEmptyString(value[field])) errors.push(`${path}/${field} must be a non-empty string`)
  }
  if (!isRecord(value.finance)) errors.push(`${path}/finance must be an object`)
}

export function validateCountriesData(data: unknown): Validation {
  const errors: string[] = []
  if (!isRecord(data)) return { valid: false, errors: ['/ must be an object'] }
  if (!Array.isArray(data.programs)) return { valid: false, errors: ['/programs must be an array'] }
  if (data.programs.length < 21) errors.push('/programs must contain at least 21 items')
  data.programs.forEach((program, index) => {
    const path = `/programs/${index}`
    validateRequiredProgram(errors, program, path)
    if (!isRecord(program)) return
    optionalNumber(errors, program.sovereignty_score, `${path}/sovereignty_score`, 0, 10)
    optionalString(errors, program.stacking_synergy, `${path}/stacking_synergy`)
    optionalString(errors, program.risk_level, `${path}/risk_level`)
    if (program.lightning_ready != null && typeof program.lightning_ready !== 'boolean') {
      errors.push(`${path}/lightning_ready must be a boolean`)
    }
    if (isRecord(program.finance)) {
      optionalNumber(errors, program.finance.crypto_friendly_score, `${path}/finance/crypto_friendly_score`, 0, 10)
      optionalNumber(errors, program.finance.min_investment_usd, `${path}/finance/min_investment_usd`)
    }
  })
  return { valid: errors.length === 0, errors }
}

export function validateProgramImportEntry(entry: unknown): Validation {
  const errors: string[] = []
  validateRequiredProgram(errors, entry, '')
  if (!isRecord(entry)) return { valid: false, errors }
  optionalString(errors, entry.bitcoin_integration, '/bitcoin_integration')
  optionalString(errors, entry.last_checked, '/last_checked')
  optionalNumber(errors, entry.sovereignty_score, '/sovereignty_score', 0, 10)
  optionalString(errors, entry.stacking_synergy, '/stacking_synergy')
  optionalString(errors, entry.risk_level, '/risk_level')
  if (entry.lightning_ready != null && typeof entry.lightning_ready !== 'boolean') {
    errors.push('/lightning_ready must be a boolean')
  }
  if (isRecord(entry.finance)) {
    for (const field of ['min_investment_usd', 'typical_investment_usd', 'gov_fees_usd'] as const) {
      optionalNumber(errors, entry.finance[field], `/finance/${field}`)
    }
    optionalString(errors, entry.finance.processing_time_months, '/finance/processing_time_months')
    optionalString(errors, entry.finance.tax_benefits, '/finance/tax_benefits')
    optionalNumber(errors, entry.finance.crypto_friendly_score, '/finance/crypto_friendly_score', 0, 10)
    optionalString(errors, entry.finance.bitcoin_specific, '/finance/bitcoin_specific')
  }
  return { valid: errors.length === 0, errors }
}
