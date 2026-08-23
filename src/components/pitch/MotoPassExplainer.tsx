import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { Clapperboard, Play, Film } from 'lucide-react'

/**
 * MotoPassExplainer — the 60-second explainer film player on the front landing page.
 *
 * PLACEMENT + PERF (does not regress /trust work):
 *  - Lazy src injection: the <video> renders with NO src (only a poster). The MP4
 *    <source> is injected only when the player scrolls near the viewport, so the
 *    multi-MB file is never fetched for users who never reach the film. No LCP bloat.
 *  - preload="metadata" so the browser pulls just the movie header, not the stream.
 *  - Mobile-first: playsInline + tap-to-play native controls, responsive 16:9 frame.
 *
 * HONEST PENDING STATE:
 *  - Before the film lands (final.mp4 not yet at /video/motopass-explainer.mp4) the
 *    video fails to load -> we show an on-brand "film in production" panel instead of
 *    faking playback. Once the file is live, the player just works (no code change).
 */
const VIDEO_SRC = '/video/motopass-explainer.mp4'
const POSTER_SRC = '/video/motopass-explainer-poster.jpg'

export function MotoPassExplainer() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '20% 0px' })
  const reduceMotion = useReducedMotion()

  // Inject the real source only once the player is near the viewport.
  const [srcReady, setSrcReady] = useState(false)
  useEffect(() => {
    if (inView) setSrcReady(true)
  }, [inView])

  // Distinguish "film not built yet" (video error / missing file) from "ready".
  const [filmError, setFilmError] = useState(false)
  const [filmReady, setFilmReady] = useState(false)

  const poster = POSTER_SRC
  const posterAvailable = filmReady || !filmError

  return (
    <section
      ref={sectionRef}
      id="pitch-film"
      aria-labelledby="pitch-film-heading"
      className="relative w-full overflow-hidden py-14 sm:py-18 scroll-mt-header"
    >
      {/* ambient fuchsia jewel glow — on-brand identity */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 0%, rgba(232,121,249,0.16) 0%, rgba(232,121,249,0) 70%)',
        }}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <span className="club-eyebrow inline-flex items-center gap-2 text-fuchsia mb-3">
            <Film size={13} /> Watch · 60-second explainer
          </span>
          <h2
            id="pitch-film-heading"
            className="font-display text-2xl sm:text-4xl font-semibold text-ink tracking-tight"
          >
            MotoPass in sixty seconds
          </h2>
          <p className="mt-3 font-body text-body text-ink-secondary leading-relaxed max-w-2xl mx-auto">
            Truth you can verify, on Bitcoin — how MotoPass turns sovereign residency
            into a provable, self-custodied passport.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative overflow-hidden rounded-card border border-fuchsia/30 bg-mp-card shadow-2xl shadow-fuchsia/10 ring-1 ring-white/10"
        >
          <div className="relative aspect-video w-full bg-black/90">
            {/* The player — src injected lazily. No src until near viewport. */}
            <video
              className="absolute inset-0 h-full w-full object-contain"
              controls
              playsInline
              preload="metadata"
              poster={filmReady ? POSTER_SRC : undefined}
              title="MotoPass — 60 second explainer"
              aria-label="MotoPass 60 second explainer film"
              onError={() => setFilmError(true)}
              onLoadedData={() => setFilmReady(true)}
            >
              {srcReady && <source src={VIDEO_SRC} type="video/mp4" />}
              Your browser does not support HTML5 video.
            </video>

            {/* On-brand overlay chrome */}
            <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3">
              {!filmReady && !filmError && (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia/90 text-white shadow-lg shadow-fuchsia/40">
                  <Play size={26} className="ml-0.5 fill-current" />
                </div>
              )}
            </div>

            {/* HONEST pending state — film not built yet, no fake playback */}
            {filmError && (
              <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-mp-card/95 to-mp-card/90 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-fuchsia/40 bg-fuchsia-soft text-fuchsia">
                  <Clapperboard size={24} />
                </div>
                <div className="font-display text-lg sm:text-xl font-semibold text-ink">
                  The 60-second explainer is in production
                </div>
                <p className="max-w-md text-sm text-ink-muted leading-relaxed">
                  Our film is being cut right now. Check back shortly — it will play
                  right here. Meanwhile, explore the platform below.
                </p>
              </div>
            )}
          </div>

          {/* Player footer strip */}
          <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-mp-section/60 px-4 py-3">
            <span className="font-mono text-[11px] text-ink-muted">
              {posterAvailable ? 'MOTOPASS · 60s · 16:9' : 'MOTOPASS · EXPLAINER'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia/30 bg-fuchsia-soft/40 px-2.5 py-1 font-mono text-[10px] text-fuchsia-text">
              <Clapperboard size={11} /> Truth you can verify
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
