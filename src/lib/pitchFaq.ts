import type { TranslationKey } from '../i18n/translations'

/** Single source for pitch FAQ copy — shared by PitchPage UI and RouteSeo JSON-LD. */
export const PITCH_FAQ_KEYS = [
  { q: 'pitch.faq.q1' as const, a: 'pitch.faq.a1' as const },
  { q: 'pitch.faq.q2' as const, a: 'pitch.faq.a2' as const },
  { q: 'pitch.faq.q3' as const, a: 'pitch.faq.a3' as const },
  { q: 'pitch.faq.q4' as const, a: 'pitch.faq.a4' as const },
  { q: 'pitch.faq.q5' as const, a: 'pitch.faq.a5' as const },
] as const

export type PitchFaqEntry = { q: TranslationKey; a: TranslationKey }

export function resolvePitchFaqCopy(
  t: (key: TranslationKey) => string,
): { question: string; answer: string }[] {
  return PITCH_FAQ_KEYS.map(({ q, a }) => ({
    question: t(q),
    answer: t(a),
  }))
}