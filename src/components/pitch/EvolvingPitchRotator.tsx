import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'motion/react';
import { ProofBadge } from '../ui/ProofBadge';
import { BtcDualPrice } from '../BtcDualPrice';

export interface StackMetric {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  usdValue?: number;
}

interface EvolvingPitchRotatorProps {
  metrics: StackMetric[];
  taglines?: string[];
  proofTimestamp?: string;
}

const DEFAULT_TAGLINES = [
  'stacked across 50 jurisdictions.',
  'anchored to Bitcoin, not a brochure.',
  'modeled in real cost, not marketing math.',
];

function CountUpAnimated({
  value,
  prefix = '',
  suffix = '',
  active,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  active: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) {
      setDisplay(0);
      return;
    }

    let raf: number;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, active]);

  return (
    <span className="font-mono tabular-nums">
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function CountUp({
  value,
  prefix = '',
  suffix = '',
  active,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  active: boolean;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return (
      <span className="font-mono tabular-nums">
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </span>
    );
  }
  return (
    <CountUpAnimated
      key={`${value}-${active}`}
      value={value}
      prefix={prefix}
      suffix={suffix}
      active={active}
    />
  );
}

function TaglineAnnouncer({ tagline }: { tagline: string }) {
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {tagline}
    </p>
  );
}

export function EvolvingPitchRotator({ metrics, taglines = DEFAULT_TAGLINES, proofTimestamp }: EvolvingPitchRotatorProps) {
  const [tagIndex, setTagIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setTagIndex((i) => (i + 1) % taglines.length), 4200);
    return () => clearInterval(id);
  }, [taglines.length, reduceMotion]);

  const formattedProof = useMemo(() => {
    if (!proofTimestamp) return null;
    return new Date(proofTimestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }, [proofTimestamp]);

  return (
    <motion.aside
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="hero-glass-panel relative w-full max-w-md rounded-panel border p-6 shadow-mp-4 backdrop-blur-md sm:p-8"
      aria-label="Live sovereignty metrics"
    >
      <TaglineAnnouncer tagline={taglines[tagIndex]} />
      <div className="flex items-center justify-between gap-3">
        <span className="font-chrome text-eyebrow uppercase tracking-[0.2em] text-mp-btc">
          Live &middot; This week
        </span>
        <ProofBadge status="verified" compact />
      </div>

      <div className="mt-3 h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={tagIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-body text-sm text-mp-on-hero-secondary"
          >
            {taglines[tagIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-1 sm:divide-y sm:divide-white/10">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="sm:flex sm:items-baseline sm:justify-between sm:py-3"
          >
            <dt className="font-chrome text-[11px] uppercase tracking-[0.14em] text-mp-on-hero-muted">
              {m.label}
            </dt>
            <dd className="text-h3 font-display text-mp-on-hero sm:text-lg2">
              {m.usdValue != null ? (
                <BtcDualPrice usd={m.usdValue} size="lg" layout="stack" />
              ) : (
                <CountUp value={m.value} prefix={m.prefix} suffix={m.suffix} active={inView} />
              )}
            </dd>
          </motion.div>
        ))}
      </dl>

      {formattedProof && (
        <p className="mt-5 border-t border-white/10 pt-4 font-mono text-[11px] text-mp-on-hero-subtle">
          Last anchored {formattedProof} &middot; OpenTimestamps
        </p>
      )}
    </motion.aside>
  );
}