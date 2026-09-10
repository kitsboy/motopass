import type { ReactNode, Ref } from 'react'
import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

type PitchRevealSectionProps = {
  id?: string
  className?: string
  stagger?: number
  children: ReactNode
  as?: 'section' | 'div'
}

/** Section reveal with IntersectionObserver stagger — once per viewport entry. */
export function PitchRevealSection({
  id,
  className = '',
  stagger = 0,
  children,
  as = 'section',
}: PitchRevealSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-8% 0px' })
  const reduceMotion = useReducedMotion()
  const Tag = motion[as]

  return (
    <Tag
      /* union of motion.section/motion.div collapses ref to HTMLDivElement; the
         runtime element is the real tag (HTMLElement for section) — safe at runtime. */
      ref={ref as Ref<HTMLDivElement>}
      id={id}
      className={className}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 28 }}
      animate={inView || reduceMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: reduceMotion ? 0 : 0.65,
        delay: reduceMotion ? 0 : stagger,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </Tag>
  )
}