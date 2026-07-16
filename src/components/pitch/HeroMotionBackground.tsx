/**
 * Cinematic full-bleed hero — header-elite.jpg with CSS Ken Burns + dual fog drift.
 * Motion is always on via CSS keyframes (not gated by useReducedMotion).
 */
export function HeroMotionBackground() {
  return (
    <div className="hero-elite-stage absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src="/images/header-elite.jpg"
        alt=""
        className="hero-elite-photo hero-elite-photo--animate absolute -left-[6%] -top-[6%] inset-0 h-[112%] w-[112%] max-w-none object-cover"
      />

      <div className="hero-elite-fog hero-elite-fog--a hero-elite-fog--animate-a pointer-events-none absolute inset-0" />
      <div className="hero-elite-fog hero-elite-fog--b hero-elite-fog--animate-b pointer-events-none absolute inset-0" />

      <div className="absolute inset-0 bg-guilloche bg-[length:200px_200px] opacity-[0.04] mix-blend-overlay" />

      <div className="hero-elite-vignette absolute inset-0" />
      <div className="hero-elite-scrim absolute inset-0" />

      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#08080e]/88 via-[#08080e]/35 to-transparent" />

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