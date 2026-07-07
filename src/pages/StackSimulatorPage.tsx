import { useState } from 'react'
import { usePrograms } from '../hooks/usePrograms'
import { loadStacks, saveStack, type SavedStack } from '../lib/portfolioStorage'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { parseMonthsToDays } from '../lib/programAdapter'
import { PageHeader } from '../components/ui/PageHeader'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'

export function StackSimulatorPage() {
  const { programs, loading, error } = usePrograms()
  const [selected, setSelected] = useState<number[]>([])
  const [stackName, setStackName] = useState('')
  const [saved, setSaved] = useState<SavedStack[]>(loadStacks())

  const stack = programs.filter(p => selected.includes(p.id))
  const totalCost = stack.reduce((s, p) => s + (p.finance.typical_investment_usd ?? 0), 0)
  const sovereignty = stack.length ? Math.round(stack.reduce((s, p) => s + (p.sovereignty_score ?? 5), 0) / stack.length) : 0
  const months = stack.length
    ? Math.max(...stack.map(p => Math.ceil(parseMonthsToDays(p.finance.processing_time_months) / 30)))
    : 0

  const toggle = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const save = () => {
    if (!stackName.trim() || selected.length === 0) return
    saveStack({ id: `stack-${Date.now()}`, name: stackName, programIds: selected, createdAt: new Date().toISOString() })
    setSaved(loadStacks())
    setStackName('')
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader eyebrow="STACK SIMULATOR" title="Jurisdictional stacking" subtitle="Combine programs and model cost, sovereignty, and timeline." />

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton />}
      {!loading && !error && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card max-h-[60vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-ink mb-4">Select programs</h3>
            <div className="space-y-1">
              {programs.map(p => (
                <label key={p.id} className="flex items-center gap-3 p-3 rounded-mp-md hover:bg-section cursor-pointer border border-transparent hover:border-mp transition-colors">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-btc-orange w-4 h-4" />
                  <span className="text-ink font-medium">{p.flag} {p.name}</span>
                  <span className="text-xs text-ink-muted ml-auto capitalize">{p.stacking_synergy}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-elevated border-l-4 border-l-btc-orange">
              <h3 className="font-display font-semibold text-ink mb-4">Combined stack metrics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Programs', stack.length, true],
                  ['Total cost', `$${totalCost.toLocaleString()}`, false],
                  ['Sovereignty', `${sovereignty}/10`, false],
                  ['Max timeline', `${months}mo`, false],
                ].map(([label, val, accent]) => (
                  <div key={String(label)}>
                    <span className="text-ink-muted text-xs">{label}</span>
                    <div className={`text-2xl font-display font-semibold ${accent ? 'text-gradient-orange' : 'text-ink'}`}>{val}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                {stack.map(p => <AnimatedBadge key={p.id} status="info">{p.name}</AnimatedBadge>)}
              </div>
            </div>
            <div className="card flex flex-col sm:flex-row gap-2">
              <input value={stackName} onChange={e => setStackName(e.target.value)} placeholder="Stack name…" className="input-field flex-1" />
              <button type="button" onClick={save} disabled={!stackName || selected.length === 0} className="btn-primary shrink-0">Save stack</button>
            </div>
            {saved.length > 0 && (
              <div className="card-muted">
                <h4 className="text-sm font-semibold text-ink mb-3">Saved stacks</h4>
                {saved.map(s => (
                  <div key={s.id} className="text-xs text-ink-secondary py-2 border-b border-mp/60 last:border-0">{s.name} — {s.programIds.length} programs</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}