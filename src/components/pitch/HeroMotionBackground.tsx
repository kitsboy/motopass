import { motion, useReducedMotion } from 'motion/react';

/**
 * HeroMotionBackground
 * Dual-layer cinematic backdrop: sovereignty.jpg Ken Burns @ 35% opacity,
 * guilloche security-print overlay @ 6%, radial warm-to-obsidian scrim on top.
 * Mobile: Ken Burns pans slower and crops tighter so the scrim carries contrast alone.
 */
export function HeroMotionBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Layer 1 — photographic imagery, Ken Burns */}
      <motion.img
        src="/images/sovereignty.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 'var(--hero-opacity)' }}
        initial={{ scale: 1, x: 0, y: 0 }}
        animate={reduceMotion ? undefined : { scale: 1.08, x: '-1%', y: '-1%' }}
        transition={{ duration: 24, ease: [0.16, 1, 0.3, 1], repeat: Infinity, repeatType: 'reverse' }}
      />

      {/* Layer 2 — guilloche security print, static, low opacity */}
      <div
        className="absolute inset-0 bg-guilloche bg-[length:180px_180px] opacity-[0.06] mix-blend-overlay"
      />

      {/* Layer 3 — radial warm scrim (ochre glow top-right → obsidian falloff) */}
      <div className="absolute inset-0 bg-gradient-hero" />

      {/* Layer 4 — bottom scrim for text legibility on mobile fold */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-scrim-bottom" />

      {/* Grain — 3.5% film grain, breaks up any gradient banding */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'var(--grain-svg)',
          opacity: 'var(--grain-opacity)',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}
