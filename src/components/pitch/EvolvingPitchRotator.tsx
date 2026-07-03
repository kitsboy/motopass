import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ProofBadge } from '../ui/ProofBadge';

export interface StackMetric {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
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

function CountUpAnimated({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
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
  }, [value]);

  return (
    <span className="font-mono tabular-nums">
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function CountUp({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
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
  return <CountUpAnimated key={value} value={value} prefix={prefix} suffix={suffix} />;
}

export function EvolvingPitchRotator({ metrics, taglines = DEFAULT_TAGLINES, proofTimestamp }: EvolvingPitchRotatorProps) {
  const [tagIndex, setTagIndex] = useState(0);
  const reduceMotion = useReducedMotion();

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="relative w-full max-w-md rounded-panel border border-white/10 bg-mp-modal/90 p-6 shadow-mp-4 backdrop-blur-md sm:p-8"
      aria-label="Live sovereignty metrics"
    >
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
            className="font-body text-sm text-mp-ink-inverse/80"
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
            <dt className="font-chrome text-[11px] uppercase tracking-[0.14em] text-mp-ink-inverse/50">
              {m.label}
            </dt>
            <dd className="text-h3 font-display text-mp-ink-inverse sm:text-lg2">
              <CountUp value={m.value} prefix={m.prefix} suffix={m.suffix} />
            </dd>
          </motion.div>
        ))}
      </dl>

      {formattedProof && (
        <p className="mt-5 border-t border-white/10 pt-4 font-mono text-[11px] text-mp-ink-inverse/40">
          Last anchored {formattedProof} &middot; OpenTimestamps
        </p>
      )}
    </motion.aside>
  );
}