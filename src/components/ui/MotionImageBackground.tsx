import { motion } from 'motion/react'

type Props = {
  image: string
  duration?: number
  className?: string
  opacity?: number | string
}

/** Ken Burns motion layer — defaults to design token hero opacity (35%) */
export function MotionImageBackground({
  image,
  duration = 28,
  className = '',
  opacity = 'var(--hero-opacity)',
}: Props) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      <motion.div
        className="absolute inset-[-10%] bg-cover bg-center"
        style={{ backgroundImage: `url('${image}')`, opacity }}
        animate={{ scale: [1, 1.12], x: ['0%', '-3%'], y: ['0%', '-2%'] }}
        transition={{ duration, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
    </div>
  )
}