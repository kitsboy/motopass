import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import type { SavingsRow } from '../../lib/pitchStats';
import { BtcDualPrice } from '../BtcDualPrice';

interface SavingsGraphsProps {
  title?: string;
  rows: SavingsRow[];
  loading?: boolean;
}

function Bar({
  value,
  max,
  tone,
  delay,
  unit,
}: {
  value: number;
  max: number;
  tone: 'muted' | 'btc';
  delay: number;
  unit: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduceMotion = useReducedMotion();
  const widthPct = Math.max(4, Math.round((value / max) * 100));

  return (
    <div ref={ref} className="flex items-center gap-3">
      <div className="h-2.5 w-full overflow-hidden rounded-chip bg-mp-section">
        <motion.div
          className={`h-full origin-left rounded-chip ${tone === 'btc' ? 'bg-mp-btc' : 'bg-mp-ink-tertiary/70'}`}
          style={{ width: `${widthPct}%` }}
          initial={{ scaleX: reduceMotion ? 1 : 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
      <span className="w-28 shrink-0 text-right text-mp-ink-secondary">
        {unit === '$' ? (
          <BtcDualPrice usd={value} size="xs" layout="stack" />
        ) : (
          <span className="font-mono text-sm tabular-nums">
            {value.toLocaleString()} {unit}
          </span>
        )}
      </span>
    </div>
  );
}

export function SavingsGraphs({ title = 'Cost & time, modeled — not promised', rows, loading }: SavingsGraphsProps) {
  if (loading) {
    return (
      <section className="relative overflow-hidden bg-mp-section py-16 sm:py-24 animate-pulse">
        <div className="mx-auto max-w-4xl px-6 h-64 rounded-card bg-mp-card/50" />
      </section>
    );
  }

  const maxByRow = rows.map((r) => Math.max(r.traditional, r.motopass));

  return (
    <section
      className="relative overflow-hidden bg-mp-section py-16 sm:py-24"
      style={{ clipPath: 'polygon(0 3vw, 100% 0, 100% 100%, 0 100%)' }}
      aria-labelledby="savings-graphs-heading"
    >
      <div className="mx-auto max-w-4xl px-6">
        <span className="font-mono text-eyebrow uppercase tracking-[0.2em] text-mp-ochre">
          Cost &amp; Time, Modeled
        </span>
        <h2 id="savings-graphs-heading" className="mt-3 font-display text-h2 text-mp-ink">
          {title}
        </h2>
        <p className="mt-4 max-w-xl font-body text-body text-mp-ink-secondary">
          Figures pulled live from <code className="font-mono text-sm">countries.json</code> — shown Bitcoin-first at spot. Every bar updates when program terms or BTC price moves.
        </p>

        <div className="mt-12 space-y-8">
          {rows.map((row, i) => (
            <div key={row.label}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-chrome text-sm font-medium text-mp-ink">{row.label}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-28 shrink-0 font-chrome text-xs uppercase tracking-wide text-mp-ink-tertiary">
                    Traditional
                  </span>
                  <Bar value={row.traditional} max={maxByRow[i]} tone="muted" delay={i * 0.08} unit={row.unit} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-28 shrink-0 font-chrome text-xs uppercase tracking-wide text-mp-btc-text">
                    MotoPass
                  </span>
                  <Bar value={row.motopass} max={maxByRow[i]} tone="btc" delay={i * 0.08 + 0.15} unit={row.unit} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}