import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { RouteErrorBoundary } from '../ErrorBoundary'

export function PageTransition() {
  const location = useLocation()
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <div key={location.pathname} className="page-transition">
        <RouteErrorBoundary>
          <Outlet />
        </RouteErrorBoundary>
      </div>
    )
  }

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={location.pathname}
        className="page-transition"
        initial={{ opacity: 0.92 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0.92 }}
        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        <RouteErrorBoundary>
          <Outlet />
        </RouteErrorBoundary>
      </motion.div>
    </AnimatePresence>
  )
}