import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'

type HeroCtaLinkProps = {
  to: string
  variant?: 'primary' | 'secondary'
  children: ReactNode
  className?: string
}

/** Hero CTA with micro-animation on hover — disabled when prefers-reduced-motion. */
export function HeroCtaLink({
  to,
  variant = 'primary',
  children,
  className = '',
}: HeroCtaLinkProps) {
  const reduceMotion = useReducedMotion()
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary'

  if (reduceMotion) {
    return (
      <Link to={to} className={`${base} text-sm !py-3 ${className}`.trim()}>
        {children}
      </Link>
    )
  }

  return (
    <motion.div
      className="inline-flex"
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
    >
      <Link
        to={to}
        className={`${base} text-sm !py-3 hero-cta-shimmer ${className}`.trim()}
      >
        {children}
      </Link>
    </motion.div>
  )
}