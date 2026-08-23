import { useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { Clapperboard, Play, Film } from 'lucide-react'

/**
 * VaultEducationPlayer — the OpenTimestamps walkthrough film player
 * in the Vault education section of /trust/vault.
 *
 * PLACEMENT + PERF (does not regress /trust work):
 *  - Lazy src injection: the <video> renders with NO src until the player is
 *    near the viewport, so the multi-MB MP4 is never fetched for users who
 *    never reach the education slot. No load/LCP bloat.
 *  - preload="metadata" so the browser pulls just the movie header.
 *  - Mobile-first: playsInline + tap-to-play native controls, responsive 16:9.
 *
 * HONEST PENDING STATE:
 *  - Until Mimi's final.mp4 lands at /video/motopass-ots-walkthrough.mp4 the
 *    video errors -> we show an on-brand "film in production" panel instead of
 *    faking playback. Once the file is live the player just works (no code change).
 */
const VIDEO_SRC = '/video/motopass-ots-walkthrough.mp4'

export function VaultEducationPlayer() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapRef, { once: true, margin: '20% 0px' })

  // Inject the real source only once the player is near the viewport
  // (inView latches true forever due to `once`, so the src stays).
  const srcReady = inView

  // Distinguish "film not built yet" (video error / missing file) from "ready".
  const [filmError, setFilmError] = useState(false)
  const [filmReady, setFilmReady] = useState(false)

  return (
    <div
      ref={wrapRef}
      className="relative mt-4 overflow-hidden rounded-mp-md border border-fuchsia/30 bg-mp-card shadow-lg shadow-fuchsia/10 ring-1 ring-white/10"
    >
      <div className="relative aspect-video w-full bg-black/90">
        {/* The player — src injected lazily on the video element itself
            (setting the src attr is more reliable than swapping a <source> child,
            which can spuriously fire onError and latch the pending panel). */}
        <video
          className="absolute inset-0 h-full w-full object-contain"
          controls
          playsInline
          preload="metadata"
          title="OpenTimestamps walkthrough — how proofs work"
          aria-label="OpenTimestamps walkthrough film — how proofs work"
          src={srcReady ? VIDEO_SRC : undefined}
          onError={() => {
            // Only show the honest pending panel if the source was actually
            // requested; a transient/early error before in-view should not
            // permanently latch the fallback. Retry once on next in-view.
            if (srcReady) setFilmError(true)
          }}
          onLoadedData={() => {
            setFilmError(false)
            setFilmReady(true)
          }}
        >
          Your browser does not support HTML5 video.
        </video>

        {/* On-brand overlay chrome — clear tap-to-play cue until film starts */}
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
              The OpenTimestamps walkthrough is in production
            </div>
            <p className="max-w-md text-sm text-ink-muted leading-relaxed">
              Our walkthrough on hashing, OpenTimestamps receipts and confirming
              anchors on Bitcoin is being cut right now. Check back shortly — it
              will play right here.
            </p>
          </div>
        )}
      </div>

      {/* Player footer strip */}
      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-mp-section/60 px-4 py-3">
        <span className="font-mono text-[11px] text-ink-muted">
          OPENTIMESTAMPS · 60s · 16:9
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia/30 bg-fuchsia-soft/40 px-2.5 py-1 font-mono text-[10px] text-fuchsia-text">
          <Film size={11} /> Proof you can verify
        </span>
      </div>
    </div>
  )
}
