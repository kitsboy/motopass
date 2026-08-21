/**
 * Paige knowledge-base — auto-discovers and indexes all knowledge JSON files
 * from research/paige/*-knowledge.json via Vite's import.meta.glob.
 *
 * To add a new topic:
 *   1. Create research/paige/{topic}-knowledge.json following the schema:
 *      { schema, topic, version, build, facts: string[], member_scripts: Record<string, string> }
 *   2. Done — it's loaded automatically at build time.
 *
 * No code changes needed. The glob picks up any *-knowledge.json file.
 */

// ── Schema type ──────────────────────────────────────────────────────────────

interface KnowledgeFile {
  schema: string
  topic: string
  version: string
  build: string
  facts: string[]
  member_scripts?: Record<string, string>
}

// ── Auto-discover all knowledge JSONs ────────────────────────────────────────
// import.meta.glob returns a map of path → async loader.
// Each key is like "../../research/paige/satohash-knowledge.json"
// and each value is () => Promise<{ default: KnowledgeFile }>

const knowledgeModules = import.meta.glob<{ default: KnowledgeFile }>(
  '../../../research/paige/*-knowledge.json',
  { eager: true },
)

// ── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgeFact {
  topic: string
  text: string
  source: string
}

export interface KnowledgeScript {
  topic: string
  key: string
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
  topicText: Map<string, string>
  topicTokens: Map<string, string[]>
}

let _index: KnowledgeIndex | null = null

/** Extract the topic name from a file path like "../../research/paige/satohash-knowledge.json" */
function topicFromPath(path: string): string {
  const filename = path.split('/').pop() ?? ''
  return filename.replace(/-knowledge\.json$/, '')
}

function buildIndex(): KnowledgeIndex {
  if (_index) return _index

  const facts: KnowledgeFact[] = []
  const scripts: KnowledgeScript[] = []
  const topicText = new Map<string, string>()
  const topicTokens = new Map<string, string[]>()

  for (const [path, loader] of Object.entries(knowledgeModules)) {
    const kb: KnowledgeFile = (loader as { default: KnowledgeFile }).default
    const topic = kb.topic || topicFromPath(path)

    // Index facts
    for (const f of kb.facts) {
      facts.push({ topic, text: f, source: `${topic}-knowledge.json` })
    }

    // Index member scripts
    for (const [key, text] of Object.entries(kb.member_scripts ?? {})) {
      scripts.push({ topic, key, text })
    }

    // Build topic search text (facts + topic name split on hyphens)
    // Split topic name on hyphens so "intel-pipeline" matches "intel" and "pipeline"
    const topicNameTokens = topic.split(/[-_]/)
    topicText.set(topic, [
      kb.facts.join(' '),
      topicNameTokens.join(' '),
    ].join(' ').toLowerCase())
    topicTokens.set(topic, topicNameTokens.map(t => t.toLowerCase()))
  }

  _index = { facts, scripts, topicText, topicTokens }
  return _index
}

// Force rebuild (for tests or hot-reload scenarios)
export function resetKnowledgeIndex(): void {
  _index = null
}

// ── Search ───────────────────────────────────────────────────────────────────

/**
 * Search the knowledge base for a query. Returns top topics ranked by
 * token overlap, with the most relevant facts and matching member scripts.
 */
export function searchKnowledge(query: string, limit = 5): KnowledgeHit[] {
  const idx = buildIndex()
  const toks = tokenize(query)
  if (!toks.length) return []

  const results: { topic: string; score: number; facts: string[]; scripts: string[] }[] = []

  for (const [topic, text] of idx.topicText) {
    let score = 0
    const nameTokens = idx.topicTokens.get(topic) ?? []
    for (const t of toks) {
      if (text.includes(t)) {
        score += 2
        // Boost when query token exactly matches a topic name token
        if (nameTokens.includes(t)) score += 3
      }
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

  // Collect unique topic names from facts + scripts
  const topicNames = [...new Set([
    ...idx.facts.map(f => f.topic),
    ...idx.scripts.map(s => s.topic),
  ])]

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

/**
 * List all loaded topic names.
 */
export function listTopics(): string[] {
  const idx = buildIndex()
  return [...new Set(idx.facts.map(f => f.topic))]
}
