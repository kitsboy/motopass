import { Suspense, lazy } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { PROOF_TABS, type ProofTab } from '../lib/navRoutes'

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

  return (
    <div className="page-container px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <header className="mb-5">
        <span className="club-eyebrow block mb-2">{t('proof.eyebrow')}</span>
        <h1 className="font-display text-h2 font-semibold text-ink">{t('proof.title')}</h1>
        <p className="mt-2 max-w-2xl font-body text-body text-ink-secondary leading-relaxed">
          {t('proof.sub')}
        </p>
      </header>

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
    </div>
  )
}
