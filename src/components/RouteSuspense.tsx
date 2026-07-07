import { Suspense, type ReactNode } from 'react'
import { CardSkeleton } from './LoadingSkeleton'

/** DRY lazy-route fallback — batch 11 item 254 */
export function RouteSuspense({ children, count = 2 }: { children: ReactNode; count?: number }) {
  return (
    <Suspense fallback={<div className="p-6 max-w-7xl mx-auto"><CardSkeleton count={count} /></div>}>
      {children}
    </Suspense>
  )
}