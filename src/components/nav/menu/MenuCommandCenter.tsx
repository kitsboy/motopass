import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Stamp, BadgeCheck, Send, ChevronRight } from 'lucide-react'
import { useBtcPrice } from '../../../context/BtcPriceContext'
import { useBlockHeight } from '../../../context/BlockHeightContext'
import { useIntel } from '../../../hooks/useIntel'
import { useProgramsContext } from '../../../context/ProgramsContext'
import { useI18n } from '../../../i18n/I18nContext'
import { formatT } from '../../../i18n/format'
import { formatUsdCompact } from '../../../lib/btcPrice'

const MAX_MATCHES = 6

/**
 * MenuCommandCenter — the "command center" content block at the top of the
 * mobile drawer. Function/content owned by Nova; look/motion owned by Mimi.
 *
 * All numbers are REAL live data from the app's existing sources:
 *  - BTC spot  -> BtcPriceContext (mempool.space / pitch-anchor fallback)
 *  - Block tip -> BlockHeightContext (mempool.space /api/blocks/tip/height)
 *  - Freshness -> Intel manifest /data/intel.json (the honest freshness ledger)
 * Nothing is fabricated; unavailable values render "…" / "—", never a fake number.
 */
export function MenuCommandCenter({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { rate, loading: priceLoading } = useBtcPrice()
  const { height, error: blockError } = useBlockHeight()
  const { intel } = useIntel()
  const { programs } = useProgramsContext()
  const [q, setQ] = useState('')

  const sweep = intel?.sweep

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return []
    return programs
      .filter((p) =>
        [p.name, p.region, p.category].some((v) => (v ?? '').toLowerCase().includes(needle)),
      )
      .slice(0, MAX_MATCHES)
  }, [programs, q])

  const goProgram = (id: number) => {
    navigate(`/programs?program=${id}`)
    onClose()
  }

  const goSearchAll = () => {
    const needle = q.trim()
    navigate(needle ? `/programs?q=${encodeURIComponent(needle)}` : '/programs')
    onClose()
  }

  return (
    <div className="flex flex-col gap-2 pb-1">
      {/* ── Live stats strip ─────────────────────────────────────────── */}
      <section aria-label={t('menu.live')}>
        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <div className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2">
            <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40">
              {t('menu.liveBTC')}
            </span>
            <span className="font-mono text-[13px] font-semibold text-[#ffc46e] tabular-nums">
              {priceLoading ? '…' : formatUsdCompact(rate)}
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2">
            <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40">
              {t('menu.liveBlock')}
            </span>
            <span className="font-mono text-[13px] font-semibold text-white/90 tabular-nums">
              {height != null ? `#${height.toLocaleString()}` : blockError ? '—' : '…'}
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2">
            <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40">
              {t('menu.liveFresh')}
            </span>
            <span className="flex items-center gap-1 font-mono text-[13px] font-semibold text-white/90 tabular-nums">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              {sweep ? sweep.fresh : '…'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <section aria-label={t('programs.search')}>
        <div className="relative">
          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') goSearchAll()
            }}
            placeholder={t('programs.search')}
            aria-label={t('programs.search')}
            autoComplete="off"
            enterKeyHint="search"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-[13px] text-white/90 placeholder:text-white/30 outline-none transition-colors focus:border-[#ff9500]/50"
          />
        </div>

        {q.trim() && (
          <div className="mt-1 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            {matches.length === 0 ? (
              <p className="px-3 py-2.5 text-[12px] text-white/50">
                {formatT(t, 'menu.searchNoResults', { q: q.trim() })}
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto">
                {matches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => goProgram(p.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/[0.06] active:bg-white/[0.08]"
                    >
                      <span className="text-base leading-none" aria-hidden="true">
                        {p.flag ?? '🌐'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-white/90">{p.name}</span>
                        <span className="block truncate text-[10px] text-white/40">{p.region}</span>
                      </span>
                      <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-white/30" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={goSearchAll}
              className="flex w-full items-center justify-center gap-1 border-t border-white/[0.06] px-3 py-2 text-[12px] font-medium text-[#ffc46e] transition-colors hover:bg-white/[0.05]"
            >
              {t('menu.searchAll')}
              <ChevronRight size={12} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <section aria-label={t('menu.quickActions')}>
        <span className="block px-1 pb-1.5 pt-1 text-[9px] font-mono uppercase tracking-[0.18em] text-white/40">
          {t('menu.quickActions')}
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <Link
            to="/vault"
            onClick={onClose}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-[11px] font-medium text-white/80 transition-transform active:scale-[0.97]"
          >
            <Stamp size={18} aria-hidden="true" className="text-[#f0a0e0]" />
            {t('menu.stamp')}
          </Link>
          <Link
            to="/verify"
            onClick={onClose}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-[11px] font-medium text-white/80 transition-transform active:scale-[0.97]"
          >
            <BadgeCheck size={18} aria-hidden="true" className="text-[#22c55e]" />
            {t('menu.verify')}
          </Link>
          <Link
            to="/apply"
            onClick={onClose}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-[#ff9500]/40 bg-[#ff9500]/10 py-3 text-[11px] font-semibold text-[#ffc46e] transition-transform active:scale-[0.97]"
          >
            <Send size={18} aria-hidden="true" className="text-[#ff9500]" />
            {t('menu.apply')}
          </Link>
        </div>
      </section>
    </div>
  )
}
