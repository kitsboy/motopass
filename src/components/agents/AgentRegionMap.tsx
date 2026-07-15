import { useI18n } from '../../i18n/I18nContext'

/** Static SVG world map with agent region markers (BUILD 654) */
const MARKERS: { id: string; cx: number; cy: number; label: string }[] = [
  { id: 'uy', cx: 118, cy: 198, label: 'Uruguay' },
  { id: 'sv', cx: 72, cy: 142, label: 'El Salvador' },
  { id: 'ae', cx: 318, cy: 128, label: 'UAE' },
  { id: 'sg', cx: 358, cy: 158, label: 'Singapore' },
  { id: 'pt', cx: 168, cy: 92, label: 'Portugal' },
  { id: 'ge', cx: 292, cy: 88, label: 'Georgia' },
]

export function AgentRegionMap() {
  const { t } = useI18n()

  return (
    <figure className="card-muted !p-4 mb-8" aria-label={t('agents.mapLabel')}>
      <figcaption className="font-chrome text-[11px] uppercase tracking-wider text-ink-muted mb-3">
        {t('agents.mapTitle')}
      </figcaption>
      <svg
        viewBox="0 0 400 220"
        className="w-full h-auto max-h-48 text-ink-muted"
        role="img"
        aria-hidden="true"
      >
        <rect width="400" height="220" rx="12" className="fill-section/80" />
        {/* Simplified continents */}
        <path
          d="M40 80 Q80 40 140 55 Q200 35 260 50 Q320 45 360 70 L370 120 Q340 150 300 140 Q250 160 200 155 Q140 170 90 150 Q50 140 40 80 Z"
          className="fill-card-muted stroke-mp/50"
          strokeWidth="1"
        />
        <path
          d="M60 155 Q100 175 150 168 Q200 185 250 175 Q300 190 340 170 L350 200 Q280 210 200 205 Q120 210 60 195 Z"
          className="fill-card-muted/70 stroke-mp/40"
          strokeWidth="1"
        />
        <path
          d="M300 55 Q330 48 355 62 L360 95 Q340 110 310 100 Z"
          className="fill-card-muted stroke-mp/40"
          strokeWidth="1"
        />
        {MARKERS.map(m => (
          <g key={m.id}>
            <circle cx={m.cx} cy={m.cy} r="10" className="fill-btc-orange/20 stroke-btc-orange/50" strokeWidth="1.5" />
            <circle cx={m.cx} cy={m.cy} r="4" className="fill-btc-orange" />
            <title>{m.label}</title>
          </g>
        ))}
      </svg>
      <ul className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono text-ink-muted">
        {MARKERS.map(m => (
          <li key={m.id} className="chip !py-0.5 !px-2">{m.label}</li>
        ))}
      </ul>
    </figure>
  )
}