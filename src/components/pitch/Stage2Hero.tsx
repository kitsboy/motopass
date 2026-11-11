import { Link } from 'react-router-dom'
import type { Program } from '../../types/program'
import { featuredRecord, heroFacts } from '../../lib/stage2HeroData'
import { LazyFlagSprite } from './LazyFlagSprite'

/**
 * Stage 2 hero — the "travel document" direction.
 *
 * Asymmetric: the argument on the left, one real program record on the right,
 * set like a passport page. One stamp colour, hairline rules, no glass, no
 * glow, no photo, no rotating slogan.
 *
 * The card shows only what the record can prove: which country, which route,
 * when the data was last checked, which official page it came from, and the
 * Bitcoin block that stamped the snapshot. Investment amounts and timelines are
 * absent because the cited Argentine pages publish neither — a number without a
 * source is the exact claim this site exists to avoid. Every omission says
 * "not on file" and links out to the source.
 */
export function Stage2Hero({ programs, loading }: { programs: Program[]; loading: boolean }) {
  const facts = heroFacts(programs)
  const visa = featuredRecord(programs)

  const count = facts.programs
  const primaryLabel = count ? `Compare ${count} programs` : 'Compare the programs'

  return (
    <section className="s2 s2-hero" id="pitch-hero" aria-labelledby="s2-hero-h1">
      <div className="s2-hero-grid">
        <div className="s2-hero-copy">
          <p className="s2-eyebrow">Verified program register</p>

          {/* The hyphen is non-breaking so the word never splits at a line end. */}
          <h1 className="s2-h1" id="s2-hero-h1">
            Compare second&#8209;citizenship and residency programs, with data you can verify.
          </h1>

          <p className="s2-lede">
            Each record is dated, linked to its source, and stamped to the Bitcoin blockchain.
            Compare terms side by side, model your costs, and check the proof yourself.
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
                <strong>{count} programs</strong> · checked {facts.checked ?? 'not on file'} ·{' '}
                <strong>{facts.officialSources ?? '—'} official sources</strong>
                {facts.allSources ? <span className="s2-facts-all"> of {facts.allSources} watched</span> : null}
              </>
            )}
          </p>
        </div>

        <div className="s2-hero-card">
          {loading ? (
            <div className="s2-visa" role="status" aria-busy="true">
              <p className="s2-eyebrow">Loading the record…</p>
            </div>
          ) : visa ? (
            <article className="s2-visa" aria-labelledby="s2-visa-country">
              <div className="s2-guilloche" aria-hidden />

              <div className="s2-visa-head">
                <div className="s2-visa-who">
                  <LazyFlagSprite
                    countryName={visa.country}
                    emojiFallback=""
                    size="md"
                    eager
                    decorative
                  />
                  <div className="s2-visa-who-text">
                    <h2 className="s2-visa-name" id="s2-visa-country">
                      {visa.country}
                    </h2>
                    <p className="s2-visa-program">{visa.program}</p>
                  </div>
                </div>
                <div className="s2-visa-kind">{visa.kind}</div>
              </div>

              {/* Fixed label/value grid. The stamp gets a reserved band between
                  the rows and the machine line: it overlaps the rule, never a
                  label or a value. */}
              <ul className="s2-visa-rows">
                <li>
                  <span className="k">Last checked</span>
                  <span className="v">{visa.checked ?? 'not on file'}</span>
                </li>
                <li>
                  <span className="k">Investment</span>
                  <span className="v s2-not-on-file">not on file</span>
                </li>
                <li>
                  <span className="k">Timeline</span>
                  <span className="v s2-not-on-file">not on file</span>
                </li>
                <li>
                  <span className="k">Official source</span>
                  <span className="v">
                    {visa.sourceUrl ? (
                      <a href={visa.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {visa.sourceName ?? visa.sourceHost}
                      </a>
                    ) : (
                      'not on file'
                    )}
                  </span>
                </li>
              </ul>

              <div className="s2-proof">
                {visa.blockHeight ? (
                  visa.proofUrl ? (
                    <a
                      className="s2-stamp"
                      href={visa.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="s2-stamp-line1">Stamped</span>
                      <span className="s2-stamp-line2">{visa.stamped ?? '—'}</span>
                      <span className="s2-stamp-line3">
                        block {visa.blockHeight.toLocaleString('en-US')} · verify
                      </span>
                    </a>
                  ) : (
                    <span className="s2-stamp">
                      <span className="s2-stamp-line1">Stamped</span>
                      <span className="s2-stamp-line2">{visa.stamped ?? '—'}</span>
                    </span>
                  )
                ) : null}

                <p className="s2-visa-note">
                  The cited immigration pages publish no investment figure or processing time for
                  this route, so none is shown.
                </p>

                {visa.hash ? (
                  <p className="s2-machine">
                    <span className="s2-machine-label">sha256</span>{' '}
                    <span className="s2-hash">{visa.hash}</span>
                    {visa.proofUrl ? (
                      <>
                        {' · '}
                        <a href={visa.proofUrl} target="_blank" rel="noopener noreferrer">
                          ots proof
                        </a>
                      </>
                    ) : (
                      <span> · ots</span>
                    )}
                  </p>
                ) : null}
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  )
}
