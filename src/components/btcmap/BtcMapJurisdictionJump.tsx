import { useMemo, useState } from 'react'
import { Compass } from 'lucide-react'
import type { Program } from '../../types/program'
import { getProgramCoord } from '../../data/programCoords'
import { useI18n } from '../../i18n/I18nContext'

export function BtcMapJurisdictionJump({
  programs,
  programId,
  onSelect,
  disabled,
}: {
  programs: Program[]
  programId: number | null
  onSelect: (id: number) => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')

  const withCoords = useMemo(
    () => programs.filter(p => getProgramCoord(p.name)),
    [programs],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return withCoords
    return withCoords.filter(p => p.name.toLowerCase().includes(q) || (p.flag ?? '').includes(q))
  }, [withCoords, query])

  const selected = withCoords.find(p => p.id === programId)

  return (
    <div className="relative min-w-[12rem] max-w-xs">
      <label htmlFor="btcmap-jump" className="section-label block mb-1.5">
        {t('btcmap.quickJump')}
      </label>
      <div className="relative">
        <Compass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden />
        <input
          id="btcmap-jump"
          type="search"
          list="btcmap-jump-list"
          value={query || (selected ? `${selected.flag ?? ''} ${selected.name}`.trim() : '')}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setQuery('')}
          placeholder={t('btcmap.quickJumpPlaceholder')}
          disabled={disabled}
          className="input-field w-full !py-2 !pl-9 !pr-3 text-xs font-chrome"
          aria-label={t('btcmap.quickJump')}
        />
      </div>
      <datalist id="btcmap-jump-list">
        {filtered.map(p => (
          <option key={p.id} value={`${p.flag ?? ''} ${p.name}`.trim()} />
        ))}
      </datalist>
      {query.trim() && filtered.length > 0 && (
        <ul
          className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-mp-md border border-mp-border bg-card shadow-mp-2 text-xs"
          role="listbox"
        >
          {filtered.slice(0, 8).map(p => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                className="w-full text-left px-3 py-2 hover:bg-section/80 transition-colors"
                onMouseDown={e => {
                  e.preventDefault()
                  onSelect(p.id)
                  setQuery('')
                }}
              >
                {p.flag} {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}