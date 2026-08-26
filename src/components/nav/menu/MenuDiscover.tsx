import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { useIntel } from '../../../hooks/useIntel'
import { useProgramsContext } from '../../../context/ProgramsContext'
import { useI18n } from '../../../i18n/I18nContext'

const FEATURED_COUNT = 5

/**
 * MenuDiscover — featured countries + honest trust summary at the bottom of
 * the mobile drawer. Function/content owned by Nova; look/motion by Mimi.
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
          <span className="block px-1 pb-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-white/40">
            {t('menu.featured')}
          </span>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <ul>
              {featured.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => goProgram(p.id)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06] active:bg-white/[0.08] ${
                      i > 0 ? 'border-t border-white/[0.05]' : ''
                    }`}
                  >
                    <span className="text-base leading-none" aria-hidden="true">
                      {p.flag ?? '🌐'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-white/90">{p.name}</span>
                      <span className="block truncate text-[10px] text-white/40">{p.region}</span>
                    </span>
                    {p.sovereignty_score != null && (
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-white/55">
                        {p.sovereignty_score}/10
                      </span>
                    )}
                    <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-white/30" />
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
          className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck size={15} aria-hidden="true" className="shrink-0 text-[#22c55e]" />
            {sweep ? (
              <span className="text-[12px] text-white/85 tabular-nums">
                <span className="font-semibold text-[#4ade80]">{sweep.fresh}</span>
                <span className="text-white/40"> {t('trust.fresh')} · </span>
                <span className="font-semibold text-[#fbbf24]">{sweep.watch}</span>
                <span className="text-white/40"> {t('trust.watch')} · </span>
                <span className="font-semibold text-[#f87171]">{sweep.stale}</span>
                <span className="text-white/40"> {t('trust.stale')}</span>
              </span>
            ) : (
              <span className="text-[12px] text-white/50">{t('menu.trustPending')}</span>
            )}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] font-medium text-[#ffc46e]">
            {t('menu.viewTrust')}
            <ChevronRight size={12} aria-hidden="true" />
          </span>
        </Link>
      </section>
    </div>
  )
}
