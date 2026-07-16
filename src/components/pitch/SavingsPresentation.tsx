import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { DASHBOARD_METRICS, type MetricUnit } from '../../lib/savingsDashboardMetrics'

const DATA_STORY_SRC = '/images/data-story.jpg'
const LOGO_SRC = '/images/motopass-logo.png'

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
  delay = 0,
}: {
  value: number
  unit: MetricUnit
  active: boolean
  tone: 'traditional' | 'motopass'
  delay?: number
}) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(reduceMotion ? value : 0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!active) {
      setStarted(false)
      setDisplay(reduceMotion ? value : 0)
      return
    }

    const timer = window.setTimeout(() => setStarted(true), delay)
    return () => window.clearTimeout(timer)
  }, [active, delay, reduceMotion, value])

  useEffect(() => {
    if (!started) return
    if (reduceMotion) {
      setDisplay(value)
      return
    }

    let raf = 0
    const start = performance.now()
    const duration = 1400
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(eased * value))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, value, reduceMotion])

  const suffix = unit === 'days' ? ' days' : unit === 'count' ? '' : ''
  const formatted =
    unit === 'usd' ? `$${display.toLocaleString()}` : `${display.toLocaleString()}${suffix}`

  return (
    <span className={`data-story__value data-story__value--${tone}`}>{formatted}</span>
  )
}

function MetricBars({
  traditional,
  motopass,
  active,
  orientation,
  delay = 0,
}: {
  traditional: number
  motopass: number
  active: boolean
  orientation: 'vertical' | 'horizontal'
  delay?: number
}) {
  const max = Math.max(traditional, motopass, 1)
  const tradPct = Math.max(8, Math.round((traditional / max) * 100))
  const motoPct = Math.max(8, Math.round((motopass / max) * 100))

  return (
    <div
      className={`data-story__bars data-story__bars--${orientation}`}
      aria-hidden
    >
      <motion.div
        className="data-story__bar data-story__bar--traditional"
        style={orientation === 'vertical' ? { height: `${tradPct}%` } : { width: `${tradPct}%` }}
        initial={{ scaleY: orientation === 'vertical' ? 0 : 1, scaleX: orientation === 'horizontal' ? 0 : 1 }}
        animate={
          active
            ? { scaleY: 1, scaleX: 1 }
            : { scaleY: orientation === 'vertical' ? 0 : 1, scaleX: orientation === 'horizontal' ? 0 : 1 }
        }
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay }}
      />
      <motion.div
        className="data-story__bar data-story__bar--motopass"
        style={orientation === 'vertical' ? { height: `${motoPct}%` } : { width: `${motoPct}%` }}
        initial={{ scaleY: orientation === 'vertical' ? 0 : 1, scaleX: orientation === 'horizontal' ? 0 : 1 }}
        animate={
          active
            ? { scaleY: 1, scaleX: 1 }
            : { scaleY: orientation === 'vertical' ? 0 : 1, scaleX: orientation === 'horizontal' ? 0 : 1 }
        }
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: delay + 0.16 }}
      />
    </div>
  )
}

function MetricSlot({
  metricId,
  active,
  delay,
}: {
  metricId: string
  active: boolean
  delay: number
}) {
  const metric = DASHBOARD_METRICS.find(m => m.id === metricId)
  if (!metric) return null

  const orientation = metricId === 'jurisdictions' ? 'horizontal' : 'vertical'

  return (
    <motion.div
      className={`data-story__slot data-story__slot--${metricId}`}
      initial={{ opacity: 0, y: 14 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
    >
      <div className="data-story__slot-glass">
        <div className="data-story__slot-numbers">
          <div className="data-story__slot-col">
            <span className="data-story__slot-label">Traditional</span>
            <CountUp
              value={metric.traditional}
              unit={metric.unit}
              active={active}
              tone="traditional"
              delay={delay * 1000 + 200}
            />
          </div>
          <span className="data-story__slot-arrow" aria-hidden>
            →
          </span>
          <div className="data-story__slot-col data-story__slot-col--right">
            <span className="data-story__slot-label data-story__slot-label--gold">MotoPass</span>
            <CountUp
              value={metric.motopass}
              unit={metric.unit}
              active={active}
              tone="motopass"
              delay={delay * 1000 + 450}
            />
          </div>
        </div>
        <MetricBars
          traditional={metric.traditional}
          motopass={metric.motopass}
          active={active}
          orientation={orientation}
          delay={delay + 0.35}
        />
        <span className="data-story__slot-delta">{metric.deltaLabel}</span>
      </div>
    </motion.div>
  )
}

export function SavingsPresentation({ open, onClose, title }: SavingsPresentationProps) {
  const [animating, setAnimating] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setAnimating(false)
      return
    }
    const t = window.setTimeout(() => setAnimating(true), 120)
    return () => window.clearTimeout(t)
  }, [open])

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
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.button
            type="button"
            className="savings-presentation__close"
            onClick={onClose}
            aria-label="Close presentation"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
          >
            <X size={22} />
          </motion.button>

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="savings-presentation__frame"
            initial={{ opacity: 0, scale: 0.9, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={DATA_STORY_SRC}
              alt=""
              className="data-story__art"
              width={1168}
              height={784}
              decoding="async"
            />

            <div className="data-story__scrim" aria-hidden />

            <motion.img
              src={LOGO_SRC}
              alt="MotoPass"
              className="data-story__watermark"
              width={200}
              height={200}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={animating ? { opacity: 0.92, scale: 1 } : {}}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />

            <img
              src={LOGO_SRC}
              alt=""
              className="data-story__card-logo data-story__card-logo--cost"
              width={28}
              height={28}
              aria-hidden
            />
            <img
              src={LOGO_SRC}
              alt=""
              className="data-story__card-logo data-story__card-logo--jur"
              width={28}
              height={28}
              aria-hidden
            />

            <motion.div
              className="data-story__title-band"
              initial={{ opacity: 0, y: -10 }}
              animate={animating ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.15 }}
            >
              <img src={LOGO_SRC} alt="" className="data-story__title-logo" width={24} height={24} aria-hidden />
              <span className="data-story__title-text">{title}</span>
            </motion.div>

            <MetricSlot metricId="legal" active={animating} delay={0.35} />
            <MetricSlot metricId="time" active={animating} delay={0.55} />
            <MetricSlot metricId="jurisdictions" active={animating} delay={0.75} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}