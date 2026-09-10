import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'

export type CardVariant = 'default' | 'elevated' | 'interactive' | 'banner' | 'proof'

const VARIANT: Record<CardVariant, string> = {
  default: 'glass-card',
  elevated: 'glass-card-elevated',
  interactive: 'glass-card-interactive',
  banner: 'glass-banner',
  proof: 'glass-card-proof',
}

export type CardProps = ComponentPropsWithoutRef<'div'> & {
  children: ReactNode
  variant?: CardVariant
  animate?: boolean
  delay?: number
}

export function Card({
  children,
  variant = 'default',
  animate = false,
  delay = 0,
  className = '',
  ...props
}: CardProps) {
  const reduceMotion = useReducedMotion()
  const cls = `${VARIANT[variant]} ${className}`.trim()

  if (!animate || reduceMotion) {
    return (
      <div className={cls} {...props}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ y: 14 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cls}
      /* same DOM props as the plain-div branch — motion's HTMLMotionProps is a superset;
         the cast only reconciles the two overloads' prop containers. */
      {...(props as HTMLMotionProps<'div'>)}
    >
      {children}
    </motion.div>
  )
}