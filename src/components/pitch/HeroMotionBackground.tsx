/**
 * Cinematic full-bleed hero — sovereignty.jpg (Imagine) with header-elite fallback,
 * CSS Ken Burns + dual fog drift. Motion is always on via CSS keyframes.
 * Optimized: webp + responsive srcset (above-the-fold, so eager with srcset, not lazy).
 */
export function HeroMotionBackground() {
  return (
    <div className="hero-elite-stage absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src="/images/sovereignty.webp"
        srcSet="/images/sovereignty-480w.webp 480w, /images/sovereignty-800w.webp 800w, /images/sovereignty.webp 1280w"
        sizes="100vw"
        alt=""
        width={1280}
        height={720}
        className="hero-elite-photo hero-elite-photo--animate absolute -left-[6%] -top-[6%] inset-0 h-[112%] w-[112%] max-w-none object-cover"
        onError={(e) => {
          const img = e.currentTarget
          if (!img.src.endsWith('header-elite.webp')) {
            img.src = '/images/header-elite.webp'
          }
        }}
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
