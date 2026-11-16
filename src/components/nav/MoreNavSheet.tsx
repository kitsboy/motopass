import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Stamp } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useI18n } from '../../i18n/I18nContext'
import { FOOTER_VERSION } from '../../lib/buildInfo'
import { MORE_ROUTES } from '../../lib/navRoutes'
import { formatT } from '../../i18n/format'
import { PrefetchNavLink } from './PrefetchNavLink'
import { CountryFlag } from '../ui/CountryTitle'
import { MenuDiscover } from './menu/MenuDiscover'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { navTileClass } from '../../lib/navRoutes'
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
    <div className="relative mb-2">
      <Search
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
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
        className="w-full rounded-xl border border-mp/50 bg-card/70 py-2.5 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-mp-accent/60"
      />
      {q.trim() && (
        <div className="mt-1 overflow-hidden rounded-xl border border-mp/50 bg-card/70">
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

/**
 * MoreNavSheet — the single mobile navigation's overflow surface.
 *
 * One navigation system on mobile: the bottom tab bar (Programs · Compare ·
 * Proof · Apply · More) plus this sheet. The old header also carried a
 * hamburger drawer (MobileMenuSheet) that duplicated the tabs; this sheet now
 * absorbs its genuinely useful content so nothing is lost:
 *   • program search        (was MenuCommandCenter)
 *   • primary overflow nav  (Simulator · BTC Map · Verify — MORE_ROUTES)
 *   • Vault quick action
 *   • featured countries + trust summary (was MenuDiscover)
 * Settings stays in the header toolbar; language/currency stay in Settings.
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
            className="absolute inset-x-0 bottom-0 mobile-nav-glass rounded-t-2xl safe-bottom more-nav-sheet-panel max-h-[86vh] flex flex-col"
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
              style={{ background: 'rgba(232, 121, 249, 0.3)' }}
              aria-hidden="true"
              data-swipe-handle
            />
            <div className="flex items-center justify-between px-4 py-2 border-b border-mp/50 shrink-0">
              <div className="min-w-0">
                <span className="font-chrome text-[10px] uppercase tracking-wider text-ink-muted">{t('nav.more')}</span>
                <span className="block font-mono text-[9px] text-ink-muted/80 truncate xs-only-build">{FOOTER_VERSION}</span>
              </div>
              <button type="button" onClick={onClose} className="nav-btn nav-btn-icon !h-8 !w-8" aria-label={t('nav.close')}>
                <ChevronRight size={18} className="rotate-180" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain p-3 pb-6">
              {/* ── Program search (remounts on open so the query resets) ── */}
              <SheetSearch key={open ? 'more-search-open' : 'more-search-closed'} onClose={onClose} />

              {/* ── Primary overflow nav ───────────────────────────────── */}
              <nav className="grid grid-cols-2 sm:grid-cols-3 gap-1.5" aria-label={t('nav.moreNavigation')}>
                {MORE_ROUTES.map((n, i) => (
                  <motion.div
                    key={n.to}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reduced ? 0 : 0.03 + i * 0.03,
                      type: reduced ? 'tween' : 'spring',
                      stiffness: 380,
                      damping: 30,
                      mass: 0.7,
                    }}
                  >
                    <PrefetchNavLink
                      to={n.to}
                      onClick={onClose}
                      className={({ isActive }) => navTileClass(isActive)}
                    >
                      {t(n.key)}
                    </PrefetchNavLink>
                  </motion.div>
                ))}
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduced ? 0 : 0.03 + MORE_ROUTES.length * 0.03, type: reduced ? 'tween' : 'spring', stiffness: 380, damping: 30, mass: 0.7 }}
                >
                  <Link to="/vault" onClick={onClose} className={navTileClass(false)}>
                    <Stamp size={15} aria-hidden className="shrink-0" />
                    {t('nav.vault')}
                  </Link>
                </motion.div>
              </nav>

              {/* ── Featured countries + trust summary ─────────────────── */}
              <MenuDiscover onClose={onClose} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
