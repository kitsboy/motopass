import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X, TrendingDown } from 'lucide-react'
import {
  DASHBOARD_METRICS,
  formatMetricValue,
  metricSuffix,
  type DashboardMetric,
  type MetricUnit,
} from '../../lib/savingsDashboardMetrics'

const SCENE_ORDER = ['intro', ...DASHBOARD_METRICS.map(m => m.id), 'summary', 'outro'] as const
type SceneId = (typeof SCENE_ORDER)[number]

const SCENE_MS: Record<SceneId, number> = {
  intro: 2800,
  legal: 4500,
  time: 4500,
  jurisdictions: 4500,
  summary: 4200,
  outro: 3600,
}

interface SavingsPresentationProps {
  open: boolean
  onClose: () => void
  title: string
}

function CountUp({
  value,
  unit,
  active,
  tone,
}: {
  value: number
  unit: MetricUnit
  active: boolean
  tone: 'traditional' | 'motopass' | 'gold'
}) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(reduceMotion ? value : 0)

  useEffect(() => {
    if (!active) {
      setDisplay(reduceMotion ? value : 0)
      return
    }
    if (reduceMotion) {
      setDisplay(value)
      return
    }

    let raf = 0
    const start = performance.now()
    const duration = 1200
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(eased * value))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, active, reduceMotion])

  const suffix = metricSuffix(unit)
  const formatted =
    unit === 'usd'
      ? `$${display.toLocaleString()}`
      : `${display.toLocaleString()}${suffix ? ` ${suffix}` : ''}`

  return (
    <span className={`savings-presentation__value savings-presentation__value--${tone}`}>
      {formatted}
    </span>
  )
}

function PresentationBar({
  value,
  max,
  tone,
  active,
  delay = 0,
}: {
  value: number
  max: number
  tone: 'traditional' | 'motopass'
  active: boolean
  delay?: number
}) {
  const widthPct = Math.max(6, Math.round((value / max) * 100))

  return (
    <div className="savings-presentation__bar-track">
      <motion.div
        className={`savings-presentation__bar-fill savings-presentation__bar-fill--${tone}`}
        style={{ width: `${widthPct}%` }}
        initial={{ scaleX: 0 }}
        animate={active ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay }}
      />
    </div>
  )
}

function MetricScene({ metric, active }: { metric: DashboardMetric; active: boolean }) {
  const max = Math.max(metric.traditional, metric.motopass)
  const suffix = metricSuffix(metric.unit)

  return (
    <motion.div
      key={metric.id}
      className="savings-presentation__scene-inner"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="savings-presentation__scene-eyebrow">{metric.label}</span>
      <div className="savings-presentation__compare-row">
        <div className="savings-presentation__compare-col">
          <span className="savings-presentation__compare-label">Traditional</span>
          <CountUp value={metric.traditional} unit={metric.unit} active={active} tone="traditional" />
        </div>
        <div className="savings-presentation__compare-col savings-presentation__compare-col--right">
          <span className="savings-presentation__compare-label savings-presentation__compare-label--gold">
            MotoPass
          </span>
          <CountUp value={metric.motopass} unit={metric.unit} active={active} tone="motopass" />
        </div>
      </div>

      <div className="savings-presentation__bars">
        <div className="savings-presentation__bar-row">
          <span className="savings-presentation__bar-label">Traditional</span>
          <PresentationBar value={metric.traditional} max={max} tone="traditional" active={active} />
          <span className="savings-presentation__bar-num">
            {formatMetricValue(metric.traditional, metric.unit)}
            {suffix ? ` ${suffix}` : ''}
          </span>
        </div>
        <div className="savings-presentation__bar-row">
          <span className="savings-presentation__bar-label savings-presentation__bar-label--gold">
            MotoPass
          </span>
          <PresentationBar
            value={metric.motopass}
            max={max}
            tone="motopass"
            active={active}
            delay={0.18}
          />
          <span className="savings-presentation__bar-num savings-presentation__bar-num--gold">
            {formatMetricValue(metric.motopass, metric.unit)}
            {suffix ? ` ${suffix}` : ''}
          </span>
        </div>
      </div>

      <span className="savings-presentation__delta">
        <TrendingDown size={13} aria-hidden />
        {metric.deltaLabel}
      </span>
    </motion.div>
  )
}

export function SavingsPresentation({ open, onClose, title }: SavingsPresentationProps) {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const scene = SCENE_ORDER[sceneIndex]

  const restart = useCallback(() => {
    setSceneIndex(0)
    setPlaying(true)
  }, [])

  useEffect(() => {
    if (!open) {
      setPlaying(false)
      setSceneIndex(0)
      return
    }
    restart()
  }, [open, restart])

  useEffect(() => {
    if (!open || !playing) return

    const duration = SCENE_MS[scene]
    const isLast = sceneIndex >= SCENE_ORDER.length - 1
    const timer = window.setTimeout(() => {
      if (isLast) {
        onClose()
        return
      }
      setSceneIndex(i => i + 1)
    }, duration)

    return () => window.clearTimeout(timer)
  }, [open, playing, scene, sceneIndex, onClose])

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

  const metric = DASHBOARD_METRICS.find(m => m.id === scene)

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
          transition={{ duration: 0.35 }}
        >
          <div className="savings-presentation__ambient" aria-hidden />
          <div className="savings-presentation__grid" aria-hidden />

          <div ref={panelRef} tabIndex={-1} className="savings-presentation__stage">
            <button
              type="button"
              className="savings-presentation__close"
              onClick={onClose}
              aria-label="Close presentation"
            >
              <X size={20} />
            </button>

            <div className="savings-presentation__progress" aria-hidden>
              {SCENE_ORDER.map((id, i) => (
                <span
                  key={id}
                  className={`savings-presentation__progress-dot${i <= sceneIndex ? ' savings-presentation__progress-dot--active' : ''}${i === sceneIndex ? ' savings-presentation__progress-dot--current' : ''}`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {scene === 'intro' && (
                <motion.div
                  key="intro"
                  className="savings-presentation__scene-inner savings-presentation__scene-inner--intro"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.img
                    src="/images/motopass-logo.png"
                    alt="MotoPass"
                    className="savings-presentation__logo"
                    width={96}
                    height={96}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.7 }}
                  />
                  <span className="savings-presentation__intro-eyebrow">Members · Modeled economics</span>
                  <h2 className="savings-presentation__intro-title">{title}</h2>
                  <p className="savings-presentation__intro-copy">
                    Three comparisons. Exact figures. Modeled — not promised.
                  </p>
                </motion.div>
              )}

              {metric && <MetricScene key={metric.id} metric={metric} active />}

              {scene === 'summary' && (
                <motion.div
                  key="summary"
                  className="savings-presentation__scene-inner"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="savings-presentation__scene-eyebrow">Modeled delta</span>
                  <div className="savings-presentation__summary-grid">
                    <div className="savings-presentation__summary-item">
                      <CountUp value={77_100} unit="usd" active tone="gold" />
                      <span className="savings-presentation__summary-label">Legal delta</span>
                    </div>
                    <div className="savings-presentation__summary-item">
                      <CountUp value={42} unit="days" active tone="gold" />
                      <span className="savings-presentation__summary-label">Days faster</span>
                    </div>
                    <div className="savings-presentation__summary-item">
                      <CountUp value={47} unit="count" active tone="gold" />
                      <span className="savings-presentation__summary-label">More jurisdictions</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {scene === 'outro' && (
                <motion.div
                  key="outro"
                  className="savings-presentation__scene-inner savings-presentation__scene-inner--intro"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    src="/images/motopass-logo.png"
                    alt="MotoPass"
                    className="savings-presentation__logo savings-presentation__logo--small"
                    width={72}
                    height={72}
                  />
                  <p className="savings-presentation__outro-copy">
                    Modeled for member evaluation only — elite advisory economics, not a guarantee.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}