import { Link } from 'react-router-dom'
import { Layers, Search, Sparkles, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { Program } from '../../types/program'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { serializeIdList } from '../../lib/urlState'

interface ComparePickerProps {
  ids: number[]
  selected: Program[]
  filtered: Program[]
  search: string
  listOpen: boolean
  listId: string
  debouncedSearch: string
  programsLoading: boolean
  allInStack: boolean
  stackAdded: boolean
  onSearchChange: (value: string) => void
  onSearchFocus: () => void
  onSearchBlur: () => void
  onToggle: (id: number) => void
  onRemove: (id: number) => void
  onClearAll: () => void
  onAddAllToStack: () => void
}

export function ComparePicker({
  ids,
  selected,
  filtered,
  search,
  listOpen,
  listId,
  debouncedSearch,
  programsLoading,
  allInStack,
  stackAdded,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onToggle,
  onRemove,
  onClearAll,
  onAddAllToStack,
}: ComparePickerProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      id="compare-picker"
      className="fc-picker scroll-mt-header"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="fc-picker__panel">
        {selected.length > 0 && (
          <div className="fc-picker__selected">
            {selected.map((p, i) => (
              <motion.div
                key={p.id}
                className="fc-chip"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <span className="fc-chip__flag" aria-hidden>
                  {p.flag}
                </span>
                <div className="fc-chip__text">
                  <span className="fc-chip__name">{p.name}</span>
                  <span className="fc-chip__region">{p.region}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="fc-chip__remove"
                  aria-label={formatT(t, 'compare.remove', { name: p.name })}
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="fc-picker__search-wrap">
          <Search size={18} className="fc-picker__search-icon" aria-hidden />
          <input
            id="compare-search"
            type="search"
            role="combobox"
            aria-expanded={listOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            placeholder={
              ids.length >= 4
                ? t('compare.maxSelected')
                : programsLoading
                  ? t('compare.loadingPrograms')
                  : t('compare.searchPlaceholder')
            }
            disabled={ids.length >= 4 || programsLoading}
            aria-busy={programsLoading}
            className="fc-picker__search"
          />
          {listOpen && !programsLoading && ids.length < 4 && filtered.length > 0 && (
            <ul id={listId} role="listbox" className="fc-picker__dropdown">
              {filtered.slice(0, 20).map(p => (
                <li key={p.id} role="option">
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => onToggle(p.id)}
                    className="fc-picker__dropdown-item"
                  >
                    <span className="fc-picker__dropdown-flag">{p.flag}</span>
                    <span className="fc-picker__dropdown-name">{p.name}</span>
                    <span className="fc-picker__dropdown-region">{p.region}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {listOpen && debouncedSearch && filtered.length === 0 && (
            <div className="fc-picker__dropdown fc-picker__dropdown--empty">{t('compare.noMatch')}</div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="fc-picker__actions">
            <button type="button" onClick={onClearAll} className="fc-action fc-action--ghost">
              {t('compare.clearAll')}
            </button>
            {ids.length >= 2 && (
              <Link to={`/simulator?programs=${serializeIdList(ids)}`} className="fc-action fc-action--ghost">
                <Sparkles size={14} aria-hidden />
                {t('compare.openSimulator')}
              </Link>
            )}
            <button
              type="button"
              onClick={onAddAllToStack}
              disabled={allInStack}
              className="fc-action fc-action--accent"
            >
              <Layers size={14} aria-hidden />
              {allInStack ? t('compare.addedToStack') : t('compare.addAllToStack')}
            </button>
            {stackAdded && !allInStack && (
              <span className="sr-only" aria-live="polite">
                {t('compare.addedToStack')}
              </span>
            )}
          </div>
        )}

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {formatT(t, 'compare.programsLabel', { count: ids.length })}
        </p>
      </div>
    </motion.section>
  )
}