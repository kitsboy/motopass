import { useMemo } from 'react'
import { GitFork, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { BtcDualPrice } from '../BtcDualPrice'
import type { Program } from '../../types/program'

export function ValueForksPanel({ stack }: { stack: Program[] }) {
  const forks = useMemo(() => {
    const rows: {
      programId: number
      flag?: string
      programName: string
      type: string
      label: string
      minUsd: number
      notes: string
    }[] = []
    for (const p of stack) {
      for (const pw of p.pathways ?? []) {
        rows.push({
          programId: p.id,
          flag: p.flag,
          programName: p.name,
          type: pw.type,
          label: pw.label,
          minUsd: pw.min_investment_usd,
          notes: pw.notes,
        })
      }
    }
    return rows
  }, [stack])

  if (stack.length === 0) return null

  return (
    <Card variant="elevated" className="scroll-mt-header" id="simulator-value-forks">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-electric-soft border border-electric/25 text-electric">
          <GitFork size={18} aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-ink">Value forks</h3>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Alternative pathways across your stack — compare minimums and notes before you commit capital.
          </p>
        </div>
      </div>

      {forks.length === 0 ? (
        <p className="text-sm text-ink-muted font-body">
          Selected programs lack pathway depth. Add flagship jurisdictions (e.g. Uruguay, Bolivia) for fork analysis.
        </p>
      ) : (
        <ul className="space-y-2">
          {forks.map((f, i) => (
            <li
              key={`${f.programId}-${f.type}-${i}`}
              className="rounded-xl border border-mp/60 bg-card-muted/30 px-3 py-2.5 transition-all hover:border-btc-orange/35 hover:shadow-mp-glow"
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-chrome text-xs font-semibold text-ink">
                  {f.flag} {f.programName}
                </span>
                <span className="rounded-chip border border-electric/25 bg-electric-soft/50 px-2 py-0.5 text-[10px] font-mono text-electric uppercase">
                  {f.type}
                </span>
                <BtcDualPrice usd={f.minUsd} size="sm" />
              </div>
              <p className="font-display text-sm text-ink">{f.label}</p>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed line-clamp-2">{f.notes}</p>
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