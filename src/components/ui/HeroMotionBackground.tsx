import { motion } from 'motion/react'

/** Slow Ken Burns loop — sovereignty imagery at 35% opacity behind landing hero */
export function HeroMotionBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.div
        className="absolute inset-[-8%] bg-cover bg-center opacity-[0.35]"
        style={{ backgroundImage: "url('/images/sovereignty.jpg')" }}
        animate={{ scale: [1, 1.1], x: ['0%', '-2%'], y: ['0%', '-1.5%'] }}
        transition={{ duration: 28, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-gradient-hero-fade" />
      <div className="absolute inset-0 bg-gradient-radial-soft" />
    </div>
  )
}