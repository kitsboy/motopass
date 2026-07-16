import { motion, useReducedMotion } from 'motion/react'
import { useTabVisible } from '../../hooks/useTabVisible'

/**
 * Cinematic full-bleed hero — header-elite.jpg with slow Ken Burns,
 * dual fog parallax layers, vignette, and legibility scrims.
 */
export function HeroMotionBackground() {
  const reduceMotion = useReducedMotion()
  const tabVisible = useTabVisible()
  const animate = !reduceMotion && tabVisible

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Layer 1 — elite header photograph, very slow Ken Burns */}
      <motion.img
        src="/images/header-elite.jpg"
        alt=""
        className="hero-elite-photo absolute inset-0 h-full w-full object-cover object-[center_22%]"
        initial={{ scale: 1.02, x: 0, y: 0 }}
        animate={animate ? { scale: 1.07, x: '-0.6%', y: '-0.4%' } : undefined}
        transition={{ duration: 42, ease: [0.16, 1, 0.3, 1], repeat: Infinity, repeatType: 'reverse' }}
      />

      {/* Layer 2 — fog parallax (drifts opposite to photo) */}
      <div
        className={`hero-elite-fog hero-elite-fog--a pointer-events-none absolute inset-0 ${
          animate ? 'hero-elite-fog--animate-a' : 'hero-elite-fog--static'
        }`}
      />
      <div
        className={`hero-elite-fog hero-elite-fog--b pointer-events-none absolute inset-0 ${
          animate ? 'hero-elite-fog--animate-b' : 'hero-elite-fog--static'
        }`}
      />

      {/* Layer 3 — guilloche security print, whisper */}
      <div className="absolute inset-0 bg-guilloche bg-[length:200px_200px] opacity-[0.04] mix-blend-overlay" />

      {/* Layer 4 — cinematic vignette + left legibility scrim */}
      <div className="hero-elite-vignette absolute inset-0" />
      <div className="hero-elite-scrim absolute inset-0" />

      {/* Layer 5 — bottom falloff */}
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#08080e]/88 via-[#08080e]/35 to-transparent" />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'var(--grain-svg)',
          opacity: 'calc(var(--grain-opacity, 0.04) * 1.2)',
        }}
      />
    </div>
  )
}