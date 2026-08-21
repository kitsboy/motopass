import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ExternalLink, ChevronDown } from 'lucide-react'
import { usePrograms } from '../../hooks/usePrograms'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { Card } from '../ui/Card'
import {
  buildAllAlerts,
  countAlertsByType,
  ALERT_TYPE_META,
  type PaigeAlert,
  type AlertType,
} from '../../lib/paige/alerts'

type FilterType = 'all' | AlertType

const FILTER_OPTIONS: FilterType[] = ['all', 'rule-change', 'proof-update', 'freshness-stale', 'new-pathway', 'pathway-closed']

function alertBg(alertType: AlertType): string {
  switch (alertType) {
    case 'rule-change': return 'border-status-amber/30 bg-status-amber/5'
    case 'proof-update': return 'border-mp-proof/30 bg-mp-proof/5'
    case 'freshness-stale': return 'border-status-red/30 bg-status-red/5'
    case 'new-pathway': return 'border-electric/30 bg-electric/5'
    case 'pathway-closed': return 'border-status-red/30 bg-status-red/5'
  }
}

function AlertRow({ alert }: { alert: PaigeAlert }) {
  const meta = ALERT_TYPE_META[alert.alertType]

  return (
    <li
      className={`rounded-mp-md border px-3 py-2.5 transition-colors hover:shadow-mp-1 ${alertBg(alert.alertType)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-sm" aria-hidden>{meta.icon}</span>
            <span className="font-chrome text-xs font-semibold text-ink">
              {alert.programFlag} {alert.programName}
            </span>
            <span className={`text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded-chip border border-current/20 ${meta.color}`}>
              {meta.label}
            </span>
            {alert.inPortfolio && (
              <span className="text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded-chip border border-mp-proof/30 bg-mp-proof/10 text-mp-proof">
                in portfolio
              </span>
            )}
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">{alert.summary}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-[10px] font-mono text-ink-muted">
              {alert.date}
            </span>
            {alert.blockHeight && (
              <span className="text-[10px] font-mono text-mp-proof">
                block #{alert.blockHeight}
              </span>
            )}
            <span className="text-[10px] font-mono text-ink-muted">
              {alert.source}
            </span>
          </div>
        </div>
        {alert.proofUrl && (
          <a
            href={alert.proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 chip !px-2 !py-1 text-mp-btc-text"
            title="Verify proof"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </li>
  )
}

export function AlertInbox() {
  const { t } = useI18n()
  const { programs } = usePrograms()
  const { portfolio } = usePortfolio()
  const [filter, setFilter] = useState<FilterType>('all')
  const [showAll, setShowAll] = useState(false)

  const allAlerts = useMemo(
    () => buildAllAlerts(programs, portfolio, showAll ? 50 : 15),
    [programs, portfolio, showAll],
  )

  const counts = useMemo(() => countAlertsByType(allAlerts), [allAlerts])

  const filtered = useMemo(() => {
    if (filter === 'all') return allAlerts
    return allAlerts.filter(a => a.alertType === filter)
  }, [allAlerts, filter])

  const totalAlerts = allAlerts.length
  const portfolioAlerts = allAlerts.filter(a => a.inPortfolio).length

  if (totalAlerts === 0) return null

  return (
    <Card variant="elevated" animate className="mb-8">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-ink flex items-center gap-2">
            <Bell size={16} className="text-btc-orange shrink-0" aria-hidden />
            {t('dashboard.alertsTitle')}
          </h2>
          <p className="font-body text-xs text-ink-muted mt-1 leading-relaxed">
            {formatT(t, 'dashboard.alertsSub', { count: totalAlerts })}
            {portfolioAlerts > 0 && (
              <> · {formatT(t, 'dashboard.alertsPortfolio', { count: portfolioAlerts })}</>
            )}
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="Alert filters">
        {FILTER_OPTIONS.map(f => {
          const isActive = filter === f
          const count = f === 'all' ? totalAlerts : counts[f as AlertType] ?? 0
          if (f !== 'all' && count === 0) return null
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(f)}
              className={`rounded-chip border px-2 py-0.5 text-[10px] font-chrome transition-all ${
                isActive
                  ? 'border-btc-orange/35 bg-btc-orange-soft/60 text-mp-btc-text shadow-mp-1'
                  : 'border-mp/70 text-ink-muted hover:border-btc-orange/25 hover:text-ink'
              }`}
            >
              {f === 'all' ? 'All' : ALERT_TYPE_META[f as AlertType].label}
              <span className="ml-1 font-mono opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <p className="text-xs text-ink-muted text-center py-6">
          {t('dashboard.alertsEmpty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map(alert => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </ul>
      )}

      {/* Show more / less */}
      {allAlerts.length >= 15 && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            className="text-xs font-chrome text-mp-btc-text hover:underline inline-flex items-center gap-1"
          >
            {showAll ? t('dashboard.alertsShowLess') : t('dashboard.alertsShowMore')}
            <ChevronDown size={12} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] font-mono text-ink-muted">
          {formatT(t, 'dashboard.alertsSource', { source: 'audit trail' })}
        </p>
        <Link to="/programs" className="text-[10px] font-chrome text-mp-btc-text hover:underline">
          {t('dashboard.alertsBrowse')} →
        </Link>
      </div>
    </Card>
  )
}
