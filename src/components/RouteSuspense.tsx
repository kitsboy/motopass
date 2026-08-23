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
}: {
  children: ReactNode
  count?: number
  /** min-height (px) reserved while the route chunk loads. 0 = no reserve. */
  minH?: number
}) {
  const style = minH ? { minHeight: `${minH}px` } : undefined
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-7xl mx-auto" style={style}>
          <CardSkeleton count={count} />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
