/**
 * CompareChartSkeleton — shimmer placeholder for the /compare chart stack
 * (CompareSummaryStrip + CompareMatrix + CompareDiffSection).
 *
 * It is rendered inside a height-reserved wrapper (see FinanceComparePage) that
 * holds the stack's height from first paint, so the deferred data swap happens
 * IN-PLACE with no layout shift. The shimmer blocks here just make the reserved
 * area look like an intentional loading state rather than a blank gap — the
 * actual CLS guarantee comes from the wrapper's min-height, not these blocks.
 *
 * `programCount` mirrors how many programs are being compared (drives which
 * real blocks will appear: <2 programs = matrix only; >=2 adds summary + diff).
 */
export function CompareChartSkeleton({ programCount = 2 }: { programCount?: number }) {
  const matrixOnly = programCount < 2
  return (
    <div role="status" aria-busy="true" aria-label="Loading comparison" className="fc-compare-skeleton">
      {!matrixOnly && (
        <div aria-hidden className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:mb-6 min-h-[230px] lg:min-h-[80px]">
          {[0, 1, 2].map(i => (
            <div key={i} className="glass-card space-y-2 p-4">
              <span className="skeleton-shimmer block h-3 w-24" />
              <span className="skeleton-shimmer block h-5 w-28" />
              <span className="skeleton-shimmer block h-4 w-20" />
            </div>
          ))}
        </div>
      )}

      <div aria-hidden className="fc-compare-skeleton__matrix glass-card mb-5 space-y-3 p-4 lg:mb-6 min-h-[840px] lg:min-h-[800px]">
        <div className="flex gap-3">
          <span className="skeleton-shimmer block h-12 w-24 lg:w-40" />
          <span className="skeleton-shimmer block h-12 flex-1" />
          <span className="skeleton-shimmer block h-12 flex-1" />
        </div>
        {[0, 1, 2, 3].map(g => (
          <div key={g} className="space-y-2">
            <span className="skeleton-shimmer block h-4 w-28" />
            {[0, 1, 2].map(r => (
              <div key={r} className="flex items-center gap-3">
                <span className="skeleton-shimmer block h-6 w-32 lg:w-48" />
                <span className="skeleton-shimmer block h-6 flex-1" />
                <span className="skeleton-shimmer block h-6 flex-1" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {!matrixOnly && (
        <div aria-hidden className="fc-compare-skeleton__diff glass-card space-y-4 p-4 min-h-[1050px] lg:min-h-[600px]">
          <div className="space-y-2">
            <span className="skeleton-shimmer block h-6 w-40" />
            <span className="skeleton-shimmer block h-4 w-64" />
          </div>
          <div className="flex gap-3">
            <span className="skeleton-shimmer block h-8 w-24" />
            <span className="skeleton-shimmer block h-8 flex-1" />
            <span className="skeleton-shimmer block h-8 flex-1" />
          </div>
          {[0, 1, 2, 3, 4].map(r => (
            <div key={r} className="flex items-center gap-3">
              <span className="skeleton-shimmer block h-6 w-32 lg:w-48" />
              <span className="skeleton-shimmer block h-6 flex-1" />
              <span className="skeleton-shimmer block h-6 flex-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
