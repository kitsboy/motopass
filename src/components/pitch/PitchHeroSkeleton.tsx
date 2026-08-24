/**
 * PitchHeroSkeleton — RouteSuspense fallback for the lazy `/` (PitchPage) route.
 *
 * The lazy PitchPage mounts a tall hero (≈1415px on mobile). A generic CardSkeleton
 * only occupies the top ~300px of that reserved space, so when the real hero mounts
 * its content appears at a different vertical position than the placeholder → the
 * viewport "jumps" (CLS pop-in, the exact regression Cam complained about).
 *
 * This skeleton mirrors the hero's above-fold structure (tagline → eyebrow → sub →
 * spot-price subline → stat chips → CTAs → live-data row → glass panel) with
 * shimmer bars sized and spaced to land at the SAME pixel positions as the real
 * hero, so the swap is in-place and CLS stays ≈0. The route stays LAZY (bundle win).
 */
export function PitchHeroSkeleton() {
  return (
    <section
      className="pitch-hero-elite relative isolate w-full overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative z-[1] mx-auto flex min-h-[min(88vh,920px)] max-w-7xl flex-col justify-center gap-12 px-4 sm:px-6 py-20 sm:py-24 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:py-28">
        {/* hero-elite-copy — mirrors the real hero copy column */}
        <div className="hero-elite-copy max-w-2xl w-full">
          {/* tagline: 3 lines */}
          <div className="space-y-2.5">
            <span className="skeleton-shimmer block h-7 w-44" />
            <span className="skeleton-shimmer block h-14 w-72 max-w-full" />
            <span className="skeleton-shimmer block h-7 w-52" />
          </div>
          {/* eyebrow */}
          <span className="skeleton-shimmer block h-4 w-60 mt-6" />
          {/* pitch.hero paragraph */}
          <div className="mt-4 space-y-2.5 max-w-lg">
            <span className="skeleton-shimmer block h-5 w-full" />
            <span className="skeleton-shimmer block h-5 w-11/12" />
          </div>
          {/* spot-price subline */}
          <span className="skeleton-shimmer block h-4 w-72 mt-3" />
          {/* stat chips (reserved space for live-stats chips) */}
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="skeleton-shimmer h-8 w-32" />
            <span className="skeleton-shimmer h-8 w-48" />
            <span className="skeleton-shimmer h-8 w-28" />
          </div>
          {/* CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <span className="skeleton-shimmer h-12 w-full sm:w-52" />
            <span className="skeleton-shimmer h-12 w-full sm:w-48" />
            <span className="skeleton-shimmer h-12 w-full sm:w-48" />
          </div>
          {/* live-data row (BlockHeight / BtcPriceTicker / evolve / version) */}
          <div className="mt-6 flex flex-wrap items-center gap-3 min-h-[138px]">
            <span className="skeleton-shimmer h-4 w-44" />
            <span className="skeleton-shimmer h-4 w-44" />
            <span className="skeleton-shimmer h-4 w-32" />
            <span className="skeleton-shimmer h-6 w-40" />
          </div>
        </div>

        {/* glass panel skeleton — mirrors EvolvingPitchRotator / loading glass panel */}
        <div className="hero-glass-panel relative w-full max-w-md rounded-panel border border-white/12 bg-mp-modal/40 p-6 sm:p-8 backdrop-blur-md min-h-[370px] sm:min-h-[493px]">
          <span className="skeleton-shimmer block h-4 w-32" />
          <span className="skeleton-shimmer block h-4 w-44 mt-3" />
          <div className="mt-6 space-y-4">
            <span className="skeleton-shimmer block h-10 w-full" />
            <span className="skeleton-shimmer block h-10 w-full" />
            <span className="skeleton-shimmer block h-10 w-full" />
            <span className="skeleton-shimmer block h-10 w-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
