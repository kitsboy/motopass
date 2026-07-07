import { Link } from 'react-router-dom'
import { ExternalLink, User, UserPlus } from 'lucide-react'
import { BlockHeight } from '../BlockHeight'
import { NostrConnect } from '../NostrConnect'
import { ThemeToggle } from '../ThemeToggle'
import { LanguageDropdown } from './LanguageDropdown'
import { useI18n } from '../../i18n/I18nContext'
import { useUser } from '../../context/UserContext'

export function HeaderToolbar() {
  const { t } = useI18n()
  const { isLoggedIn } = useUser()

  return (
    <div className="hidden lg:flex items-center gap-1 shrink-0" role="toolbar" aria-label="Site tools">
      <div className="flex items-center gap-1 pr-1 border-r border-mp/70">
        <BlockHeight />
        <NostrConnect />
      </div>
      <div className="flex items-center gap-1 px-1 border-r border-mp/70">
        <ThemeToggle compact />
        <LanguageDropdown />
      </div>
      <div className="flex items-center gap-1 pl-1">
        {isLoggedIn ? (
          <Link to="/dashboard" className="nav-btn nav-btn-primary">
            <User size={13} strokeWidth={2.25} aria-hidden="true" />
            <span>{t('nav.dashboard')}</span>
          </Link>
        ) : (
          <Link to="/register" className="nav-btn nav-btn-violet">
            <UserPlus size={13} strokeWidth={2.25} aria-hidden="true" />
            <span>{t('nav.register')}</span>
          </Link>
        )}
        <a
          href="/website/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn nav-btn-ghost"
        >
          <ExternalLink size={13} strokeWidth={2.25} aria-hidden="true" />
          <span>{t('nav.demo')}</span>
        </a>
      </div>
    </div>
  )
}