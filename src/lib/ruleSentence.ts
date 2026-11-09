export interface RuleEvent {
  kind?: string
  country: string
  date: string
  ts?: string
  url: string
  before?: string | null
  after?: string | null
}

export interface RuleSentence {
  country: string
  date: string
  url: string
  before: string
  after: string
  added: string
  markedChanged: boolean
}

function squash(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/** The part of the new text that is not the shared opening. */
export function addedWords(before: string, after: string): string {
  const prior = squash(before)
  const next = squash(after)
  let index = 0
  while (index < prior.length && index < next.length && prior[index] === next[index]) index += 1
  const space = next.lastIndexOf(' ', index)
  const slice = next.slice(space > 0 ? space + 1 : 0).trim()
  if (slice.length <= 180) return slice
  return `${slice.slice(0, 179).trimEnd()}…`
}

/**
 * Newest stored rule text per country, only where the before and after differ.
 * `markedChanged` follows the catalog latch. A stored sentence is not a new change.
 */
export function latestRuleSentences(
  events: RuleEvent[],
  programs: Array<{ name: string; watch?: { changed?: boolean } | null }>,
): RuleSentence[] {
  const changed = new Map(programs.map(program => [program.name, program.watch?.changed === true]))
  const names = new Set(changed.keys())
  const ordered = events.slice().sort((a, b) => String(b.ts || b.date).localeCompare(String(a.ts || a.date)))
  const seen = new Set<string>()
  const sentences: RuleSentence[] = []
  for (const event of ordered) {
    if (event.kind !== 'rule' || !names.has(event.country) || seen.has(event.country)) continue
    const before = squash(event.before || '')
    const after = squash(event.after || '')
    if (!before || !after || before === after) continue
    seen.add(event.country)
    sentences.push({
      country: event.country,
      date: event.date,
      url: event.url,
      before,
      after,
      added: addedWords(before, after),
      markedChanged: changed.get(event.country) === true,
    })
  }
  return sentences
}
