import type { ReactNode, ComponentPropsWithoutRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type GlassCardProps = ComponentPropsWithoutRef<'div'> & {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'interactive' | 'banner' | 'proof'
  animate?: boolean
  delay?: number
}

export function GlassCard({
  children,
  variant = 'default',
  animate = false,
  delay = 0,
  className = '',
  ...props
}: GlassCardProps) {
  const reduceMotion = useReducedMotion()
  const variantClass =
    variant === 'elevated'
      ? 'glass-card-elevated'
      : variant === 'interactive'
        ? 'glass-card-interactive'
        : variant === 'banner'
          ? 'glass-banner'
          : variant === 'proof'
            ? 'glass-card-proof'
            : 'glass-card'

  const cls = `${variantClass} ${className}`.trim()

  if (!animate || reduceMotion) {
    return (
      <div className={cls} {...props}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cls}
      {...props}
    >
      {children}
    </motion.div>
  )
}