import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Trash2 } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { loadStacks, saveStack, deleteStack, type SavedStack } from '../lib/portfolioStorage'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { parseMonthsToDays } from '../lib/programAdapter'
import { PageHeader } from '../components/ui/PageHeader'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import { BtcDualPrice } from '../components/BtcDualPrice'
import { parseIdList, serializeIdList } from '../lib/urlState'
import { PageAnchorNav } from '../components/nav/PageAnchorNav'

export function StackSimulatorPage() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const { programs, loading, error } = usePrograms()
  const selected = useMemo(() => parseIdList(searchParams.get('programs'), 50), [searchParams])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 150)
  const [stackName, setStackName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedStack[]>(loadStacks())

  const setSelectedSynced = useCallback((next: number[]) => {
    setSearchParams((p) => {
      if (next.length) p.set('programs', serializeIdList(next))
      else p.delete('programs')
      return p
    }, { replace: true })
  }, [setSearchParams])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return programs
    return programs.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.region.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  }, [programs, debouncedSearch])

  const stack = programs.filter(p => selected.includes(p.id))
  const totalCost = stack.reduce((s, p) => s + (p.finance.typical_investment_usd ?? 0), 0)
  const sovereignty = stack.length ? Math.round(stack.reduce((s, p) => s + (p.sovereignty_score ?? 5), 0) / stack.length) : 0
  const months = stack.length
    ? Math.max(...stack.map(p => Math.ceil(parseMonthsToDays(p.finance.processing_time_months) / 30)))
    : 0

  const synergyCounts = (() => {
    const c = { high: 0, medium: 0, low: 0 }
    for (const p of stack) {
      const s = (p.stacking_synergy ?? 'low').toLowerCase()
      if (s.includes('high')) c.high++
      else if (s.includes('medium')) c.medium++
      else c.low++
    }
    return c
  })()

  const toggle = (id: number) =>
    setSelectedSynced(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])

  const restoreStack = (s: SavedStack) => {
    setSelectedSynced(s.programIds)
    setStackName(s.name)
  }

  const removeStack = (id: string) => {
    if (!window.confirm(t('simulator.deleteStack') + '?')) return
    deleteStack(id)
    setSaved(loadStacks())
  }

  const simulatorAnchors = useMemo(
    () => [
      { id: 'simulator-picker', label: t('subnav.simulator.picker') },
      { id: 'simulator-metrics', label: t('subnav.simulator.metrics') },
      { id: 'simulator-saved', label: t('subnav.simulator.saved') },
    ],
    [t],
  )

  const save = () => {
    const name = stackName.trim()
    if (!name || selected.length === 0) return
    if (saved.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      setSaveError(t('simulator.duplicateName'))
      return
    }
    setSaveError(null)
    saveStack({ id: `stack-${Date.now()}`, name, programIds: selected, createdAt: new Date().toISOString() })
    setSaved(loadStacks())
    setStackName('')
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader eyebrow={t('simulator.eyebrow')} title={t('simulator.title')} subtitle={t('simulator.subtitle')} />

      <PageAnchorNav items={simulatorAnchors} />

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton />}
      {!loading && !error && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div id="simulator-picker" className="rounded-card border border-mp-border bg-mp-card p-6 shadow-mp-1 max-h-[60vh] flex flex-col scroll-mt-header">
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
                <label key={p.id} htmlFor={`sim-p-${p.id}`} className="flex items-center gap-3 p-3 rounded-mp-md hover:bg-section cursor-pointer border border-transparent hover:border-mp transition-colors">
                  <input id={`sim-p-${p.id}`} type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-btc-orange w-4 h-4" />
                  <span className="text-ink font-medium">{p.flag} {p.name}</span>
                  <span className="text-xs text-ink-muted ml-auto capitalize">{p.stacking_synergy}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div id="simulator-metrics" className="rounded-card border border-mp-border border-l-4 border-l-mp-btc bg-mp-card p-6 shadow-mp-1 scroll-mt-header">
              <h3 className="font-display font-semibold text-ink mb-4">{t('simulator.metrics')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink-muted text-xs">{t('simulator.stat.programs')}</span>
                  <div className="text-2xl font-display font-semibold text-gradient-orange">{stack.length}</div>
                </div>
                <div>
                  <span className="text-ink-muted text-xs">{t('simulator.stat.cost')}</span>
                  <div className="mt-1">
                    <BtcDualPrice usd={totalCost} size="md" layout="stack" />
                  </div>
                </div>
                <div>
                  <span className="text-ink-muted text-xs">{t('simulator.stat.sovereignty')}</span>
                  <div className="text-2xl font-display font-semibold text-ink">{sovereignty}/10</div>
                </div>
                <div>
                  <span className="text-ink-muted text-xs">{t('simulator.stat.timeline')}</span>
                  <div className="text-2xl font-display font-semibold text-ink">{months}mo</div>
                </div>
              </div>
              {stack.length > 0 && (
                <p className="mt-4 text-xs text-ink-muted">
                  {formatT(t, 'simulator.synergySummary', synergyCounts)}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-5">
                {stack.map(p => <AnimatedBadge key={p.id} status="info">{p.name}</AnimatedBadge>)}
              </div>
              {selected.length >= 2 && selected.length <= 4 && (
                <Link
                  to={`/compare?ids=${serializeIdList(selected)}`}
                  className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
                >
                  {t('simulator.openCompare')} →
                </Link>
              )}
            </div>
            <div className="rounded-card border border-mp-border bg-mp-card p-6 shadow-mp-1 flex flex-col sm:flex-row gap-2">
              <input
                value={stackName}
                onChange={e => { setStackName(e.target.value); setSaveError(null) }}
                placeholder={t('simulator.stackName')}
                aria-invalid={saveError ? true : undefined}
                className={`input-field flex-1 ${saveError ? 'input-field-error' : ''}`}
              />
              <button type="button" onClick={save} disabled={!stackName || selected.length === 0} className="btn-primary shrink-0">{t('simulator.saveStack')}</button>
            </div>
            {saveError && <p className="text-sm text-status-red field-error-shake" role="alert">{saveError}</p>}
            {saved.length > 0 && (
              <div id="simulator-saved" className="rounded-mp-lg border border-mp-border bg-mp-card-muted p-4 scroll-mt-header">
                <h4 className="text-sm font-semibold text-ink mb-3">{t('simulator.savedStacks')}</h4>
                {saved.map(s => (
                  <div key={s.id} className="flex items-center justify-between gap-2 text-xs text-ink-secondary py-2 border-b border-mp/60 last:border-0">
                    <button type="button" onClick={() => restoreStack(s)} className="text-left hover:text-accent flex-1">
                      {s.name} — {s.programIds.length} {t('simulator.savedCount')}
                    </button>
                    <button type="button" onClick={() => removeStack(s.id)} className="p-1 text-ink-muted hover:text-status-red" aria-label={t('simulator.deleteStack')}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}