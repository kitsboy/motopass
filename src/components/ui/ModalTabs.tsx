type Tab<T extends string> = { id: T; label: string; hint?: string }

type Props<T extends string> = {
  tabs: Tab<T>[]
  active: T
  onChange: (id: T) => void
}

/**
 * Sticky by design: the record modal can carry eight tabs, and on a phone the
 * row scrolls sideways behind a blurred edge instead of wrapping into two
 * ragged lines. Keeping the active tab in view while the body scrolls is what
 * makes the extra tabs affordable.
 */
export function ModalTabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div className="sticky top-0 z-20 -mx-1 mb-5 flex snap-x gap-1.5 overflow-x-auto rounded-full border border-mp bg-section/95 p-1 backdrop-blur-md supports-[backdrop-filter]:bg-section/80">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          aria-current={active === t.id ? 'page' : undefined}
          className={`min-w-[max-content] shrink-0 snap-start rounded-full px-4 py-2.5 text-xs font-medium transition-all whitespace-nowrap ${
            active === t.id
              ? 'bg-card text-btc-orange-deep shadow-card border border-btc-orange/30'
              : 'text-ink-muted hover:text-ink hover:bg-card/60'
          }`}
        >
          {t.label}
          {t.hint && <span className="hidden sm:inline text-[10px] text-ink-muted ml-1.5">· {t.hint}</span>}
        </button>
      ))}
    </div>
  )
}
