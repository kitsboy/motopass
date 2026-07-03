import { MotionImageBackground } from './MotionImageBackground'

/** Landing hero — sovereignty imagery at 35% opacity + gradient overlays */
export function HeroMotionBackground() {
  return (
    <>
      <MotionImageBackground image="/images/sovereignty.jpg" />
      <MotionImageBackground image="/images/hero.jpg" duration={34} opacity="0.22" className="mix-blend-multiply dark:mix-blend-soft-light" />
      <div className="absolute inset-0 bg-gradient-hero-fade pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-gradient-radial-soft pointer-events-none" aria-hidden />
    </>
  )
}