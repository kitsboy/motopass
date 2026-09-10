import { Wallet, Zap, Crown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useI18n } from '../../i18n/I18nContext'

interface SimulatorPresetsProps {
  onSelect: (ids: number[]) => void
  activeIds: number[]
}

/**
 * Curated one-click demo stacks. IDs reference the real programs corpus
 * (research/countries.json) so presets always resolve to live data.
 */
const PRESETS = [
  {
    key: 'budget',
    labelKey: 'simulator.preset.budget',
    tipKey: 'simulator.preset.budgetTip',
    icon: Wallet,
    ids: [1, 2, 14], // El Salvador, Central African Republic, Georgia — lowest entry cost
    accent: 'text-emerald-500',
    chip: 'hover:border-emerald-500/40',
  },
  {
    key: 'speed',
    labelKey: 'simulator.preset.speed',
    tipKey: 'simulator.preset.speedTip',
    icon: Zap,
    ids: [1, 8, 45], // El Salvador 1-4mo, UAE 2-4mo, Estonia 1-3mo — fastest processing
    accent: 'text-amber-500',
    chip: 'hover:border-amber-500/40',
  },
  {
    key: 'sovereign',
    labelKey: 'simulator.preset.sovereign',
    tipKey: 'simulator.preset.sovereignTip',
    icon: Crown,
    ids: [8, 3, 1], // UAE 10, Uruguay 9, El Salvador 9 — highest sovereignty scores
    accent: 'text-btc-orange',
    chip: 'hover:border-btc-orange/40',
  },
] as const

export function SimulatorPresets({ onSelect, activeIds }: SimulatorPresetsProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  return (
    <div className="mb-3">
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
        {t('simulator.presetsLabel')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="group" aria-label={t('simulator.presetsLabel')}>
        {PRESETS.map((preset, i) => {
          const Icon = preset.icon
          const isActive =
            preset.ids.length === activeIds.length && preset.ids.every(id => activeIds.includes(id))
          return (
            <motion.button
              key={preset.key}
              type="button"
              onClick={() => onSelect([...preset.ids])}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-mp-md border text-left transition-colors ${
                isActive ? 'border-btc-orange/60 bg-btc-orange/5' : `border-mp ${preset.chip} hover:bg-section`
              }`}
              title={t(preset.tipKey)}
            >
              <Icon size={15} className={`shrink-0 ${preset.accent}`} aria-hidden />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-ink leading-tight">
                  {t(preset.labelKey)}
                </span>
                <span className="block text-[10px] text-ink-muted leading-tight truncate">
                  {t(preset.tipKey)}
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
