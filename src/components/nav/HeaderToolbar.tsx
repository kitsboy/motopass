import { SettingsMenu } from './SettingsMenu'
import { useI18n } from '../../i18n/I18nContext'

/**
 * HeaderToolbar — settings only.
 *
 * Stage 2 removed the always-on spot price from the header: the brief is that
 * the price appears where it is actually used (Programs, Simulator) and in the
 * footer. Theme, currency, language, Nostr sign-in and block height live in
 * one menu.
 */
export function HeaderToolbar({ collapsed: _collapsed = false }: { collapsed?: boolean }) {
  const { t } = useI18n()

  return (
    <div className="flex items-center gap-1.5 shrink-0" aria-label={t('nav.siteTools')}>
      <SettingsMenu />
    </div>
  )
}
