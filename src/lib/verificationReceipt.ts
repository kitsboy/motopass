import { sha256 } from '@noble/hashes/sha2.js'

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

const MAX_RECEIPT_BYTES = 16_000
const MAX_STEPS = 32
const MAX_LIMITS = 40
const MAX_FIELDS = 80
const MAX_STRING = 1_000

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function stableValue(value: unknown): string {
  if (value == null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableValue(record[key])}`)
    .join(',')}}`
}

/** Deterministic bytes for hashing and sharing; pretty printing is not canonical. */
export function canonicalizeVerificationReceipt(receipt: VerificationReceipt): string {
  return stableValue({
    version: receipt.version,
    app: receipt.app,
    tool: receipt.tool,
    title: receipt.title,
    generatedAt: receipt.generatedAt,
    steps: receipt.steps.map(step => ({ label: step.label, state: step.state, ...(step.detail ? { detail: step.detail } : {}) })),
    limits: receipt.limits,
    fields: receipt.fields ?? {},
  })
}

/** SHA-256 of the canonical receipt, used by share links and the proof card. */
export function verificationReceiptDigest(receipt: VerificationReceipt): string {
  return bytesToHex(sha256(new TextEncoder().encode(canonicalizeVerificationReceipt(receipt))))
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(offset, offset + 0x8000))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
  try {
    const binary = atob(base64)
    return Uint8Array.from(binary, char => char.charCodeAt(0))
  } catch {
    return null
  }
}

function isReceiptState(value: unknown): value is VerificationReceiptState {
  return value === 'pass' || value === 'fail' || value === 'unknown'
}

/** Validate a decoded receipt before it is rendered or used in a hash comparison. */
export function parseVerificationReceipt(
  value: unknown,
): { ok: true; receipt: VerificationReceipt } | { ok: false; error: string } {
  if (!value || typeof value !== 'object') return { ok: false, error: 'Receipt is not an object' }
  const candidate = value as Partial<VerificationReceipt>
  if (candidate.version !== 1 || candidate.app !== 'MotoPass') {
    return { ok: false, error: 'Not a MotoPass verification receipt (version 1)' }
  }
  if (
    typeof candidate.tool !== 'string' ||
    !candidate.tool.trim() ||
    candidate.tool.length > 120 ||
    typeof candidate.title !== 'string' ||
    !candidate.title.trim() ||
    candidate.title.length > 300 ||
    typeof candidate.generatedAt !== 'string' ||
    Number.isNaN(Date.parse(candidate.generatedAt))
  ) {
    return { ok: false, error: 'Receipt header fields are missing or malformed' }
  }
  if (!Array.isArray(candidate.steps) || candidate.steps.length > MAX_STEPS) {
    return { ok: false, error: 'Receipt steps are missing or too many' }
  }
  const steps: VerificationReceiptStep[] = []
  for (const step of candidate.steps) {
    if (
      !step ||
      typeof step.label !== 'string' ||
      !step.label.trim() ||
      step.label.length > 200 ||
      !isReceiptState(step.state) ||
      (step.detail != null && (typeof step.detail !== 'string' || step.detail.length > MAX_STRING))
    ) {
      return { ok: false, error: 'A receipt step is malformed' }
    }
    steps.push({ label: step.label, state: step.state, ...(step.detail ? { detail: step.detail } : {}) })
  }
  if (
    !Array.isArray(candidate.limits) ||
    candidate.limits.length > MAX_LIMITS ||
    !candidate.limits.every(limit => typeof limit === 'string' && limit.length <= MAX_STRING)
  ) {
    return { ok: false, error: 'Receipt limits are malformed' }
  }
  const rawFields = candidate.fields ?? {}
  if (typeof rawFields !== 'object' || Array.isArray(rawFields)) {
    return { ok: false, error: 'Receipt fields are malformed' }
  }
  const fields: Record<string, string | number | boolean | null> = {}
  const entries = Object.entries(rawFields as Record<string, unknown>)
  if (entries.length > MAX_FIELDS) return { ok: false, error: 'Receipt has too many fields' }
  for (const [key, field] of entries) {
    if (key.length > 120) return { ok: false, error: 'A receipt field name is too long' }
    if (
      field != null &&
      typeof field !== 'string' &&
      typeof field !== 'number' &&
      typeof field !== 'boolean'
    ) {
      return { ok: false, error: `Receipt field ${key} is not a scalar` }
    }
    if (typeof field === 'string' && field.length > MAX_STRING) {
      return { ok: false, error: `Receipt field ${key} is too long` }
    }
    fields[key] = field as string | number | boolean | null
  }

  return {
    ok: true,
    receipt: {
      version: 1,
      app: 'MotoPass',
      tool: candidate.tool,
      title: candidate.title,
      generatedAt: candidate.generatedAt,
      steps,
      limits: [...candidate.limits],
      fields,
    },
  }
}

export function encodeVerificationReceipt(receipt: VerificationReceipt): string {
  return bytesToBase64Url(new TextEncoder().encode(canonicalizeVerificationReceipt(receipt)))
}

export function decodeVerificationReceipt(payload: string):
  | { ok: true; receipt: VerificationReceipt }
  | { ok: false; error: string } {
  const bytes = base64UrlToBytes(payload)
  if (!bytes || bytes.length > MAX_RECEIPT_BYTES) return { ok: false, error: 'Receipt payload is malformed or too large' }
  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return { ok: false, error: 'Receipt payload is not valid JSON' }
  }
  return parseVerificationReceipt(parsed)
}

export type ReceiptShareLink =
  | { ok: true; url: string; digest: string }
  | { ok: false; error: string }

/**
 * The fragment stays in the browser; it is never sent in an HTTP request.
 * The digest detects edits to the encoded receipt, but only if it was shared
 * or displayed somewhere the recipient can compare it.
 */
export function buildReceiptShareLink(
  receipt: VerificationReceipt,
  origin: string = typeof window === 'undefined' ? '' : window.location.origin,
): ReceiptShareLink {
  const canonical = canonicalizeVerificationReceipt(receipt)
  if (new TextEncoder().encode(canonical).length > MAX_RECEIPT_BYTES) {
    return { ok: false, error: 'This receipt is too large for a link; download the JSON instead' }
  }
  const digest = verificationReceiptDigest(receipt)
  const payload = encodeVerificationReceipt(receipt)
  return { ok: true, url: `${origin}/tools/receipt#r=${payload}&h=${digest}`, digest }
}

export function parseReceiptShareHash(hash: string):
  | { ok: true; receipt: VerificationReceipt; digest: string; providedDigest: string | null; hashMatches: boolean }
  | { ok: false; error: string } {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const payload = params.get('r')
  if (!payload) return { ok: false, error: 'This link has no receipt payload' }
  const providedDigest = params.get('h')
  if (providedDigest && !/^[a-f0-9]{64}$/i.test(providedDigest)) {
    return { ok: false, error: 'The receipt digest in this link is malformed' }
  }
  const decoded = decodeVerificationReceipt(payload)
  if (!decoded.ok) return decoded
  const digest = verificationReceiptDigest(decoded.receipt)
  return {
    ok: true,
    receipt: decoded.receipt,
    digest,
    providedDigest,
    hashMatches: !providedDigest || providedDigest.toLowerCase() === digest,
  }
}
