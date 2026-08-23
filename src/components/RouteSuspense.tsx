import { Suspense, type ReactNode } from 'react'
import { CardSkeleton } from './LoadingSkeleton'

/** DRY lazy-route fallback — batch 11 item 254.
 *  minH reserves vertical space so the lazy page mounts IN-PLACE instead of
 *  growing the viewport from a ~300px card skeleton to the full page (CLS pop-in
 *  on mobile). Entry routes pass the height of their above-fold content. */
export function RouteSuspense({
  children,
  count = 2,
  minH,
  minHClass,
}: {
  children: ReactNode
  count?: number
  /** min-height (px) reserved while the route chunk loads. 0 = no reserve. */
  minH?: number
  /** Responsive Tailwind min-height class (e.g. `min-h-[4300px] lg:min-h-[3200px]`).
   *  Takes precedence over `minH` when both are set. */
  minHClass?: string
}) {
  const style = minH && !minHClass ? { minHeight: `${minH}px` } : undefined
  return (
    <Suspense
      fallback={
        <div className={`p-6 max-w-7xl mx-auto ${minHClass ?? ''}`} style={style}>
          <CardSkeleton count={count} />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
