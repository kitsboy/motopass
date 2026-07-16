/** Homepage hero tagline — exact brand copy, one line each, no periods. */
export function PitchHeroTagline() {
  return (
    <h1
      className="hero-elite-tagline font-display"
      aria-label="True citizenship Stamped in time Not bureaucracy"
    >
      <span className="hero-elite-tagline__line hero-elite-tagline__line--lead">
        True <span className="hero-elite-tagline__word">citizenship</span>
      </span>
      <span className="hero-elite-tagline__line hero-elite-tagline__line--stamp">
        Stamped in <span className="hero-elite-tagline__accent">time</span>
      </span>
      <span className="hero-elite-tagline__line hero-elite-tagline__line--finale">
        <span className="hero-elite-tagline__neg">Not</span>{' '}
        <span className="hero-elite-tagline__struck">bureaucracy</span>
      </span>
    </h1>
  )
}