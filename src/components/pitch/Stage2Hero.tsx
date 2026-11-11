import { Link } from 'react-router-dom'
import type { Program } from '../../types/program'
import { featuredRecord, heroFacts } from '../../lib/stage2HeroData'

/**
 * Stage 2 hero — the "travel document" direction.
 *
 * Asymmetric: the argument on the left, one real program record on the right,
 * set like a passport page. One stamp colour, hairline rules, no glass, no
 * glow, no photo, no rotating slogan. Every value is read from the corpus; a
 * missing field says "not on file" instead of guessing.
 *
 * Deliberately not built on the old token layer: this is a proposal, and the
 * rest of the site keeps its current styling until the direction is approved.
 */
export function Stage2Hero({ programs, loading }: { programs: Program[]; loading: boolean }) {
  const facts = heroFacts(programs)
  const visa = featuredRecord(programs)

  const count = facts.programs
  const primaryLabel = count ? `Compare ${count} programs` : 'Compare the programs'

  return (
    <section className="s2 s2-hero" id="pitch-hero" aria-labelledby="s2-hero-h1">
      <div className="s2-hero-grid">
        <div>
          <p className="s2-eyebrow">Verified program register</p>

          <h1 className="s2-h1" id="s2-hero-h1">
            Compare second-citizenship and residency programs, with data you can verify.
          </h1>

          <p className="s2-lede">
            Every record is read from an official government source, dated, and stamped to the
            Bitcoin blockchain. Compare the real terms side by side, model what a plan would cost
            you, and check the proof yourself before you pay anyone.
          </p>

          <div className="s2-actions">
            <Link to="/programs" className="s2-btn">
              {primaryLabel}
            </Link>
            <Link to="/proof" className="s2-link">
              How verification works
            </Link>
          </div>

          <p className="s2-facts">
            {loading || !count ? (
              'Reading the register…'
            ) : (
              <>
                {count} programs · checked {facts.checked ?? 'not on file'} ·{' '}
                {facts.sources ? `${facts.sources} official sources watched` : 'sources not on file'}
              </>
            )}
          </p>
        </div>

        <div>
          {loading ? (
            <div className="s2-visa" role="status" aria-busy="true">
              <p className="s2-eyebrow">Loading the record…</p>
            </div>
          ) : visa ? (
            <article className="s2-visa" aria-labelledby="s2-visa-name">
              <div className="s2-visa-head">
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    {visa.flag && (
                      <span className="s2-visa-flag" aria-hidden>
                        {visa.flag}
                      </span>
                    )}
                    <h2 className="s2-visa-name" id="s2-visa-name">
                      {visa.name}
                    </h2>
                  </div>
                </div>
                <div className="s2-visa-kind">{visa.kind}</div>
              </div>

              <div className="s2-visa-money">
                <span className="s2-visa-money-amt">{visa.typicalInvestment ?? 'not on file'}</span>
                <span className="s2-visa-money-note">typical investment</span>
              </div>

              <ul className="s2-visa-rows">
                <li>
                  <span className="k">Minimum</span>
                  <span className="v">{visa.minInvestment ?? 'not on file'}</span>
                </li>
                <li>
                  <span className="k">Timeline</span>
                  <span className="v">{visa.timeline ?? 'not on file'}</span>
                </li>
                <li>
                  <span className="k">Last checked</span>
                  <span className="v">{visa.checked ?? 'not on file'}</span>
                </li>
                <li>
                  <span className="k">Source</span>
                  <span className="v">
                    {visa.sourceUrl ? (
                      <a
                        href={visa.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
                      >
                        {visa.sourceName && visa.sourceName.length > 30
                          ? `${visa.sourceName.slice(0, 30).trimEnd()}…`
                          : visa.sourceName}
                      </a>
                    ) : (
                      'not on file'
                    )}
                  </span>
                </li>
              </ul>

              {visa.blockHeight && (
                <div className="s2-stamp" aria-label={`Stamped to Bitcoin block ${visa.blockHeight}`}>
                  <span className="s2-stamp-line1">Bitcoin block</span>
                  <span className="s2-stamp-line2">{visa.blockHeight.toLocaleString('en-US')}</span>
                </div>
              )}

              {visa.hash && (
                <p className="s2-machine">
                  sha256 {visa.hash.slice(0, 32)}…
                  {visa.blockHeight ? ` · block ${visa.blockHeight}` : ''} · ots
                </p>
              )}
            </article>
          ) : null}
        </div>
      </div>
    </section>
  )
}
