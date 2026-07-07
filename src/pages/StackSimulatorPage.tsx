import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { loadStacks, saveStack, type SavedStack } from '../lib/portfolioStorage'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { parseMonthsToDays } from '../lib/programAdapter'
import { PageHeader } from '../components/ui/PageHeader'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'
import { useI18n } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/translations'

export function StackSimulatorPage() {
  const { t } = useI18n()
  const { programs, loading, error } = usePrograms()
  const [selected, setSelected] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [stackName, setStackName] = useState('')
  const [saved, setSaved] = useState<SavedStack[]>(loadStacks())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return programs
    return programs.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.region.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  }, [programs, search])

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
      <PageHeader eyebrow={t('simulator.eyebrow')} title={t('simulator.title')} subtitle={t('simulator.subtitle')} />

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton />}
      {!loading && !error && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-card border border-mp-border bg-mp-card p-6 shadow-mp-1 max-h-[60vh] flex flex-col">
            <h3 className="font-display font-semibold text-ink mb-3">{t('simulator.selectPrograms')}</h3>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('simulator.filterPrograms')}
                className="input-field pl-9"
              />
            </div>
            <div className="space-y-1 overflow-y-auto flex-1 -mx-1 px-1">
              {filtered.length === 0 && (
                <p className="text-sm text-ink-muted text-center py-8">{t('simulator.noSearchMatch')}</p>
              )}
              {filtered.map(p => (
                <label key={p.id} className="flex items-center gap-3 p-3 rounded-mp-md hover:bg-section cursor-pointer border border-transparent hover:border-mp transition-colors">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-btc-orange w-4 h-4" />
                  <span className="text-ink font-medium">{p.flag} {p.name}</span>
                  <span className="text-xs text-ink-muted ml-auto capitalize">{p.stacking_synergy}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-card border border-mp-border border-l-4 border-l-mp-btc bg-mp-card p-6 shadow-mp-1 transition-[box-shadow,border-color] duration-base hover:border-mp-btc/30 hover:shadow-mp-2">
              <h3 className="font-display font-semibold text-ink mb-4">{t('simulator.metrics')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {([
                  ['simulator.stat.programs', stack.length, true],
                  ['simulator.stat.cost', `$${totalCost.toLocaleString()}`, false],
                  ['simulator.stat.sovereignty', `${sovereignty}/10`, false],
                  ['simulator.stat.timeline', `${months}mo`, false],
                ] as [TranslationKey, string | number, boolean][]).map(([labelKey, val, accent]) => (
                  <div key={labelKey}>
                    <span className="text-ink-muted text-xs">{t(labelKey)}</span>
                    <div className={`text-2xl font-display font-semibold ${accent ? 'text-gradient-orange' : 'text-ink'}`}>{val}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                {stack.map(p => <AnimatedBadge key={p.id} status="info">{p.name}</AnimatedBadge>)}
              </div>
            </div>
            <div className="rounded-card border border-mp-border bg-mp-card p-6 shadow-mp-1 flex flex-col sm:flex-row gap-2">
              <input value={stackName} onChange={e => setStackName(e.target.value)} placeholder={t('simulator.stackName')} className="input-field flex-1" />
              <button type="button" onClick={save} disabled={!stackName || selected.length === 0} className="btn-primary shrink-0">{t('simulator.saveStack')}</button>
            </div>
            {saved.length > 0 && (
              <div className="rounded-mp-lg border border-mp-border bg-mp-card-muted p-4">
                <h4 className="text-sm font-semibold text-ink mb-3">{t('simulator.savedStacks')}</h4>
                {saved.map(s => (
                  <div key={s.id} className="text-xs text-ink-secondary py-2 border-b border-mp/60 last:border-0">{s.name} — {s.programIds.length} {t('simulator.savedCount')}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}