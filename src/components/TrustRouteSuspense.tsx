import { Suspense, type ReactNode } from 'react'

/**
 * TrustPage route fallback — a height-matched skeleton that mirrors the loaded
 * /trust page layout (PageHeader block, honesty banner, filter pills, 8-card
 * grid) so the async swap from this placeholder to the real TrustPage mount is
 * layout-stable and does NOT shift the viewport. This is what eliminated the
 * mobile CLS ~1.0 on /trust: the previous generic CardSkeleton(count=2) was far
 * shorter than the real page, so the whole page jumped down when TrustPage
 * mounted. Skeleton pulse is decorative and skipped under prefers-reduced-motion.
 */
export function TrustRouteSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading trust page" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* PageHeader block — mirrors real height: eyebrow+title+desc+actions, pb-8 mb-8.
          min-h-[166px] reserves the real text-column height on mobile (measured 166px
          @390, 194px @768, 183px @1280) so the route-fallback → live-page swap does not
          shift the top of the viewport on slow first loads. */}
      <div className="mb-8 flex flex-col gap-6 border-b border-mp-border-subtle/60 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl space-y-2 min-h-[166px]">
          <div className="h-3 w-16 rounded bg-mp-border-subtle/60 skeleton-pulse" aria-hidden="true" />
          <div className="h-7 w-44 rounded bg-mp-border-subtle/70 skeleton-pulse" aria-hidden="true" />
          <div className="h-3.5 w-64 rounded bg-mp-border-subtle/50 skeleton-pulse" aria-hidden="true" />
          <div className="h-3.5 w-48 rounded bg-mp-border-subtle/50 skeleton-pulse" aria-hidden="true" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-8 w-28 rounded-chip bg-mp-border-subtle/70 skeleton-pulse" aria-hidden="true" />
          <div className="h-8 w-20 rounded-chip bg-mp-border-subtle/70 skeleton-pulse" aria-hidden="true" />
        </div>
      </div>

      {/* honesty banner — real height 153px on mobile (text wraps to several lines) */}
      <div className="mb-6 h-[153px] w-full rounded-mp-lg border border-mp-border-subtle bg-mp-section/60 p-4" aria-hidden="true">
        <div className="h-3 w-20 rounded bg-mp-border-subtle/60 skeleton-pulse" aria-hidden="true" />
        <div className="mt-2 h-3 w-full rounded bg-mp-border-subtle/50 skeleton-pulse" aria-hidden="true" />
        <div className="mt-2 h-3 w-3/4 rounded bg-mp-border-subtle/50 skeleton-pulse" aria-hidden="true" />
      </div>

      {/* filter pills — real height ~74px (pills py-1.5 + mb-5) */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="h-8 w-20 rounded-chip bg-mp-border-subtle/70 skeleton-pulse" aria-hidden="true" />
        <div className="h-8 w-24 rounded-chip bg-mp-border-subtle/70 skeleton-pulse" aria-hidden="true" />
        <div className="h-8 w-24 rounded-chip bg-mp-border-subtle/70 skeleton-pulse" aria-hidden="true" />
      </div>

      {/* 8-card grid — same layout/min-height as the loaded first batch */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex min-h-[297px] w-full flex-col rounded-card border border-mp-border-subtle bg-mp-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-9 w-9 rounded bg-mp-border-subtle/70 skeleton-pulse" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-mp-border-subtle/70 skeleton-pulse" aria-hidden="true" />
                  <div className="h-2.5 w-10 rounded bg-mp-border-subtle/50 skeleton-pulse" aria-hidden="true" />
                </div>
              </div>
              <div className="h-9 w-9 rounded-full bg-mp-border-subtle/70 skeleton-pulse" aria-hidden="true" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="h-5 w-24 rounded-chip bg-mp-border-subtle/70 skeleton-pulse" aria-hidden="true" />
              <div className="h-3.5 w-16 rounded bg-mp-border-subtle/50 skeleton-pulse" aria-hidden="true" />
            </div>
            <div className="mt-3 h-12 w-full rounded-mp-lg bg-mp-border-subtle/60 skeleton-pulse" aria-hidden="true" />
            <div className="mt-auto flex items-center gap-2 border-t border-mp-border-subtle pt-3">
              <div className="h-3 w-20 rounded bg-mp-border-subtle/50 skeleton-pulse" aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Lazy-route Suspense wrapper for /trust with the height-matched fallback. */
export function TrustRouteSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<TrustRouteSkeleton />}>
      {children}
    </Suspense>
  )
}
