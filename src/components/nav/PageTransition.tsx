import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export function PageTransition() {
  const location = useLocation()
  const reduced = useReducedMotion()

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={location.pathname}
        className="page-transition"
        initial={reduced ? false : { opacity: 0.92 }}
        animate={{ opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0.92 }}
        transition={reduced ? { duration: 0 } : { duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}