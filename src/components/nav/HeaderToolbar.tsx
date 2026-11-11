import { BtcPriceTicker } from '../BtcPriceTicker'
import { SettingsMenu } from './SettingsMenu'
import { useI18n } from '../../i18n/I18nContext'

/**
 * HeaderToolbar — one price, one settings menu.
 *
 * The Bitcoin spot price is the only always-on utility number (a Bitcoiner
 * checks it constantly, and every fee on the site is modelled from it).
 * Theme, language, display currency, Nostr sign-in and block height all live
 * inside SettingsMenu so the header has a single utility control.
 */
export function HeaderToolbar({ collapsed: _collapsed = false }: { collapsed?: boolean }) {
  const { t } = useI18n()

  return (
    <div className="flex items-center gap-1.5 shrink-0" aria-label={t('nav.siteTools')}>
      <BtcPriceTicker variant="compact" />
      <SettingsMenu />
    </div>
  )
}
