import { Suspense, lazy } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { PROOF_TABS, type ProofTab } from '../lib/navRoutes'
import { claimCoverage } from '../lib/claims'

const TrustPage = lazy(() => import('./TrustPage').then(m => ({ default: m.TrustPage })))
const SourceMonitorPage = lazy(() => import('./SourceMonitorPage').then(m => ({ default: m.SourceMonitorPage })))
const VaultPage = lazy(() => import('./VaultPage').then(m => ({ default: m.VaultPage })))
const ToolsPage = lazy(() => import('./ToolsPage').then(m => ({ default: m.ToolsPage })))

/**
 * Proof — one destination, four surfaces.
 *
 * Trust cards, source monitoring, the timestamp vault and the local Bitcoin
 * tools were four separate top-level items answering the same visitor question
 * ("can I check this myself?"). They are now tabs behind one address. Every
 * tab keeps its original route as a deep link, so old bookmarks still work.
 */
function isProofTab(value: string | null): value is ProofTab {
  return value === 'trust' || value === 'sources' || value === 'vault' || value === 'tools'
}

export function ProofPage() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: ProofTab = isProofTab(raw) ? raw : 'trust'
  const coverage = claimCoverage()

  return (
    <div className="page-container px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <header className="mb-5">
        <span className="club-eyebrow block mb-2">{t('proof.eyebrow')}</span>
        <h1 className="font-display text-h2 font-semibold text-ink">{t('proof.title')}</h1>
        <p className="mt-2 max-w-2xl font-body text-body text-ink-secondary leading-relaxed">
          {t('proof.sub')}
        </p>
      </header>

      {/*
        The page every "Unverified" label points at. It states the count, not a
        promise: how many figures have an official page behind them, and what we
        do with the rest.
      */}
      <section
        id="unverified"
        className="mb-7 scroll-mt-header rounded-xl border border-mp/60 bg-mp-section/40 px-4 py-4 sm:px-5"
      >
        <h2 className="font-display text-lg font-semibold text-ink">
          What &ldquo;unverified&rdquo; means here
        </h2>
        <p className="mt-2 max-w-3xl font-body text-sm text-ink-secondary leading-relaxed">
          A figure is <strong className="text-ink">traced</strong> when we can point at the official
          page that states it, quote the words, and give the day we read them. Today{' '}
          <strong className="text-ink">
            {coverage.figures_traced} of {coverage.figures_shown} figures
          </strong>{' '}
          on this site are traced. Everything else is labelled unverified and stays out of our
          averages, our rankings and our comparisons.
        </p>
        <p className="mt-2 max-w-3xl font-body text-sm text-ink-secondary leading-relaxed">
          We show unverified figures because a labelled estimate is more use to you than a blank
          page — and we would rather you know exactly which numbers are ours and which are the
          government&rsquo;s.
        </p>
      </section>

      <nav aria-label={t('proof.tabsAria')} className="mb-6 border-b border-mp/60">
        <ul className="flex gap-1 overflow-x-auto">
          {PROOF_TABS.map(({ id, key, icon: Icon }) => {
            const active = id === tab
            return (
              <li key={id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setParams(id === 'trust' ? {} : { tab: id }, { replace: true })}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-chrome transition-colors ${
                    active
                      ? 'border-btc-orange text-ink font-semibold'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  <Icon size={15} aria-hidden />
                  {t(key)}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <Suspense
        fallback={
          <div role="status" aria-busy="true" className="py-16 text-center text-sm text-ink-muted">
            {t('proof.loading')}
          </div>
        }
      >
        {tab === 'trust' && <TrustPage />}
        {tab === 'sources' && <SourceMonitorPage />}
        {tab === 'vault' && <VaultPage />}
        {tab === 'tools' && <ToolsPage />}
      </Suspense>

      {/*
        Corrections: what we changed and when. Plain text, newest first. Each
        line is a commit that can be read in the repository — nothing here is a
        promise about future accuracy.
      */}
      <section id="corrections" className="mt-10 scroll-mt-header border-t border-mp/60 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">Corrections</h2>
        <p className="mt-1 max-w-3xl font-body text-sm text-ink-muted">
          Changes we made to the record, newest first. Each one is a commit in the repository.
        </p>
        <ol className="mt-4 space-y-3">
          <li className="max-w-3xl font-body text-sm text-ink-secondary leading-relaxed">
            <time dateTime="2026-11-12" className="font-mono text-xs text-ink-muted">
              12 Nov 2026
            </time>
            <br />
            Corrected the Bitcoin block height on every timestamp. Each record now carries the
            height its stamp actually sits in, read from the chain when the site is built, instead
            of a number written into the code.
          </li>
          <li className="max-w-3xl font-body text-sm text-ink-secondary leading-relaxed">
            <time dateTime="2026-11-12" className="font-mono text-xs text-ink-muted">
              12 Nov 2026
            </time>
            <br />
            Removed 20 pathway proofs that do not appear in Satohash&rsquo;s public stamp list.
            They no longer carry a height, a link or a badge.
          </li>
          <li className="max-w-3xl font-body text-sm text-ink-secondary leading-relaxed">
            <time dateTime="2026-11-12" className="font-mono text-xs text-ink-muted">
              12 Nov 2026
            </time>
            <br />
            Removed Argentina&rsquo;s minimum of $50,000, typical of $100,000 and 3&ndash;8 month
            timeline. No official page states them. The statute figure the decree does state
            (ARS 1,500,000) stays, with its quote.
          </li>
          <li className="max-w-3xl font-body text-sm text-ink-secondary leading-relaxed">
            <time dateTime="2026-11-12" className="font-mono text-xs text-ink-muted">
              12 Nov 2026
            </time>
            <br />
            Replaced five hosts that no longer resolve. For Cayman Islands, Vanuatu and
            Brazil&rsquo;s foreign ministry the replacement is the government&rsquo;s own page.
            For St Lucia and Grenada the replacement host is a programme site we have not
            confirmed is government-run, so both are labelled a replacement host, not an
            official one. Grenada&rsquo;s figures carry that label until a government page links
            to the site.
          </li>
        </ol>
      </section>
    </div>
  )
}
