import type { NavLinkProps } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { PrefetchNavLink } from './PrefetchNavLink'
import { useI18n } from '../../i18n/I18nContext'
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
      {t('nav.apply')}
    </PrefetchNavLink>
  )
}

/** Apply tab for mobile bottom nav */
export function ApplyNavTab({ moreSheetOpen = false }: { moreSheetOpen?: boolean }) {
  const { t } = useI18n()

  return (
    <PrefetchNavLink
      to="/apply"
      className={({ isActive }) => `${navTabClass(!moreSheetOpen && isActive)} apply-nav-tab-pulse`.trim()}
    >
      {({ isActive }) => {
        const active = !moreSheetOpen && isActive
        return (
          <>
            <ClipboardList size={17} strokeWidth={active ? 2.5 : 2} className="shrink-0" aria-hidden="true" />
            <span className="leading-none truncate max-w-full px-0.5 text-[10px] font-chrome">{t('nav.apply')}</span>
          </>
        )
      }}
    </PrefetchNavLink>
  )
}