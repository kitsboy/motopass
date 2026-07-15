import { useMemo } from 'react'
import { GitFork, ArrowRight, Shield, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { BtcDualPrice } from '../BtcDualPrice'
import { ProofBadge } from '../ui/ProofBadge'
import { toCinematicProgram } from '../../lib/programAdapter'
import type { Program } from '../../types/program'

export function ValueForksPanel({ stack }: { stack: Program[] }) {
  const { forks, stackMin, stackTypical, avgSovereignty, synergy } = useMemo(() => {
    const rows: {
      programId: number
      flag?: string
      programName: string
      type: string
      label: string
      minUsd: number
      typicalUsd: number
      notes: string
      sovereignty: number
      synergy: string
      hasProof: boolean
      proofStatus: 'verified' | 'demo' | 'none'
      savingsVsTypical: number
    }[] = []

    let typicalSum = 0
    let minSum = 0
    let sovSum = 0

    for (const p of stack) {
      const typical = p.finance.typical_investment_usd ?? 0
      const cinematic = toCinematicProgram(p)
      typicalSum += typical
      sovSum += p.sovereignty_score ?? 5
      const pathways = p.pathways?.length ? p.pathways : [{
        type: 'default',
        label: p.category,
        min_investment_usd: p.finance.min_investment_usd ?? typical,
        notes: p.details,
      }]
      for (const pw of pathways) {
        const minUsd = pw.min_investment_usd || typical
        minSum += minUsd
        rows.push({
          programId: p.id,
          flag: p.flag,
          programName: p.name,
          type: pw.type,
          label: pw.label,
          minUsd,
          typicalUsd: typical,
          notes: pw.notes,
          sovereignty: p.sovereignty_score ?? 5,
          synergy: p.stacking_synergy ?? 'low',
          hasProof: Boolean(p.satohash_proofs?.[0]?.proof_url),
          proofStatus: cinematic.proofStatus,
          savingsVsTypical: Math.max(0, typical - minUsd),
        })
      }
    }

    const syn = { high: 0, medium: 0, low: 0 }
    for (const p of stack) {
      const s = (p.stacking_synergy ?? 'low').toLowerCase()
      if (s.includes('high')) syn.high++
      else if (s.includes('medium')) syn.medium++
      else syn.low++
    }

    return {
      forks: rows.sort((a, b) => b.savingsVsTypical - a.savingsVsTypical || a.minUsd - b.minUsd),
      stackMin: minSum,
      stackTypical: typicalSum,
      avgSovereignty: stack.length ? Math.round(sovSum / stack.length) : 0,
      synergy: syn,
    }
  }, [stack])

  if (stack.length === 0) return null

  const forkSavings = Math.max(0, stackTypical - stackMin)

  return (
    <Card variant="elevated" className="scroll-mt-header" id="simulator-value-forks">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-electric-soft border border-electric/25 text-electric">
          <GitFork size={18} aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-ink tracking-tight">Value forks</h3>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed font-body">
            Pathway-level capital forks — minimums, proof status, and stacking synergy across your sovereign stack.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="rounded-xl border border-mp/50 bg-card-muted/30 px-2 py-2">
          <div className="text-[9px] font-mono uppercase text-ink-muted">Fork savings</div>
          <div className="mt-1">
            <BtcDualPrice usd={forkSavings} size="sm" />
          </div>
        </div>
        <div className="rounded-xl border border-mp/50 bg-card-muted/30 px-2 py-2">
          <div className="text-[9px] font-mono uppercase text-ink-muted">Avg sovereignty</div>
          <div className="font-display font-semibold text-ink mt-1">{avgSovereignty}/10</div>
        </div>
        <div className="rounded-xl border border-mp/50 bg-card-muted/30 px-2 py-2">
          <div className="text-[9px] font-mono uppercase text-ink-muted">Synergy</div>
          <div className="font-mono text-[10px] text-ink-secondary mt-1">
            {synergy.high}H · {synergy.medium}M · {synergy.low}L
          </div>
        </div>
      </div>

      {forks.length === 0 ? (
        <p className="text-sm text-ink-muted font-body">
          Add flagship jurisdictions (Uruguay, Bolivia) for pathway fork analysis.
        </p>
      ) : (
        <ul className="space-y-2">
          {forks.map((f, i) => (
            <li
              key={`${f.programId}-${f.type}-${i}`}
              className="rounded-xl border border-mp/60 bg-card-muted/20 px-3 py-2.5 transition-all hover:border-btc-orange/40 hover:shadow-mp-glow hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-chrome text-xs font-semibold text-ink">
                  {f.flag} {f.programName}
                </span>
                <span className="rounded-chip border border-electric/25 bg-electric-soft/50 px-2 py-0.5 text-[10px] font-mono text-electric uppercase">
                  {f.type}
                </span>
                {f.hasProof && <ProofBadge status={f.proofStatus} compact />}
                <span className="rounded-chip border border-mp/50 px-2 py-0.5 text-[10px] font-mono text-ink-muted capitalize inline-flex items-center gap-1">
                  <Zap size={9} /> {f.synergy}
                </span>
                <span className="rounded-chip border border-mp/50 px-2 py-0.5 text-[10px] font-mono text-ink-muted inline-flex items-center gap-1">
                  <Shield size={9} /> {f.sovereignty}/10
                </span>
              </div>
              <p className="font-display text-sm font-medium text-ink">{f.label}</p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <BtcDualPrice usd={f.minUsd} size="sm" />
                {f.savingsVsTypical > 0 && (
                  <span className="text-[10px] font-mono text-mp-proof">
                    −${f.savingsVsTypical.toLocaleString()} vs typical
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed line-clamp-2 font-body">{f.notes}</p>
            </li>
          ))}
        </ul>
      )}

      {stack.length >= 2 && (
        <Link
          to={`/compare?ids=${stack.map(p => p.id).join(',')}`}
          className="mt-4 inline-flex items-center gap-1 text-xs font-chrome font-medium text-mp-btc-text hover:underline"
        >
          Side-by-side compare <ArrowRight size={12} />
        </Link>
      )}
    </Card>
  )
}