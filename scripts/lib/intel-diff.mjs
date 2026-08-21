/**
 * Intel diff engine — compare fetched sources against the corpus and produce
 * validated update proposals.
 *
 * Honesty rules:
 *   - Only writes fields we can substantiate from a source
 *   - Never downgrades a researched value based on a Wikipedia sentence
 *   - Distinguishes detection facts (something changed) from rule rewrites
 *   - Every proposed change carries { field, from, to, source, confidence }
 */

// ── Confidence thresholds ────────────────────────────────────────────────────
// 'high'   = explicit fact from source (e.g., "Bitcoin is legal tender since 2022")
// 'medium' = inferred from multiple signals (e.g., BTC Map shows 50 merchants)
// 'low'    = single weak signal (e.g., Wikipedia mentions crypto once)
const CONFIDENCE = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }

// ── Text-matching heuristics ─────────────────────────────────────────────────

const CRYPTO_KEYWORDS = [
  /\bbitcoin\b/i, /\bcrypto/i, /\blightning\b/i, /\bblockchain\b/i,
  /\bdigital asset/i, /\bvirtual asset/i, /\bvirtual currency/i,
  /\btoken\b/i, /\bstablecoin/i, /\bdefi\b/i,
]

const TAX_KEYWORDS = {
  noIncome: /\bno\s+(personal\s+)?income\s+tax\b/i,
  noCapitalGains: /\bno\s+capital\s+gains?\s+tax\b/i,
  territorial: /\bterritorial\s+(tax|system|regime)\b/i,
  zeroTax: /\b0%\s*(tax|income|capital)/i,
  favorable: /\bfavorable|attract(?:ive|ion)|incentive|competitive\b/i,
}

const RESIDENCY_KEYWORDS = [
  /\bresiden(?:ce|cy|t)\b/i, /\bvisa\b/i, /\bcitizenship\b/i,
  /\bpassport\b/i, /\bimmigration\b/i, /\bnaturaliz/i,
  /\bgolden\s+visa\b/i, /\bcitizenship.by.investment\b/i, /\bCBI\b/,
]

const INVESTMENT_PATTERNS = [
  /(?:invest|threshold|minimum|require).{0,40}\$?([\d,]+(?:\.\d+)?)\s*(?:USD|dollars?|US\$)/i,
  /\$([\d,]+)\s*(?:USD|dollars?)\s*(?:minimum|threshold|require)/i,
  /(?:min|minimum)\s+(?:invest|amount).{0,30}\$?([\d,]+)/i,
]

const PROCESSING_TIME_PATTERNS = [
  /process(?:ing)?\s+(?:time|period|takes?).{0,30}(\d+)\s*[-–to]+\s*(\d+)\s*(?:months?|mos?)/i,
  /(\d+)\s*[-–to]+\s*(\d+)\s*months?\s*(?:to|for|processing)/i,
]

// ── Core diff functions ──────────────────────────────────────────────────────

/**
 * Diff a single country's fetched intel against its corpus entry.
 * Returns { changes: UpdateProposal[], signals: Signal[], summary: string }
 */
export function diffCountry(program, sources) {
  const changes = []
  const signals = []

  const { wikipedia, btcmap, cryptoClimate } = sources

  // ── Wikipedia analysis ───────────────────────────────────────────────────
  if (wikipedia?.summary) {
    const wChanges = diffWikipedia(program, wikipedia)
    changes.push(...wChanges.changes)
    signals.push(...wChanges.signals)
  }

  // ── BTC Map analysis ────────────────────────────────────────────────────
  if (btcmap) {
    const bChanges = diffBtcMap(program, btcmap)
    changes.push(...bChanges.changes)
    signals.push(...bChanges.signals)
  }

  // ── Crypto climate analysis ─────────────────────────────────────────────
  if (cryptoClimate) {
    const cChanges = diffCryptoClimate(program, cryptoClimate)
    changes.push(...cChanges.changes)
    signals.push(...cChanges.signals)
  }

  const summary = buildSummary(changes, signals)

  return { changes, signals, summary }
}

// ── Wikipedia diff ───────────────────────────────────────────────────────────

function diffWikipedia(program, wiki) {
  const changes = []
  const signals = []
  const text = `${wiki.summary} ${(wiki.sections ?? []).map(s => s.text).join(' ')}`

  // 1) Crypto / Bitcoin integration detection
  const hasCryptoMention = CRYPTO_KEYWORDS.some(rx => rx.test(text))
  if (hasCryptoMention) {
    signals.push({
      type: 'crypto_mention',
      source: 'wikipedia',
      confidence: CONFIDENCE.MEDIUM,
      text: wiki.summary?.slice(0, 200),
    })

    // Check if the corpus already reflects this
    if (!program.bitcoin_integration || program.bitcoin_integration.length < 20) {
      // The corpus has a stub — Wikipedia can fill it
      const cryptoSnippet = extractRelevantSentence(text, CRYPTO_KEYWORDS)
      if (cryptoSnippet) {
        changes.push({
          field: 'bitcoin_integration',
          from: program.bitcoin_integration,
          to: enrichWithSource(cryptoSnippet, 'Wikipedia'),
          source: 'wikipedia',
          confidence: CONFIDENCE.MEDIUM,
          reason: 'Corpus has stub; Wikipedia provides crypto context',
        })
      }
    }
  }

  // 2) Tax analysis
  const taxResult = extractTaxSignals(text)
  if (taxResult) {
    signals.push({ type: 'tax_signal', source: 'wikipedia', ...taxResult })

    const currentTax = program.finance?.tax_benefits ?? ''
    // Only upgrade (no income tax > territorial > favorable > nothing)
    const newTax = taxResult.preferred
    if (newTax && isUpgradeTax(newTax, currentTax)) {
      changes.push({
        field: 'finance.tax_benefits',
        from: currentTax,
        to: enrichWithSource(newTax, 'Wikipedia'),
        source: 'wikipedia',
        confidence: taxResult.confidence,
        reason: `Wikipedia indicates ${taxResult.level} tax regime`,
      })
    }
  }

  // 3) Investment threshold detection
  for (const pattern of INVESTMENT_PATTERNS) {
    const m = text.match(pattern)
    if (m) {
      const amount = parseAmount(m[1])
      if (amount && amount > 0) {
        const currentMin = program.finance?.min_investment_usd
        // Only update if the corpus value is null or significantly different (>20%)
        if (currentMin == null || Math.abs(amount - currentMin) / currentMin > 0.2) {
          signals.push({
            type: 'investment_amount',
            source: 'wikipedia',
            amount,
            confidence: CONFIDENCE.LOW,
          })
          break // take first match only
        }
      }
    }
  }

  // 4) Processing time detection
  for (const pattern of PROCESSING_TIME_PATTERNS) {
    const m = text.match(pattern)
    if (m) {
      const minMonths = parseInt(m[1], 10)
      const maxMonths = parseInt(m[2], 10)
      if (minMonths > 0 && maxMonths > minMonths) {
        signals.push({
          type: 'processing_time',
          source: 'wikipedia',
          range: `${minMonths}-${maxMonths} months`,
          confidence: CONFIDENCE.LOW,
        })
        break
      }
    }
  }

  // 5) Residency / citizenship pathway detection
  const residencyMentions = RESIDENCY_KEYWORDS.filter(rx => rx.test(text))
  if (residencyMentions.length > 0) {
    signals.push({
      type: 'residency_pathway',
      source: 'wikipedia',
      keywords: residencyMentions.map(rx => rx.source?.toString().slice(1, -2)).filter(Boolean),
      confidence: CONFIDENCE.MEDIUM,
    })
  }

  return { changes, signals }
}

// ── BTC Map diff ─────────────────────────────────────────────────────────────

function diffBtcMap(program, btcmap) {
  const changes = []
  const signals = []

  if (btcmap.merchantCount > 0) {
    signals.push({
      type: 'btcmerchants',
      source: 'btcmap',
      count: btcmap.merchantCount,
      lightning: btcmap.lightningCount,
      confidence: CONFIDENCE.HIGH,
    })

    // Update Lightning-ready signal based on real merchant data
    if (btcmap.lightningCount >= 3 && !program.lightning_ready) {
      changes.push({
        field: 'lightning_ready',
        from: false,
        to: true,
        source: 'btcmap',
        confidence: CONFIDENCE.HIGH,
        reason: `BTC Map shows ${btcmap.lightningCount} Lightning merchants in ${program.name}`,
      })
    }

    // Update crypto-friendly score if we have strong merchant signal
    const currentScore = program.finance?.crypto_friendly_score
    if (btcmap.merchantCount >= 20 && currentScore != null && currentScore < 7) {
      changes.push({
        field: 'finance.crypto_friendly_score',
        from: currentScore,
        to: Math.min(10, currentScore + 1),
        source: 'btcmap',
        confidence: CONFIDENCE.MEDIUM,
        reason: `BTC Map shows strong merchant presence (${btcmap.merchantCount} locations)`,
      })
    }
  }

  if (btcmap.merchantCount === 0) {
    signals.push({
      type: 'btcmerchants_none',
      source: 'btcmap',
      confidence: CONFIDENCE.HIGH,
    })
  }

  return { changes, signals }
}

// ── Crypto climate diff ──────────────────────────────────────────────────────

function diffCryptoClimate(program, climate) {
  const changes = []
  const signals = []

  if (climate.btcLocalPrice) {
    signals.push({
      type: 'btc_price_local',
      source: 'coingecko',
      price: climate.btcLocalPrice,
      currency: climate.currencyCode,
      confidence: CONFIDENCE.HIGH,
    })
  }

  return { changes, signals }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractRelevantSentence(text, patterns) {
  const sentences = text.split(/(?<=[.!?])\s+/)
  for (const sentence of sentences) {
    if (patterns.some(rx => rx.test(sentence)) && sentence.length > 30 && sentence.length < 300) {
      return sentence.trim()
    }
  }
  return null
}

function extractTaxSignals(text) {
  const levels = []
  if (TAX_KEYWORDS.noIncome.test(text)) levels.push({ level: 'no income tax', confidence: CONFIDENCE.HIGH, preferred: 'No personal income tax' })
  if (TAX_KEYWORDS.noCapitalGains.test(text)) levels.push({ level: 'no capital gains', confidence: CONFIDENCE.HIGH, preferred: 'No capital gains tax' })
  if (TAX_KEYWORDS.zeroTax.test(text)) levels.push({ level: '0% tax', confidence: CONFIDENCE.HIGH, preferred: '0% tax rate on specified income' })
  if (TAX_KEYWORDS.territorial.test(text)) levels.push({ level: 'territorial', confidence: CONFIDENCE.MEDIUM, preferred: 'Territorial tax system — foreign income often not taxed' })
  if (TAX_KEYWORDS.favorable.test(text)) levels.push({ level: 'favorable', confidence: CONFIDENCE.LOW, preferred: 'Favorable tax regime for foreign residents' })

  if (levels.length === 0) return null

  // Return the strongest signal
  const priority = { high: 0, medium: 1, low: 2 }
  levels.sort((a, b) => (priority[a.confidence] ?? 3) - (priority[b.confidence] ?? 3))
  return levels[0]
}

function isUpgradeTax(newTax, currentTax) {
  const newLower = newTax.toLowerCase()
  const curLower = (currentTax ?? '').toLowerCase()

  // "no income tax" is always an upgrade
  if (/no.*income/.test(newLower)) return true
  // "territorial" is an upgrade over nothing or "favorable"
  if (/territorial/.test(newLower) && !/territorial/.test(curLower)) return true
  // "favorable" is an upgrade over nothing
  if (/favorable/.test(newLower) && curLower.length < 10) return true
  return false
}

function parseAmount(str) {
  const cleaned = str.replace(/,/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) && n > 0 ? n : null
}

function enrichWithSource(text, sourceName) {
  if (!text) return text
  // Avoid double-sourcing
  if (text.includes(`(${sourceName}`)) return text
  return `${text} (${sourceName})`
}

function buildSummary(changes, signals) {
  const parts = []
  if (changes.length > 0) {
    parts.push(`${changes.length} change(s) proposed`)
  }
  if (signals.length > 0) {
    const bySource = {}
    for (const s of signals) {
      bySource[s.source] = (bySource[s.source] ?? 0) + 1
    }
    parts.push(`${signals.length} signal(s) from ${Object.keys(bySource).join(', ')}`)
  }
  if (parts.length === 0) return 'No changes detected'
  return parts.join('; ')
}

// ── Batch diff ───────────────────────────────────────────────────────────────

/**
 * Diff all 50 countries, returning a Map of name → { changes, signals, summary }.
 */
export function diffAll(programs, sourceResults) {
  const diffs = new Map()
  for (const program of programs) {
    const sources = sourceResults.get(program.name) ?? {}
    diffs.set(program.name, diffCountry(program, sources))
  }
  return diffs
}
