import type { NavLinkProps } from 'react-router-dom'
import { PrefetchNavLink } from './PrefetchNavLink'
import { useLaunchGates } from '../../hooks/useLaunchGates'
import { useI18n } from '../../i18n/I18nContext'

type Props = Omit<NavLinkProps, 'to' | 'children'> & {
  layout?: 'pill' | 'tile'
}

export function ApplyNavLink({ layout = 'pill', className, ...props }: Props) {
  const { t } = useI18n()
  const { applicationsOpen } = useLaunchGates()

  const muted =
    layout === 'pill'
      ? 'nav-pill opacity-50 cursor-not-allowed'
      : 'nav-mobile-tile opacity-50 cursor-not-allowed'

  if (!applicationsOpen) {
    return (
      <span className={muted} title={t('apply.navPrelaunch')} aria-disabled="true">
        {t('nav.apply')}
      </span>
    )
  }

  const activeClass =
    layout === 'pill'
      ? (isActive: boolean) => (isActive ? 'nav-pill nav-pill-active' : 'nav-pill')
      : (isActive: boolean) => `nav-mobile-tile ${isActive ? 'nav-mobile-tile-active' : ''}`

  return (
    <PrefetchNavLink
      {...props}
      to="/apply"
      className={typeof className === 'function' ? className : ({ isActive }) => activeClass(isActive)}
    >
      {t('nav.apply')}
    </PrefetchNavLink>
  )
}