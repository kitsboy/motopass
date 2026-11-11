import { NavLink } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

const footerLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-mp-btc-text font-medium border-b border-btc-orange/35 pb-0.5'
    : 'text-ink-muted hover:text-mp-btc-text transition-colors duration-fast border-b border-transparent hover:border-btc-orange/30 pb-0.5'

/**
 * Apply, always a real link. It used to render as a 50%-opacity dead span while
 * applications were closed — an unreadable control where the primary action
 * should be. /apply says plainly that nothing is being accepted yet.
 */
export function FooterApplyLink() {
  const { t } = useI18n()

  return (
    <NavLink to="/apply" className={footerLinkClass}>
      {t('nav.apply')}
    </NavLink>
  )
}
