import { NavLink } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { useLaunchGates } from '../../hooks/useLaunchGates'

const footerLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-mp-btc-text font-medium border-b border-btc-orange/35 pb-0.5'
    : 'text-ink-muted hover:text-mp-btc-text transition-colors duration-fast border-b border-transparent hover:border-btc-orange/30 pb-0.5'

export function FooterApplyLink() {
  const { t } = useI18n()
  const { applicationsOpen } = useLaunchGates()

  if (!applicationsOpen) {
    return (
      <span className="text-ink-muted/50 cursor-not-allowed border-b border-transparent pb-0.5" title={t('apply.navPrelaunch')}>
        {t('nav.apply')}
      </span>
    )
  }

  return (
    <NavLink to="/apply" className={footerLinkClass}>
      {t('nav.apply')}
    </NavLink>
  )
}