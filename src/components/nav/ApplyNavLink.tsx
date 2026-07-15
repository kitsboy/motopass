import type { NavLinkProps } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { PrefetchNavLink } from './PrefetchNavLink'
import { useLaunchGates } from '../../hooks/useLaunchGates'
import { useI18n } from '../../i18n/I18nContext'
import { navPillClass, navTabClass, navTileClass } from '../../lib/navRoutes'

type Props = Omit<NavLinkProps, 'to' | 'children'> & {
  layout?: 'pill' | 'tile' | 'tab'
}

function layoutClass(layout: 'pill' | 'tile' | 'tab', isActive: boolean): string {
  if (layout === 'tile') return navTileClass(isActive)
  if (layout === 'tab') return navTabClass(isActive)
  return navPillClass(isActive)
}

function mutedClass(layout: 'pill' | 'tile' | 'tab'): string {
  if (layout === 'tile') return 'nav-mobile-tile opacity-50 cursor-not-allowed'
  if (layout === 'tab') return 'nav-tab opacity-50 cursor-not-allowed'
  return 'nav-pill opacity-50 cursor-not-allowed'
}

export function ApplyNavLink({ layout = 'pill', className, ...props }: Props) {
  const { t } = useI18n()
  const { applicationsOpen } = useLaunchGates()

  if (!applicationsOpen) {
    return (
      <span className={mutedClass(layout)} title={t('apply.navPrelaunch')} aria-disabled="true">
        {t('nav.apply')}
      </span>
    )
  }

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
export function ApplyNavTab() {
  const { t } = useI18n()
  const { applicationsOpen } = useLaunchGates()

  if (!applicationsOpen) {
    return (
      <span className={mutedClass('tab')} title={t('apply.navPrelaunch')} aria-disabled="true">
        <ClipboardList size={17} strokeWidth={2} className="shrink-0" aria-hidden="true" />
        <span className="leading-none truncate max-w-full px-0.5 text-[10px] font-chrome">{t('nav.apply')}</span>
      </span>
    )
  }

  return (
    <PrefetchNavLink to="/apply" className={({ isActive }) => navTabClass(isActive)}>
      {({ isActive }) => (
        <>
          <ClipboardList size={17} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" aria-hidden="true" />
          <span className="leading-none truncate max-w-full px-0.5 text-[10px] font-chrome">{t('nav.apply')}</span>
        </>
      )}
    </PrefetchNavLink>
  )
}