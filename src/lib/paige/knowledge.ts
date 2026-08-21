/**
 * Paige knowledge-base — loads the three machine-readable JSON knowledge files
 * and provides token-based search across facts, member scripts, and endpoints.
 *
 * Sources:
 *   - research/paige/satohash-knowledge.json
 *   - research/paige/intel-pipeline-knowledge.json
 *   - research/paige/vault-stamping-knowledge.json
 *
 * This module is the bridge between the static knowledge files and Paige's
 * RAG retrieval — it indexes facts so they appear alongside program hits.
 */

import satohashKb from '../../../research/paige/satohash-knowledge.json'
import intelKb from '../../../research/paige/intel-pipeline-knowledge.json'
import vaultKb from '../../../research/paige/vault-stamping-knowledge.json'

// ── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgeFact {
  topic: string       // 'satohash' | 'intel-pipeline' | 'vault-stamping'
  text: string
  source: string      // JSON filename
}

export interface KnowledgeScript {
  topic: string
  key: string         // e.g. 'what_is', 'cost', 'verify'
  text: string
}

export interface KnowledgeHit {
  topic: string
  score: number
  facts: string[]
  scripts: string[]
}

// ── Token helpers ────────────────────────────────────────────────────────────

const TOKEN_RE = /[^\s,.;:!?]+/g

function tokenize(text: string): string[] {
  return text.toLowerCase().match(TOKEN_RE)?.filter(t => t.length > 2) ?? []
}

// ── Load & index ─────────────────────────────────────────────────────────────

interface KnowledgeIndex {
  facts: KnowledgeFact[]
  scripts: KnowledgeScript[]
  /** topic → concatenated lowercase text for fast search */
  topicText: Map<string, string>
}

let _index: KnowledgeIndex | null = null

function buildIndex(): KnowledgeIndex {
  if (_index) return _index

  const facts: KnowledgeFact[] = []
  const scripts: KnowledgeScript[] = []
  const topicText = new Map<string, string>()

  // Satohash knowledge
  for (const f of satohashKb.facts) {
    facts.push({ topic: 'satohash', text: f, source: 'satohash-knowledge.json' })
  }
  for (const [key, text] of Object.entries(satohashKb.member_scripts ?? {})) {
    scripts.push({ topic: 'satohash', key, text })
  }
  topicText.set('satohash', [
    satohashKb.facts.join(' '),
    satohashKb.topic,
    'satohash', 'timestamp', 'proof', 'bitcoin', 'hash', 'stamp', 'verify',
  ].join(' ').toLowerCase())

  // Intel pipeline knowledge
  for (const f of intelKb.facts) {
    facts.push({ topic: 'intel-pipeline', text: f, source: 'intel-pipeline-knowledge.json' })
  }
  for (const [key, text] of Object.entries(intelKb.member_scripts ?? {})) {
    scripts.push({ topic: 'intel-pipeline', key, text })
  }
  topicText.set('intel-pipeline', [
    intelKb.facts.join(' '),
    intelKb.topic,
    'pipeline', 'intel', 'daily', 'research', 'fresh', 'stale', 'probe', 'fetch',
  ].join(' ').toLowerCase())

  // Vault stamping knowledge
  for (const f of vaultKb.facts) {
    facts.push({ topic: 'vault-stamping', text: f, source: 'vault-stamping-knowledge.json' })
  }
  for (const [key, text] of Object.entries(vaultKb.member_scripts ?? {})) {
    scripts.push({ topic: 'vault-stamping', key, text })
  }
  topicText.set('vault-stamping', [
    vaultKb.facts.join(' '),
    vaultKb.topic,
    'vault', 'stamp', 'document', 'file', 'registry', 'backup', 'restore',
  ].join(' ').toLowerCase())

  _index = { facts, scripts, topicText }
  return _index
}

// ── Search ───────────────────────────────────────────────────────────────────

/**
 * Search the knowledge base for a query. Returns top topics ranked by
 * token overlap, with the most relevant facts and matching member scripts.
 */
export function searchKnowledge(query: string, limit = 3): KnowledgeHit[] {
  const idx = buildIndex()
  const toks = tokenize(query)
  if (!toks.length) return []

  const results: { topic: string; score: number; facts: string[]; scripts: string[] }[] = []

  for (const [topic, text] of idx.topicText) {
    let score = 0
    for (const t of toks) {
      if (text.includes(t)) score += 2
    }
    if (score === 0) continue

    // Get the most relevant facts for this topic
    const topicFacts = idx.facts.filter(f => f.topic === topic)
    const scoredFacts = topicFacts.map(f => {
      let factScore = 0
      const factLower = f.text.toLowerCase()
      for (const t of toks) {
        if (factLower.includes(t)) factScore += 1
      }
      return { text: f.text, score: factScore }
    }).filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score)

    // Get matching member scripts
    const topicScripts = idx.scripts.filter(s => s.topic === topic)
    const matchingScripts = topicScripts.filter(s => {
      const scriptLower = s.text.toLowerCase()
      return toks.some(t => scriptLower.includes(t))
    })

    results.push({
      topic,
      score,
      facts: scoredFacts.slice(0, 3).map(f => f.text),
      scripts: matchingScripts.slice(0, 2).map(s => s.text),
    })
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Get a member script by topic and key.
 * Returns null if not found.
 */
export function getMemberScript(topic: string, key: string): string | null {
  const idx = buildIndex()
  const script = idx.scripts.find(s => s.topic === topic && s.key === key)
  return script?.text ?? null
}

/**
 * Get all facts for a topic.
 */
export function getTopicFacts(topic: string): string[] {
  const idx = buildIndex()
  return idx.facts.filter(f => f.topic === topic).map(f => f.text)
}

/**
 * Check if a query is about a knowledge-base topic (not a specific country).
 * Returns the top topic if the query matches knowledge content, null otherwise.
 */
export function detectKnowledgeTopic(query: string): string | null {
  const hits = searchKnowledge(query, 1)
  if (hits.length === 0 || hits[0].score < 4) return null
  return hits[0].topic
}

// ── Stats ────────────────────────────────────────────────────────────────────

export interface KnowledgeStats {
  topics: { name: string; facts: number; scripts: number }[]
  totalFacts: number
  totalScripts: number
}

/** Get stats about the loaded knowledge base (for the UI badge). */
export function getKnowledgeStats(): KnowledgeStats {
  const idx = buildIndex()
  const topicNames = ['satohash', 'intel-pipeline', 'vault-stamping']
  const topics = topicNames.map(name => ({
    name,
    facts: idx.facts.filter(f => f.topic === name).length,
    scripts: idx.scripts.filter(s => s.topic === name).length,
  }))
  return {
    topics,
    totalFacts: idx.facts.length,
    totalScripts: idx.scripts.length,
  }
}
