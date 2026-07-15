import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { useLaunchGates } from '../../hooks/useLaunchGates'

export function FooterApplyLink() {
  const { t } = useI18n()
  const { applicationsOpen } = useLaunchGates()

  if (!applicationsOpen) {
    return (
      <span className="text-ink-muted/50 cursor-not-allowed" title={t('apply.navPrelaunch')}>
        {t('nav.apply')}
      </span>
    )
  }

  return (
    <Link to="/apply" className="text-ink-muted hover:text-btc-orange transition-colors">
      {t('nav.apply')}
    </Link>
  )
}