const ELITE_TAGLINE = [
  'True citizenship.',
  'Stamped in time.',
  'Not bureaucracy.',
] as const

/** Homepage hero tagline — exact brand copy, one line each. */
export function PitchHeroTagline() {
  return (
    <h1
      className="hero-elite-tagline font-display"
      aria-label={ELITE_TAGLINE.join(' ')}
    >
      {ELITE_TAGLINE.map((line, i) => (
        <span
          key={line}
          className={`hero-elite-tagline__line${i === ELITE_TAGLINE.length - 1 ? ' hero-elite-tagline__line--finale' : ''}`}
        >
          {line}
        </span>
      ))}
    </h1>
  )
}