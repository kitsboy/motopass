import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Program } from '../types/program'
import catalogJson from '../../research/countries.json'
import { addedWords, latestRuleSentences } from './ruleSentence'

describe('rule sentences', () => {
  it('keeps the words that were not already in the stored before text', () => {
    expect(addedWords('Per importi fino a 120 mila euro', 'Online tutti i servizi per i contribuenti')).toContain('Online')
    expect(addedWords('same opening stays', 'same opening stays and then a new fee')).toContain('new fee')
  })

  it('reads the shipped event log with only the catalog latches marked changed', () => {
    const events = JSON.parse(readFileSync('public/data/source-events.json', 'utf8'))
    const programs = (catalogJson as { programs: Program[] }).programs
    const latched = new Set(programs.filter(program => program.watch?.changed === true).map(program => program.name))
    const sentences = latestRuleSentences(events, programs)
    expect(sentences.every(sentence => sentence.markedChanged === latched.has(sentence.country))).toBe(true)
    expect(sentences.map(sentence => sentence.country)).toContain('Uruguay')
    expect(sentences.map(sentence => sentence.country)).toContain('Italy')
    const uruguay = sentences.find(sentence => sentence.country === 'Uruguay')
    expect(uruguay?.added.length).toBeGreaterThan(20)
  })
})
