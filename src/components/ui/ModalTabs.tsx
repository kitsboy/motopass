type Tab<T extends string> = { id: T; label: string; hint?: string }

type Props<T extends string> = {
  tabs: Tab<T>[]
  active: T
  onChange: (id: T) => void
}

export function ModalTabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div className="flex gap-1.5 p-1 rounded-full bg-section border border-mp mb-5 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`flex-1 min-w-[max-content] px-4 py-2.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
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