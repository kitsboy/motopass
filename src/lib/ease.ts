export const EASE_OUT = [0.16, 1, 0.3, 1] as const
export const SPRING_MOUSE = { stiffness: 300, damping: 30 }

/** Modal panel — snappy enter, quicker settle on exit (ProgramModal + shared Modal) */
export const MODAL_SPRING_ENTER = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.88 }
export const MODAL_SPRING_EXIT = { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.82 }
export const MODAL_BACKDROP_FADE = { duration: 0.22, ease: EASE_OUT }