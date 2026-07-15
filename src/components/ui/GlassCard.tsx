import type { ReactNode, ComponentPropsWithoutRef } from 'react'
import { Card, type CardVariant } from './Card'

type GlassCardProps = ComponentPropsWithoutRef<'div'> & {
  children: ReactNode
  variant?: CardVariant
  animate?: boolean
  delay?: number
}

/** @deprecated Prefer `Card` — kept for backward compatibility */
export function GlassCard(props: GlassCardProps) {
  return <Card {...props} />
}