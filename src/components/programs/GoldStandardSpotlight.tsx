import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { Card } from '../ui/Card'
import { ProofBadge } from '../ui/ProofBadge'
import { toCinematicProgram } from '../../lib/programAdapter'
import { computePitchStats } from '../../lib/pitchStats'
import type { Program } from '../../types/program'

const GOLD_STANDARD_NAMES = ['Uruguay', 'Bolivia'] as const

export function GoldStandardSpotlight({ programs }: { programs: Program[] }) {
  const stats = useMemo(() => computePitchStats(programs), [programs])
  const spotlight = useMemo(() => {
    const found = GOLD_STANDARD_NAMES.map(name => programs.find(p => p.name === name)).filter(
      (p): p is Program => Boolean(p),
    )
    if (found.length < 2) return found
    const offset = (stats.deepCount + stats.lightningCount) % found.length
    return [...found.slice(offset), ...found.slice(0, offset)]
  }, [programs, stats.deepCount, stats.lightningCount])

  if (spotlight.length === 0) return null

  return (
    <section className="mb-10" aria-labelledby="gold-standard-heading">
      <div className="mb-5 max-w-2xl">
        <span className="club-eyebrow block mb-2">FLAGSHIP DEPTH</span>
        <h2 id="gold-standard-heading" className="font-display text-h3 font-semibold text-ink tracking-tight">
          Gold standard jurisdictions
        </h2>
        <p className="mt-2 font-body text-sm text-ink-secondary leading-relaxed">
          Uruguay and Bolivia anchor MotoPass research templates — pathways, compliance clocks, and Satohash proofs
          other programs inherit.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {spotlight.map((p, i) => {
          const cinematic = toCinematicProgram(p)
          const pathwayCount = p.pathways?.length ?? 0
          return (
            <Link key={p.id} to={`/programs?q=${encodeURIComponent(p.name)}`} className="group">
              <Card variant="interactive" animate delay={0.04 + i * 0.04} className="h-full">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden>{p.flag}</span>
                    <div>
                      <h3 className="font-display font-semibold text-ink group-hover:text-mp-btc-text transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wide">{p.status}</p>
                    </div>
                  </div>
                  <ProofBadge status={cinematic.proofStatus} compact />
                </div>
                <p className="text-sm text-ink-secondary leading-relaxed line-clamp-3">{p.details}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono">
                  <span className="rounded-chip border border-mp-proof/30 bg-mp-proof/10 px-2 py-0.5 text-mp-proof inline-flex items-center gap-1">
                    <ShieldCheck size={10} /> {pathwayCount} pathways
                  </span>
                  {p.flagship_depth && (
                    <span className="rounded-chip border border-btc-orange/30 bg-btc-orange-soft/50 px-2 py-0.5 text-mp-btc-text">
                      flagship_depth
                    </span>
                  )}
                  {p.sovereignty_score != null && (
                    <span className="rounded-chip border border-mp/60 px-2 py-0.5 text-ink-muted">
                      sovereignty {p.sovereignty_score}/10
                    </span>
                  )}
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-chrome font-medium text-mp-btc-text opacity-0 group-hover:opacity-100 transition-opacity">
                  Open research <ArrowRight size={12} />
                </span>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}