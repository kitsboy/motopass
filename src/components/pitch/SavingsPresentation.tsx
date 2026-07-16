import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { DASHBOARD_METRICS, type MetricUnit } from '../../lib/savingsDashboardMetrics'

const LOGO_SRC = '/images/motopass-logo.png'

const METHODOLOGY_DISCLAIMER =
  'Modeled from boutique advisory across three jurisdictions vs MotoPass stack economics at current program depth. Illustrative figures for member evaluation — not promises.'

const PHASES = ['intro', 'cost', 'time', 'jurisdictions', 'savings', 'finale'] as const
type Phase = (typeof PHASES)[number]

const PHASE_MS: Record<Phase, number> = {
  intro: 2600,
  cost: 4500,
  time: 4500,
  jurisdictions: 4500,
  savings: 3800,
  finale: 4200,
}

const COST_BARS = [58, 82, 68, 42, 76, 55, 62, 88, 38, 72]

const legal = DASHBOARD_METRICS.find(m => m.id === 'legal')!
const time = DASHBOARD_METRICS.find(m => m.id === 'time')!
const jurisdictions = DASHBOARD_METRICS.find(m => m.id === 'jurisdictions')!

interface SavingsPresentationProps {
  open: boolean
  onClose: () => void
  title: string
}

function CountUp({
  value,
  unit,
  run,
  tone,
  delay = 0,
}: {
  value: number
  unit: MetricUnit
  run: boolean
  tone: 'traditional' | 'motopass' | 'gold'
  delay?: number
}) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(reduceMotion ? value : 0)

  useEffect(() => {
    if (!run) {
      setDisplay(reduceMotion ? value : 0)
      return
    }
    if (reduceMotion) {
      setDisplay(value)
      return
    }

    let raf = 0
    const duration = 1600

    const begin = window.setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(Math.round(eased * value))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)

    return () => {
      window.clearTimeout(begin)
      cancelAnimationFrame(raf)
    }
  }, [run, value, delay, reduceMotion])

  const suffix = unit === 'days' ? ' days' : ''
  const formatted =
    unit === 'usd' ? `$${display.toLocaleString()}` : `${display.toLocaleString()}${suffix}`

  return <span className={`ds-value ds-value--${tone}`}>{formatted}</span>
}

function CardShell({
  cardPhase,
  currentPhase,
  className,
  children,
}: {
  cardPhase: Phase
  currentPhase: Phase
  className?: string
  children: ReactNode
}) {
  const phaseIdx = PHASES.indexOf(currentPhase)
  const cardIdx = PHASES.indexOf(cardPhase)
  const revealed = currentPhase !== 'intro' && phaseIdx >= cardIdx
  const active = currentPhase === cardPhase
  const finale = currentPhase === 'finale'

  return (
    <motion.article
      className={`ds-card ${className ?? ''}${active ? ' ds-card--active' : ''}`}
      animate={{
        opacity: revealed ? (active || finale ? 1 : 0.42) : 0.22,
        scale: active ? 1.012 : 1,
        filter: active ? 'brightness(1.06)' : finale ? 'brightness(0.95)' : 'brightness(0.78)',
      }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.article>
  )
}

function CostComparisonCard({
  currentPhase,
  run,
}: {
  currentPhase: Phase
  run: boolean
}) {
  return (
    <CardShell cardPhase="cost" currentPhase={currentPhase} className="ds-card--cost">
      <h3 className="ds-card__title">Cost Comparison</h3>

      <div className="ds-cost-bars" aria-hidden>
        {COST_BARS.map((h, i) => (
          <motion.div
            key={i}
            className="ds-cost-bars__col"
            initial={{ scaleY: 0 }}
            animate={run ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{
              duration: 1.1,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.15 + i * 0.07,
            }}
          >
            <div className="ds-cost-bars__bar" style={{ height: `${h}%` }} />
          </motion.div>
        ))}
      </div>

      <div className="ds-metrics-row">
        <div className="ds-metrics-row__col">
          <span className="ds-metrics-row__label">Traditional</span>
          <CountUp value={legal.traditional} unit="usd" run={run} tone="traditional" delay={200} />
        </div>
        <motion.span
          className="ds-metrics-row__arrow"
          animate={{ opacity: run ? 1 : 0.3, x: run ? 0 : -6 }}
        >
          →
        </motion.span>
        <div className="ds-metrics-row__col ds-metrics-row__col--right">
          <span className="ds-metrics-row__label ds-metrics-row__label--gold">MotoPass</span>
          <CountUp value={legal.motopass} unit="usd" run={run} tone="motopass" delay={550} />
        </div>
      </div>
    </CardShell>
  )
}

function MotoPassMiniCard({
  currentPhase,
  run,
}: {
  currentPhase: Phase
  run: boolean
}) {
  const max = legal.traditional
  const tradH = Math.round((legal.traditional / max) * 100)
  const motoH = Math.max(12, Math.round((legal.motopass / max) * 100))

  return (
    <CardShell cardPhase="cost" currentPhase={currentPhase} className="ds-card--mini">
      <div className="ds-card__brand">
        <img src={LOGO_SRC} alt="" className="ds-card__brand-logo" width={22} height={22} aria-hidden />
        <span className="ds-card__brand-name">MotoPass</span>
      </div>

      <div className="ds-mini-bars" aria-hidden>
        <motion.div
          className="ds-mini-bars__bar ds-mini-bars__bar--traditional"
          style={{ height: `${tradH}%` }}
          initial={{ scaleY: 0 }}
          animate={run ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        />
        <motion.div
          className="ds-mini-bars__bar ds-mini-bars__bar--motopass"
          style={{ height: `${motoH}%` }}
          initial={{ scaleY: 0 }}
          animate={run ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.65 }}
        />
        <motion.div
          className="ds-mini-bars__bar ds-mini-bars__bar--accent"
          style={{ height: '28%' }}
          initial={{ scaleY: 0 }}
          animate={run ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.85 }}
        />
      </div>
    </CardShell>
  )
}

function TimeComparisonCard({
  currentPhase,
  run,
}: {
  currentPhase: Phase
  run: boolean
}) {
  const tradPath = 'M 6 78 C 22 62, 36 48, 52 38 S 78 22, 94 16'
  const motoPath = 'M 6 82 C 22 72, 36 62, 52 54 S 78 46, 94 42'

  return (
    <CardShell cardPhase="time" currentPhase={currentPhase} className="ds-card--time">
      <h3 className="ds-card__title">Time Comparison</h3>

      <svg className="ds-line-chart" viewBox="0 0 100 90" aria-hidden>
        <defs>
          <linearGradient id="ds-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e68600" />
            <stop offset="100%" stopColor="#ffc46e" />
          </linearGradient>
        </defs>
        {[18, 36, 54, 72].map(y => (
          <line key={y} x1="4" y1={y} x2="96" y2={y} className="ds-line-chart__grid" />
        ))}
        <motion.path
          d={tradPath}
          className="ds-line-chart__line ds-line-chart__line--traditional"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={run ? { pathLength: 1, opacity: 0.5 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
        <motion.path
          d={motoPath}
          className="ds-line-chart__line ds-line-chart__line--motopass"
          fill="none"
          stroke="url(#ds-line-grad)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={run ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
        />
        <motion.circle
          cx="52"
          cy="38"
          r="2.5"
          className="ds-line-chart__dot ds-line-chart__dot--traditional"
          initial={{ scale: 0 }}
          animate={run ? { scale: 1 } : { scale: 0 }}
          transition={{ delay: 1.2, duration: 0.35 }}
        />
        <motion.circle
          cx="94"
          cy="16"
          r="3"
          className="ds-line-chart__dot ds-line-chart__dot--motopass"
          initial={{ scale: 0 }}
          animate={run ? { scale: 1 } : { scale: 0 }}
          transition={{ delay: 1.65, duration: 0.4 }}
        />
      </svg>

      <div className="ds-metrics-row">
        <div className="ds-metrics-row__col">
          <span className="ds-metrics-row__label">Traditional</span>
          <CountUp value={time.traditional} unit="days" run={run} tone="traditional" delay={250} />
        </div>
        <motion.span
          className="ds-metrics-row__arrow"
          animate={{ opacity: run ? 1 : 0.3, x: run ? 0 : -6 }}
        >
          →
        </motion.span>
        <div className="ds-metrics-row__col ds-metrics-row__col--right">
          <span className="ds-metrics-row__label ds-metrics-row__label--gold">MotoPass</span>
          <CountUp value={time.motopass} unit="days" run={run} tone="motopass" delay={600} />
        </div>
      </div>
    </CardShell>
  )
}

function JurisdictionsCard({
  currentPhase,
  run,
}: {
  currentPhase: Phase
  run: boolean
}) {
  const max = jurisdictions.motopass
  const tradW = Math.max(6, Math.round((jurisdictions.traditional / max) * 100))
  const motoW = Math.round((jurisdictions.motopass / max) * 100)
  const decoWidths = [92, 74, 58, 42]

  return (
    <CardShell cardPhase="jurisdictions" currentPhase={currentPhase} className="ds-card--jur">
      <h3 className="ds-card__title">Jurisdictions</h3>

      <div className="ds-hbars" aria-hidden>
        {decoWidths.map((w, i) => (
          <motion.div
            key={i}
            className="ds-hbars__bar ds-hbars__bar--deco"
            style={{ width: `${w}%` }}
            initial={{ scaleX: 0 }}
            animate={run ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.12 }}
          />
        ))}
        <motion.div
          className="ds-hbars__bar ds-hbars__bar--traditional"
          style={{ width: `${tradW}%` }}
          initial={{ scaleX: 0 }}
          animate={run ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
        />
        <motion.div
          className="ds-hbars__bar ds-hbars__bar--motopass"
          style={{ width: `${motoW}%` }}
          initial={{ scaleX: 0 }}
          animate={run ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
        />
      </div>

      <div className="ds-metrics-row">
        <div className="ds-metrics-row__col">
          <span className="ds-metrics-row__label">Traditional</span>
          <CountUp value={jurisdictions.traditional} unit="count" run={run} tone="traditional" delay={300} />
        </div>
        <motion.span
          className="ds-metrics-row__arrow"
          animate={{ opacity: run ? 1 : 0.3, x: run ? 0 : -6 }}
        >
          →
        </motion.span>
        <div className="ds-metrics-row__col ds-metrics-row__col--right">
          <span className="ds-metrics-row__label ds-metrics-row__label--gold">MotoPass</span>
          <CountUp value={jurisdictions.motopass} unit="count" run={run} tone="motopass" delay={650} />
        </div>
      </div>
    </CardShell>
  )
}

function SavingsCard({
  currentPhase,
  run,
}: {
  currentPhase: Phase
  run: boolean
}) {
  const savingsPct = Math.round(((legal.traditional - legal.motopass) / legal.traditional) * 100)

  return (
    <CardShell cardPhase="savings" currentPhase={currentPhase} className="ds-card--savings">
      <div className="ds-card__brand">
        <img src={LOGO_SRC} alt="" className="ds-card__brand-logo" width={22} height={22} aria-hidden />
        <span className="ds-card__brand-name">Savings</span>
      </div>

      <div className="ds-donut" aria-hidden>
        <svg viewBox="0 0 120 70" className="ds-donut__svg">
          <defs>
            <linearGradient id="ds-donut-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e68600" />
              <stop offset="100%" stopColor="#ffc46e" />
            </linearGradient>
          </defs>
          <path
            d="M 12 60 A 48 48 0 0 1 108 60"
            className="ds-donut__track"
            fill="none"
          />
          <motion.path
            d="M 12 60 A 48 48 0 0 1 108 60"
            className="ds-donut__arc"
            fill="none"
            stroke="url(#ds-donut-grad)"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={run ? { pathLength: savingsPct / 100 } : { pathLength: 0 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          />
        </svg>
        <motion.span
          className="ds-donut__pct"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={run ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          {savingsPct}%
        </motion.span>
      </div>

      <div className="ds-savings-value">
        <CountUp value={77_100} unit="usd" run={run} tone="gold" delay={400} />
        <span className="ds-savings-value__label">modeled legal delta</span>
      </div>
    </CardShell>
  )
}

function SummaryCard({
  currentPhase,
  run,
}: {
  currentPhase: Phase
  run: boolean
}) {
  return (
    <CardShell cardPhase="savings" currentPhase={currentPhase} className="ds-card--summary">
      <div className="ds-card__brand">
        <img src={LOGO_SRC} alt="" className="ds-card__brand-logo" width={22} height={22} aria-hidden />
        <span className="ds-card__brand-name">Modeled delta</span>
      </div>

      <div className="ds-summary-grid">
        <motion.div
          className="ds-summary-grid__item"
          initial={{ opacity: 0, y: 10 }}
          animate={run ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 0.3, duration: 0.45 }}
        >
          <CountUp value={77_100} unit="usd" run={run} tone="gold" delay={350} />
          <span className="ds-summary-grid__label">Legal</span>
        </motion.div>
        <motion.div
          className="ds-summary-grid__item"
          initial={{ opacity: 0, y: 10 }}
          animate={run ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 0.45, duration: 0.45 }}
        >
          <CountUp value={42} unit="days" run={run} tone="gold" delay={500} />
          <span className="ds-summary-grid__label">Days faster</span>
        </motion.div>
        <motion.div
          className="ds-summary-grid__item"
          initial={{ opacity: 0, y: 10 }}
          animate={run ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 0.6, duration: 0.45 }}
        >
          <CountUp value={47} unit="count" run={run} tone="gold" delay={650} />
          <span className="ds-summary-grid__label">Jurisdictions</span>
        </motion.div>
      </div>
    </CardShell>
  )
}

function Dashboard({ phase }: { phase: Phase }) {
  const past = (p: Phase) => PHASES.indexOf(phase) >= PHASES.indexOf(p)

  return (
    <div className="ds-dashboard">
      <CostComparisonCard currentPhase={phase} run={phase === 'cost' || phase === 'finale'} />
      <MotoPassMiniCard currentPhase={phase} run={phase === 'cost' || phase === 'finale'} />
      <TimeComparisonCard currentPhase={phase} run={phase === 'time' || phase === 'finale'} />
      <JurisdictionsCard currentPhase={phase} run={phase === 'jurisdictions' || phase === 'finale'} />
      <SavingsCard currentPhase={phase} run={past('savings')} />
      <SummaryCard currentPhase={phase} run={past('savings')} />
    </div>
  )
}

export function SavingsPresentation({ open, onClose, title }: SavingsPresentationProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  const panelRef = useRef<HTMLDivElement>(null)
  const phaseIndex = PHASES.indexOf(phase)

  const reset = useCallback(() => setPhase('intro'), [])

  useEffect(() => {
    if (!open) {
      reset()
      return
    }
    reset()
  }, [open, reset])

  useEffect(() => {
    if (!open) return

    const duration = PHASE_MS[phase]
    const timer = window.setTimeout(() => {
      const next = phaseIndex + 1
      if (next >= PHASES.length) {
        onClose()
        return
      }
      setPhase(PHASES[next])
    }, duration)

    return () => window.clearTimeout(timer)
  }, [open, phase, phaseIndex, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => panelRef.current?.focus())

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const progress = ((phaseIndex + 1) / PHASES.length) * 100

  const phaseLabel: Record<Phase, string> = {
    intro: 'Opening',
    cost: 'Cost comparison',
    time: 'Time comparison',
    jurisdictions: 'Jurisdictions',
    savings: 'Savings',
    finale: 'Summary',
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="savings-presentation"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="savings-presentation__vignette" aria-hidden />
          <div className="savings-presentation__grain" aria-hidden />

          <motion.button
            type="button"
            className="savings-presentation__close"
            onClick={onClose}
            aria-label="Close presentation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <X size={22} />
          </motion.button>

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="savings-presentation__stage"
            initial={{ opacity: 0, scale: 0.9, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          >
            <AnimatePresence mode="wait">
              {phase === 'intro' ? (
                <motion.div
                  key="intro"
                  className="ds-intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.img
                    src={LOGO_SRC}
                    alt="MotoPass"
                    className="ds-intro__logo"
                    width={88}
                    height={88}
                    initial={{ opacity: 0, scale: 0.82, rotate: -6 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <motion.span
                    className="ds-intro__eyebrow"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                  >
                    Members · Modeled economics
                  </motion.span>
                  <motion.h2
                    className="ds-intro__title"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.55 }}
                  >
                    {title}
                  </motion.h2>
                  <motion.p
                    className="ds-intro__disclaimer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    {METHODOLOGY_DISCLAIMER}
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  key="dashboard"
                  className="ds-stage-inner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.55 }}
                >
                  <motion.div
                    className="ds-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <img src={LOGO_SRC} alt="" className="ds-header__logo" width={26} height={26} aria-hidden />
                    <span className="ds-header__title">{title}</span>
                  </motion.div>
                  <Dashboard phase={phase} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="savings-presentation__progress-rail" aria-hidden>
            <motion.div
              className="savings-presentation__progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <motion.span
            className="savings-presentation__phase-label"
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {phaseLabel[phase]}
          </motion.span>

          <p className="savings-presentation__disclaimer">{METHODOLOGY_DISCLAIMER}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}