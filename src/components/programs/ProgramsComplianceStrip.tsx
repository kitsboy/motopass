import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePrograms } from '../../hooks/usePrograms'
import { toCinematicPrograms } from '../../lib/programAdapter'
import { ComplianceClock } from '../portfolio/ComplianceClock'
import { hasFlagshipDepth } from './types'
import { Card } from '../ui/Card'

const SPOTLIGHT = new Set(['Uruguay', 'Bolivia', 'El Salvador', 'UAE'])

export function ProgramsComplianceStrip() {
  const { programs, loading } = usePrograms()

  const flagship = useMemo(() => {
    const cinematic = toCinematicPrograms(
      programs.filter(p => (p.flagship_depth || SPOTLIGHT.has(p.name)) && p.compliance_clock),
    )
    return cinematic.filter(hasFlagshipDepth).slice(0, 4)
  }, [programs])

  if (loading || flagship.length === 0) return null

  return (
    <section className="mb-10" aria-labelledby="programs-compliance-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="club-eyebrow block mb-1.5">COMPLIANCE</span>
          <h2 id="programs-compliance-heading" className="font-display text-h3 font-semibold tracking-tight text-ink">
            Residency clocks
          </h2>
        </div>
        <Link to="/portfolio" className="text-xs font-chrome text-mp-btc-text hover:underline">
          Track in portfolio →
        </Link>
      </div>
      <Card variant="elevated" className="!p-4 sm:!p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {flagship.map(p => (
            <ComplianceClock key={p.id} program={p} />
          ))}
        </div>
      </Card>
    </section>
  )
}