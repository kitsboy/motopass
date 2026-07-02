import { useState } from 'react'
import { usePrograms } from '../hooks/usePrograms'
import { loadStacks, saveStack, type SavedStack } from '../lib/portfolioStorage'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'

export function StackSimulatorPage() {
  const { programs, loading } = usePrograms()
  const [selected, setSelected] = useState<number[]>([])
  const [stackName, setStackName] = useState('')
  const [saved, setSaved] = useState<SavedStack[]>(loadStacks())

  const stack = programs.filter(p => selected.includes(p.id))
  const totalCost = stack.reduce((s, p) => s + (p.finance.typical_investment_usd ?? 0), 0)
  const sovereignty = stack.length ? Math.round(stack.reduce((s, p) => s + (p.sovereignty_score ?? 5), 0) / stack.length) : 0
  const months = stack.length ? Math.max(...stack.map(p => parseInt(p.finance.processing_time_months ?? '12', 10) || 12)) : 0

  const toggle = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const save = () => {
    if (!stackName.trim() || selected.length === 0) return
    const item: SavedStack = { id: `stack-${Date.now()}`, name: stackName, programIds: selected, createdAt: new Date().toISOString() }
    saveStack(item)
    setSaved(loadStacks())
    setStackName('')
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="section-label mb-1">STACK SIMULATOR</div>
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-6">Jurisdictional stacking</h1>

      {loading && <CardSkeleton />}
      {!loading && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card max-h-[60vh] overflow-y-auto">
            <h3 className="font-semibold mb-3">Select programs</h3>
            <div className="space-y-2">
              {programs.map(p => (
                <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-btc-orange" />
                  <span>{p.flag} {p.name}</span>
                  <span className="text-xs text-sovereign-silver ml-auto">{p.stacking_synergy}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold mb-4">Combined stack metrics</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-sovereign-silver">Programs</span><div className="text-2xl font-bold text-btc-orange">{stack.length}</div></div>
                <div><span className="text-sovereign-silver">Total cost</span><div className="text-2xl font-bold">${totalCost.toLocaleString()}</div></div>
                <div><span className="text-sovereign-silver">Sovereignty</span><div className="text-2xl font-bold">{sovereignty}/10</div></div>
                <div><span className="text-sovereign-silver">Max timeline</span><div className="text-2xl font-bold">{months}mo</div></div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {stack.map(p => <AnimatedBadge key={p.id} status="info">{p.name}</AnimatedBadge>)}
              </div>
            </div>
            <div className="card flex gap-2">
              <input value={stackName} onChange={e => setStackName(e.target.value)} placeholder="Stack name…" className="flex-1 bg-sovereign-black border border-white/10 rounded-xl px-3 py-2 text-sm" />
              <button type="button" onClick={save} disabled={!stackName || selected.length === 0} className="btn-primary">Save stack</button>
            </div>
            {saved.length > 0 && (
              <div className="card">
                <h4 className="text-sm font-semibold mb-2">Saved stacks</h4>
                {saved.map(s => (
                  <div key={s.id} className="text-xs text-sovereign-silver py-1">{s.name} — {s.programIds.length} programs</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}