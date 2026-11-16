import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ChevronRight, SlidersHorizontal, MapPin, BadgeCheck, Lock } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { PrefetchNavLink } from './PrefetchNavLink'
import { CountryFlag } from '../ui/CountryTitle'
import { MenuDiscover } from './menu/MenuDiscover'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import type { TranslationKey } from '../../i18n/translations'
import { useProgramsContext } from '../../context/ProgramsContext'

const SWIPE_CLOSE_THRESHOLD = 72
const MAX_SEARCH_MATCHES = 6

/**
 * SheetSearch — program search inside the More sheet. Own component so its
 * query state can be reset by remounting (key on `open`) instead of a
 * setState-in-effect (which the React Compiler lint forbids).
 */
function SheetSearch({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { programs } = useProgramsContext()
  const [q, setQ] = useState('')

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return []
    return programs
      .filter((p) => [p.name, p.region, p.category].some((v) => (v ?? '').toLowerCase().includes(needle)))
      .slice(0, MAX_SEARCH_MATCHES)
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
    <div className="relative">
      <Search
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
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
        className="w-full rounded-xl border border-mp/40 bg-card px-10 py-3 text-[13px] text-ink placeholder:text-ink-muted shadow-sm outline-none transition-colors focus:border-mp-fuchsia/70 focus:ring-2 focus:ring-mp-fuchsia/20"
      />
      {q.trim() && (
        <div className="mt-1 overflow-hidden rounded-xl border border-mp/40 bg-card shadow-mp-4">
          {matches.length === 0 ? (
            <p className="px-3 py-2.5 text-[12px] text-ink-muted">
              {formatT(t, 'menu.searchNoResults', { q: q.trim() })}
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => goProgram(p.id)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-card-muted active:bg-card-muted"
                  >
                    <CountryFlag name={p.name} emoji={p.flag} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink">{p.name}</span>
                      <span className="block truncate text-[10px] text-ink-muted">{p.region}</span>
                    </span>
                    <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-ink-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={goSearchAll}
            className="flex w-full items-center justify-center gap-1 border-t border-mp/40 px-3 py-2 text-[12px] font-medium text-mp-accent transition-colors hover:bg-card-muted"
          >
            {t('menu.searchAll')}
            <ChevronRight size={12} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

type NavTileDef = {
  to: string
  key: TranslationKey
  icon: typeof SlidersHorizontal
}

/** Overflow destinations, each with a glyph and a fuchsia identity chip. */
const NAV_TILES: readonly NavTileDef[] = [
  { to: '/simulator', key: 'nav.simulator', icon: SlidersHorizontal },
  { to: '/btcmap', key: 'nav.btcmap', icon: MapPin },
  { to: '/verify', key: 'nav.verify', icon: BadgeCheck },
  { to: '/vault', key: 'nav.vault', icon: Lock },
]

function GoToTiles({ onClose, reduced }: { onClose: () => void; reduced: boolean }) {
  const { t } = useI18n()
  return (
    <nav className="grid grid-cols-2 gap-2" aria-label={t('nav.moreNavigation')}>
      {NAV_TILES.map((n, i) => {
        const Icon = n.icon
        return (
          <motion.div
            key={n.to}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduced ? 0 : 0.04 + i * 0.025,
              type: reduced ? 'tween' : 'spring',
              stiffness: 380,
              damping: 30,
              mass: 0.7,
            }}
          >
            <PrefetchNavLink
              to={n.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl border bg-card-muted px-3.5 py-3 transition-all duration-fast active:scale-[0.98] ${
                  isActive
                    ? 'border-mp-fuchsia/70 text-mp-fuchsia-text'
                    : 'border-mp/50 text-ink hover:border-mp-fuchsia/60 hover:bg-card'
                }`
              }
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mp-fuchsia/10 text-mp-fuchsia-text transition-colors group-hover:bg-mp-fuchsia/15">
                <Icon size={17} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="text-[13px] font-medium leading-tight">{t(n.key)}</span>
            </PrefetchNavLink>
          </motion.div>
        )
      })}
    </nav>
  )
}

/**
 * MoreNavSheet — the single mobile navigation's overflow surface.
 *
 * One navigation system on mobile: the bottom tab bar (Programs · Compare ·
 * Proof · Apply · More) plus this sheet. The old header also carried a
 * hamburger drawer (MobileMenuSheet) that duplicated the tabs; this sheet now
 * absorbs its genuinely useful content so nothing is lost:
 *   • brand masthead       (identity anchor)
 *   • program search        (was MenuCommandCenter)
 *   • iconed overflow nav   (Simulator · BTC Map · Verify · Vault)
 *   • featured countries + trust summary (was MenuDiscover)
 * Settings stays in the header toolbar; language/currency stay in Settings.
 * Everything uses theme tokens on an OPAQUE surface; one fuchsia identity accent.
 */
export function MoreNavSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useFocusTrap(panelRef, open, onClose)

  const instant = { duration: 0 } as const
  const panelTransition = reduced
    ? instant
    : {
        default: { duration: 0.34, ease: [0.34, 1.56, 0.64, 1] as const },
        exit: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
      }

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label={t('nav.close')}
            className="absolute inset-0 sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? instant : { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.more')}
            className="absolute inset-x-0 bottom-0 mobile-nav-glass rounded-t-3xl safe-bottom more-nav-sheet-panel max-h-[88dvh] flex flex-col"
            initial={reduced ? { y: 0, opacity: 1 } : { y: '100%' }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { y: 0, opacity: 0 } : { y: '100%' }}
            transition={panelTransition}
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y >= SWIPE_CLOSE_THRESHOLD || info.velocity.y > 600) onClose()
            }}
            style={{ willChange: 'transform', transform: 'translateZ(0)', touchAction: 'pan-y' }}
          >
            <div
              className="mx-auto w-10 h-1 rounded-full mt-2 mb-1 touch-none shrink-0"
              style={{ background: 'rgba(232, 121, 249, 0.35)' }}
              aria-hidden="true"
              data-swipe-handle
            />

            {/* ── Brand masthead ─────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-1 shrink-0">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[17px] font-semibold tracking-tight text-ink">MOTOPASS</span>
                  <ChevronRight size={13} aria-hidden="true" className="text-mp-accent" />
                </div>
                <p className="truncate text-[11px] text-ink-muted mt-0.5">{t('tagline')}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="nav-btn nav-btn-icon !h-9 !w-9"
                aria-label={t('nav.close')}
              >
                <ChevronRight size={19} className="rotate-180" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-7 space-y-3">
              {/* ── Program search (remounts on open so the query resets) ── */}
              <SheetSearch key={open ? 'more-search-open' : 'more-search-closed'} onClose={onClose} />

              {/* ── Iconed overflow destinations ──────────────────────── */}
              <GoToTiles onClose={onClose} reduced={reduced} />

              {/* ── Featured countries + trust summary ─────────────────── */}
              <MenuDiscover onClose={onClose} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
