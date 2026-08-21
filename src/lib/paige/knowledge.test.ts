import { describe, it, expect } from 'vitest'
import { searchKnowledge, getMemberScript, getTopicFacts, detectKnowledgeTopic, listTopics, getKnowledgeStats } from './knowledge'

describe('searchKnowledge', () => {
  it('finds satohash topic for stamp-related queries', () => {
    const hits = searchKnowledge('how do I stamp my document')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some(h => h.topic === 'vault-stamping')).toBe(true)
  })

  it('finds intel-pipeline topic for freshness queries', () => {
    const hits = searchKnowledge('how does MotoPass keep data fresh')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some(h => h.topic === 'intel-pipeline')).toBe(true)
  })

  it('finds satohash topic for verification queries', () => {
    const hits = searchKnowledge('verify proof on Bitcoin')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some(h => h.topic === 'satohash')).toBe(true)
  })

  it('returns empty for nonsense query', () => {
    const hits = searchKnowledge('xyzzy plugh')
    expect(hits.length).toBe(0)
  })

  it('returns facts and scripts for matched topics', () => {
    const hits = searchKnowledge('document stamping vault')
    const vaultHit = hits.find(h => h.topic === 'vault-stamping')
    expect(vaultHit).toBeDefined()
    expect(vaultHit!.facts.length).toBeGreaterThan(0)
    expect(vaultHit!.scripts.length).toBeGreaterThan(0)
  })
})

describe('getMemberScript', () => {
  it('returns a known script', () => {
    const script = getMemberScript('satohash', 'what_is')
    expect(script).toContain('Satohash')
  })

  it('returns null for unknown key', () => {
    const script = getMemberScript('satohash', 'nonexistent')
    expect(script).toBeNull()
  })

  it('returns null for unknown topic', () => {
    const script = getMemberScript('nonexistent', 'what_is')
    expect(script).toBeNull()
  })
})

describe('getTopicFacts', () => {
  it('returns facts for a known topic', () => {
    const facts = getTopicFacts('satohash')
    expect(facts.length).toBeGreaterThan(0)
    expect(facts.some(f => f.includes('Satohash'))).toBe(true)
  })

  it('returns empty array for unknown topic', () => {
    const facts = getTopicFacts('nonexistent')
    expect(facts.length).toBe(0)
  })
})

describe('detectKnowledgeTopic', () => {
  it('detects vault-stamping topic', () => {
    const topic = detectKnowledgeTopic('vault stamping file upload document registry export import')
    expect(topic).toBe('vault-stamping')
  })

  it('detects intel-pipeline topic', () => {
    const topic = detectKnowledgeTopic('intel pipeline freshness probe source watchdog')
    expect(topic).toBe('intel-pipeline')
  })

  it('detects satohash topic', () => {
    const topic = detectKnowledgeTopic('Satohash API stamp hash Bitcoin OpenTimestamps')
    expect(topic).toBe('satohash')
  })

  it('returns null for low-confidence queries', () => {
    const topic = detectKnowledgeTopic('hello')
    expect(topic).toBeNull()
  })
})

describe('listTopics', () => {
  it('returns all auto-discovered topics', () => {
    const topics = listTopics()
    expect(topics).toContain('satohash')
    expect(topics).toContain('intel-pipeline')
    expect(topics).toContain('vault-stamping')
    expect(topics.length).toBeGreaterThanOrEqual(3)
  })
})

describe('getKnowledgeStats', () => {
  it('returns stats for all loaded topics', () => {
    const stats = getKnowledgeStats()
    expect(stats.topics.length).toBeGreaterThanOrEqual(3)
    expect(stats.totalFacts).toBeGreaterThanOrEqual(30)
    expect(stats.totalScripts).toBeGreaterThanOrEqual(10)
    // Each topic should have facts
    for (const t of stats.topics) {
      expect(t.facts).toBeGreaterThan(0)
    }
  })
})
