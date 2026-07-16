import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { DASHBOARD_METRICS, type MetricUnit } from '../../lib/savingsDashboardMetrics'

const DATA_STORY_SRC = '/images/data-story.jpg'
const LOGO_SRC = '/images/motopass-logo.png'

const PHASES = ['intro', 'legal', 'time', 'jurisdictions', 'finale'] as const
type Phase = (typeof PHASES)[number]

const PHASE_MS: Record<Phase, number> = {
  intro: 2400,
  legal: 4200,
  time: 4200,
  jurisdictions: 4200,
  finale: 3200,
}

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
    const duration = 1500

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

  return <span className={`data-story__value data-story__value--${tone}`}>{formatted}</span>
}

function VerticalBars({
  traditional,
  motopass,
  run,
}: {
  traditional: number
  motopass: number
  run: boolean
}) {
  const max = Math.max(traditional, motopass, 1)
  const tradH = Math.max(10, Math.round((traditional / max) * 100))
  const motoH = Math.max(10, Math.round((motopass / max) * 100))

  return (
    <div className="data-story__vbars" aria-hidden>
      <div className="data-story__vbar-col">
        <motion.div
          className="data-story__vbar data-story__vbar--traditional"
          style={{ height: `${tradH}%` }}
          initial={{ scaleY: 0 }}
          animate={run ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        />
      </div>
      <div className="data-story__vbar-col">
        <motion.div
          className="data-story__vbar data-story__vbar--motopass"
          style={{ height: `${motoH}%` }}
          initial={{ scaleY: 0 }}
          animate={run ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
        />
      </div>
    </div>
  )
}

function TimeLineChart({ run }: { run: boolean }) {
  const tradPath = 'M 8 72 C 28 58, 42 38, 58 28 S 82 18, 92 14'
  const motoPath = 'M 8 78 C 28 68, 42 58, 58 50 S 82 42, 92 38'

  return (
    <svg className="data-story__line-chart" viewBox="0 0 100 88" aria-hidden>
      <defs>
        <linearGradient id="moto-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e68600" />
          <stop offset="100%" stopColor="#ffc46e" />
        </linearGradient>
      </defs>
      {[18, 36, 54, 72].map(y => (
        <line key={y} x1="6" y1={y} x2="94" y2={y} className="data-story__grid-line" />
      ))}
      <motion.path
        d={tradPath}
        className="data-story__line data-story__line--traditional"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={run ? { pathLength: 1, opacity: 0.55 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
      <motion.path
        d={motoPath}
        className="data-story__line data-story__line--motopass"
        fill="none"
        stroke="url(#moto-line-grad)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={run ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
      />
      <motion.circle
        cx="92"
        cy="14"
        r="2.8"
        className="data-story__line-dot data-story__line-dot--traditional"
        initial={{ scale: 0, opacity: 0 }}
        animate={run ? { scale: 1, opacity: 0.7 } : { scale: 0, opacity: 0 }}
        transition={{ delay: 1.55, duration: 0.35 }}
      />
      <motion.circle
        cx="92"
        cy="38"
        r="3.2"
        className="data-story__line-dot data-story__line-dot--motopass"
        initial={{ scale: 0, opacity: 0 }}
        animate={run ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ delay: 1.85, duration: 0.4 }}
      />
    </svg>
  )
}

function HorizontalBars({
  traditional,
  motopass,
  run,
}: {
  traditional: number
  motopass: number
  run: boolean
}) {
  const max = Math.max(traditional, motopass, 1)
  const tradW = Math.max(8, Math.round((traditional / max) * 100))
  const motoW = Math.max(12, Math.round((motopass / max) * 100))

  return (
    <div className="data-story__hbars" aria-hidden>
      <motion.div
        className="data-story__hbar data-story__hbar--traditional"
        style={{ width: `${tradW}%` }}
        initial={{ scaleX: 0 }}
        animate={run ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      />
      <motion.div
        className="data-story__hbar data-story__hbar--motopass"
        style={{ width: `${motoW}%` }}
        initial={{ scaleX: 0 }}
        animate={run ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
      />
    </div>
  )
}

function MetricPanel({
  metricId,
  phase,
  currentPhase,
}: {
  metricId: string
  phase: Phase
  currentPhase: Phase
}) {
  const metric = DASHBOARD_METRICS.find(m => m.id === metricId)
  if (!metric) return null

  const active = currentPhase === phase
  const revealed =
    PHASES.indexOf(currentPhase) >= PHASES.indexOf(phase) && currentPhase !== 'intro'
  const isLegal = metricId === 'legal'
  const isTime = metricId === 'time'

  return (
    <motion.div
      className={`data-story__slot data-story__slot--${metricId}${active ? ' data-story__slot--active' : ''}`}
      animate={{
        opacity: revealed ? (active ? 1 : 0.42) : 0,
        scale: active ? 1 : 0.98,
        filter: active ? 'brightness(1)' : 'brightness(0.72)',
      }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="data-story__slot-glass"
        animate={{
          borderColor: active ? 'rgba(255, 149, 0, 0.42)' : 'rgba(255, 149, 0, 0.12)',
          boxShadow: active
            ? '0 0 40px rgba(255, 149, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        }}
        transition={{ duration: 0.6 }}
      >
        <span className="data-story__slot-eyebrow">{metric.label}</span>

        <div className="data-story__slot-numbers">
          <div className="data-story__slot-col">
            <span className="data-story__slot-label">Traditional</span>
            <CountUp
              value={metric.traditional}
              unit={metric.unit}
              run={active}
              tone="traditional"
              delay={180}
            />
          </div>
          <motion.span
            className="data-story__slot-arrow"
            aria-hidden
            animate={{ opacity: active ? 1 : 0.35, x: active ? 0 : -4 }}
          >
            →
          </motion.span>
          <div className="data-story__slot-col data-story__slot-col--right">
            <span className="data-story__slot-label data-story__slot-label--gold">MotoPass</span>
            <CountUp
              value={metric.motopass}
              unit={metric.unit}
              run={active}
              tone="motopass"
              delay={520}
            />
          </div>
        </div>

        {isLegal && <VerticalBars traditional={metric.traditional} motopass={metric.motopass} run={active} />}
        {isTime && <TimeLineChart run={active} />}
        {!isLegal && !isTime && (
          <HorizontalBars traditional={metric.traditional} motopass={metric.motopass} run={active} />
        )}

        <motion.span
          className="data-story__slot-delta"
          initial={{ opacity: 0, y: 6 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ delay: 0.9, duration: 0.45 }}
        >
          {metric.deltaLabel}
        </motion.span>
      </motion.div>
    </motion.div>
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
            className="savings-presentation__frame"
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="data-story__art-wrap"
              animate={{ scale: phase === 'intro' ? 1.04 : 1 }}
              transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={DATA_STORY_SRC}
                alt=""
                className="data-story__art"
                width={1168}
                height={784}
                decoding="async"
              />
            </motion.div>

            <div className="data-story__scrim" aria-hidden />

            <motion.div
              className="data-story__spotlight data-story__spotlight--legal"
              animate={{ opacity: phase === 'legal' ? 1 : 0 }}
              transition={{ duration: 0.65 }}
              aria-hidden
            />
            <motion.div
              className="data-story__spotlight data-story__spotlight--time"
              animate={{ opacity: phase === 'time' ? 1 : 0 }}
              transition={{ duration: 0.65 }}
              aria-hidden
            />
            <motion.div
              className="data-story__spotlight data-story__spotlight--jurisdictions"
              animate={{ opacity: phase === 'jurisdictions' ? 1 : 0 }}
              transition={{ duration: 0.65 }}
              aria-hidden
            />

            <motion.img
              src={LOGO_SRC}
              alt="MotoPass"
              className="data-story__watermark"
              width={200}
              height={200}
              initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
              animate={{ opacity: 0.95, scale: 1, rotate: 0 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
            />

            <motion.img
              src={LOGO_SRC}
              alt=""
              className="data-story__card-logo data-story__card-logo--cost"
              width={28}
              height={28}
              aria-hidden
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
            <motion.img
              src={LOGO_SRC}
              alt=""
              className="data-story__card-logo data-story__card-logo--jur"
              width={28}
              height={28}
              aria-hidden
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
            />

            <AnimatePresence mode="wait">
              {phase === 'intro' ? (
                <motion.div
                  key="intro"
                  className="data-story__intro"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.65 }}
                >
                  <motion.img
                    src={LOGO_SRC}
                    alt="MotoPass"
                    className="data-story__intro-logo"
                    width={80}
                    height={80}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.7 }}
                  />
                  <span className="data-story__intro-eyebrow">Members · Modeled economics</span>
                  <h2 className="data-story__intro-title">{title}</h2>
                </motion.div>
              ) : (
                <motion.div
                  key="metrics"
                  className="data-story__metrics-layer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="data-story__title-band"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <img src={LOGO_SRC} alt="" className="data-story__title-logo" width={24} height={24} aria-hidden />
                    <span className="data-story__title-text">{title}</span>
                  </motion.div>

                  <MetricPanel metricId="legal" phase="legal" currentPhase={phase} />
                  <MetricPanel metricId="time" phase="time" currentPhase={phase} />
                  <MetricPanel metricId="jurisdictions" phase="jurisdictions" currentPhase={phase} />

                  {phase === 'finale' && (
                    <motion.div
                      className="data-story__finale"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <span className="data-story__finale-eyebrow">Modeled delta</span>
                      <div className="data-story__finale-grid">
                        <div>
                          <CountUp value={77_100} unit="usd" run tone="gold" delay={100} />
                          <span className="data-story__finale-label">Legal</span>
                        </div>
                        <div>
                          <CountUp value={42} unit="days" run tone="gold" delay={280} />
                          <span className="data-story__finale-label">Days faster</span>
                        </div>
                        <div>
                          <CountUp value={47} unit="count" run tone="gold" delay={460} />
                          <span className="data-story__finale-label">Jurisdictions</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
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
            {phase === 'intro' && 'Opening'}
            {phase === 'legal' && 'Legal & advisory'}
            {phase === 'time' && 'Time to approval'}
            {phase === 'jurisdictions' && 'Jurisdictions'}
            {phase === 'finale' && 'Summary'}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}