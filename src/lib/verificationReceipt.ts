/**
 * A portable, human-readable record of one verification attempt.
 *
 * It records what this browser checked, what it could not check, and the
 * generated fields shown on screen. It is not a signature, a timestamp proof
 * or evidence that a payment happened.
 */

export type VerificationReceiptState = 'pass' | 'fail' | 'unknown'

export interface VerificationReceiptStep {
  label: string
  state: VerificationReceiptState
  detail?: string
}

export interface VerificationReceiptInput {
  tool: string
  title: string
  steps: VerificationReceiptStep[]
  limits: string[]
  fields?: Record<string, string | number | boolean | null>
}

export interface VerificationReceipt extends VerificationReceiptInput {
  version: 1
  app: 'MotoPass'
  generatedAt: string
}

export function buildVerificationReceipt(
  input: VerificationReceiptInput,
  now: Date = new Date(),
): VerificationReceipt {
  return {
    version: 1,
    app: 'MotoPass',
    tool: input.tool,
    title: input.title,
    generatedAt: now.toISOString(),
    steps: input.steps.map(step => ({ ...step })),
    limits: [...input.limits],
    fields: { ...(input.fields ?? {}) },
  }
}

export function serializeVerificationReceipt(receipt: VerificationReceipt): string {
  return `${JSON.stringify(receipt, null, 2)}\n`
}

export function verificationReceiptFilename(tool: string, now: Date = new Date()): string {
  const safeTool = tool.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'check'
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `motopass-${safeTool}-${stamp}.json`
}
