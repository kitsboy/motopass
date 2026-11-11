import type { NavLinkProps } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { PrefetchNavLink } from './PrefetchNavLink'
import { useI18n } from '../../i18n/I18nContext'
import { useLaunchGates } from '../../hooks/useLaunchGates'
import { navPillClass, navTabClass, navTileClass } from '../../lib/navRoutes'

type NavLayout = 'pill' | 'tile' | 'tab' | 'cta' | 'drawer-cta'

type Props = Omit<NavLinkProps, 'to' | 'children'> & {
  layout?: NavLayout
}

function layoutClass(layout: NavLayout, isActive: boolean): string {
  if (layout === 'cta') return `elite-nav-cta${isActive ? ' elite-nav-cta--active' : ''}`
  if (layout === 'drawer-cta') return `elite-drawer-cta${isActive ? ' elite-drawer-cta--active' : ''}`
  if (layout === 'tile') return navTileClass(isActive)
  if (layout === 'tab') return navTabClass(isActive)
  return navPillClass(isActive)
}

/**
 * Apply is the primary call to action whether or not applications are open —
 * the button stays a real, full-contrast link, and /apply itself says plainly
 * that nothing is being accepted yet. A greyed-out dead control told a visitor
 * "this product is broken" when it meant "this is the next step".
 */
export function ApplyNavLink({ layout = 'pill', className, ...props }: Props) {
  const { t } = useI18n()
  const { applicationsOpen } = useLaunchGates()
  // Stated, not implied: the label says the door is shut, and the link still
  // works so the page can explain when it opens.
  // Desktop bar has room: state the door is shut in the label itself.
  const label = applicationsOpen ? t('nav.apply') : `${t('nav.apply')} (closed)`

  return (
    <PrefetchNavLink
      {...props}
      to="/apply"
      className={
        typeof className === 'function'
          ? className
          : ({ isActive }) => `${layoutClass(layout, isActive)} ${typeof className === 'string' ? className : ''}`.trim()
      }
    >
      {label}
    </PrefetchNavLink>
  )
}

/** Apply tab for mobile bottom nav */
export function ApplyNavTab({ moreSheetOpen = false }: { moreSheetOpen?: boolean }) {
  const { t } = useI18n()
  const { applicationsOpen } = useLaunchGates()
  // The tab is ~78px wide: "Apply (closed)" clips to "Apply (cl…". Stack it.
  const label = applicationsOpen ? t('nav.apply') : `${t('nav.apply')} (closed)`

  return (
    <PrefetchNavLink
      to="/apply"
      className={({ isActive }) =>
        `${navTabClass(applicationsOpen && !moreSheetOpen && isActive)}${
          applicationsOpen ? ' apply-nav-tab-pulse' : ''
        }`.trim()
      }
    >
      {({ isActive }) => {
        const active = applicationsOpen && !moreSheetOpen && isActive
        return (
          <>
            <ClipboardList size={17} strokeWidth={active ? 2.5 : 2} className="shrink-0" aria-hidden="true" />
            <span className="leading-none max-w-full px-0.5 text-[10px] font-chrome">
              {applicationsOpen ? (
                t('nav.apply')
              ) : (
                <span className="apply-tab-closed">
                  <span>{t('nav.apply')}</span>
                  <span className="apply-tab-closed__state">closed</span>
                </span>
              )}
            </span>
          </>
        )
      }}
    </PrefetchNavLink>
  )
}