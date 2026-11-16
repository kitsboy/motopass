import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { useIntel } from '../../../hooks/useIntel'
import { useProgramsContext } from '../../../context/ProgramsContext'
import { useI18n } from '../../../i18n/I18nContext'
import { CountryFlag } from '../../ui/CountryTitle'

const FEATURED_COUNT = 5

/**
 * MenuDiscover — featured countries + honest trust summary at the bottom of
 * the More sheet (single mobile nav). Function/content owned by Nova; look by
 * Mimi.
 *
 * Uses THEME tokens (card/ink/muted/accent) so it stays readable in both light
 * and dark — it now sits on the opaque More sheet, not the old dark drawer.
 * That means no hardcoded white-on-slight-white text (invisible on a light card).
 *
 * Featured = top-FEATURED_COUNT programs by sovereignty_score (real data,
 * null last) — a deterministic "best of" jump list, never a fake editorial pick.
 * Trust summary = the real fresh/watch/stale counts from the intel ledger.
 */
export function MenuDiscover({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { intel } = useIntel()
  const { programs } = useProgramsContext()

  const featured = useMemo(() => {
    return [...programs]
      .sort((a, b) => (b.sovereignty_score ?? -1) - (a.sovereignty_score ?? -1))
      .slice(0, FEATURED_COUNT)
  }, [programs])

  const sweep = intel?.sweep

  const goProgram = (id: number) => {
    navigate(`/programs?program=${id}`)
    onClose()
  }

  return (
    <div className="flex flex-col gap-2 pb-1 pt-2">
      {/* ── Featured countries ───────────────────────────────────────── */}
      {featured.length > 0 && (
        <section aria-label={t('menu.featured')}>
          <span className="block px-1 pb-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-ink-muted">
            {t('menu.featured')}
          </span>
          <div className="overflow-hidden rounded-2xl border border-mp/50 bg-card-muted">
            <ul>
              {featured.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => goProgram(p.id)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-card active:bg-card ${
                      i > 0 ? 'border-t border-mp/40' : ''
                    }`}
                  >
                    <CountryFlag name={p.name} emoji={p.flag} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink">{p.name}</span>
                      <span className="block truncate text-[10px] text-ink-muted">{p.region}</span>
                    </span>
                    {p.sovereignty_score != null && (
                      <span className="shrink-0 rounded-full border border-mp/40 bg-card px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                        {p.sovereignty_score}/10
                      </span>
                    )}
                    <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-ink-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Trust summary (honesty visual) ───────────────────────────── */}
      <section aria-label={t('nav.trust')}>
        <Link
          to="/trust"
          onClick={onClose}
          className="flex items-center justify-between gap-2 rounded-2xl border border-mp/50 bg-card-muted px-3 py-2.5 transition-colors hover:bg-card"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck size={15} aria-hidden="true" className="shrink-0 text-[#22c55e]" />
            {sweep ? (
              <span className="text-[12px] text-ink tabular-nums">
                <span className="font-semibold text-[#4ade80]">{sweep.fresh}</span>
                <span className="text-ink-muted"> {t('trust.fresh')} · </span>
                <span className="font-semibold text-[#fbbf24]">{sweep.watch}</span>
                <span className="text-ink-muted"> {t('trust.watch')} · </span>
                <span className="font-semibold text-[#f87171]">{sweep.stale}</span>
                <span className="text-ink-muted"> {t('trust.stale')}</span>
              </span>
            ) : (
              <span className="text-[12px] text-ink-muted">{t('menu.trustPending')}</span>
            )}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] font-medium text-mp-accent">
            {t('menu.viewTrust')}
            <ChevronRight size={12} aria-hidden="true" />
          </span>
        </Link>
      </section>
    </div>
  )
}
