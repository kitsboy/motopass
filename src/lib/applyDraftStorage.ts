export const APPLY_DRAFT_KEY = 'motopass-apply-draft'

export type ApplyDraft = {
  name: string
  program: string
  notes: string
  savedAt: string
}

function isDraft(v: unknown): v is ApplyDraft {
  if (typeof v !== 'object' || v === null) return false
  const d = v as ApplyDraft
  return (
    typeof d.name === 'string' &&
    typeof d.program === 'string' &&
    typeof d.notes === 'string' &&
    typeof d.savedAt === 'string'
  )
}

export function loadApplyDraft(): ApplyDraft | null {
  try {
    const raw = localStorage.getItem(APPLY_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return isDraft(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveApplyDraft(draft: Omit<ApplyDraft, 'savedAt'>): void {
  const payload: ApplyDraft = { ...draft, savedAt: new Date().toISOString() }
  localStorage.setItem(APPLY_DRAFT_KEY, JSON.stringify(payload))
}

export function clearApplyDraft(): void {
  localStorage.removeItem(APPLY_DRAFT_KEY)
}

export function applyFormCompletion(fields: {
  name: string
  program: string
  notes: string
  hasNostr: boolean
}): number {
  let pct = 0
  if (fields.name.trim()) pct += 40
  if (fields.program.trim()) pct += 40
  if (fields.notes.trim()) pct += 10
  if (fields.hasNostr) pct += 10
  return pct
}