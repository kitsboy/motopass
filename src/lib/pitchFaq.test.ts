import { describe, expect, it } from 'vitest'
import { PITCH_FAQ_KEYS, resolvePitchFaqCopy } from './pitchFaq'
import { pitchFaqJsonLd } from './siteJsonLd'

describe('pitchFaq', () => {
  it('exports five FAQ entries', () => {
    expect(PITCH_FAQ_KEYS).toHaveLength(5)
  })

  it('resolvePitchFaqCopy maps translation keys', () => {
    const copy = resolvePitchFaqCopy(k => `t:${k}`)
    expect(copy[0].question).toBe('t:pitch.faq.q1')
    expect(copy[0].answer).toBe('t:pitch.faq.a1')
  })

  it('pitchFaqJsonLd enriches FAQPage from live copy', () => {
    const ld = pitchFaqJsonLd([
      { question: 'What is MotoPass?', answer: 'Bitcoin-native sovereign intelligence.' },
    ])
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.inLanguage).toBe('en')
    expect(ld.mainEntity).toHaveLength(1)
    expect(ld.mainEntity[0].acceptedAnswer.speakable).toBeDefined()
    expect(ld.isPartOf['@type']).toBe('WebPage')
  })
})