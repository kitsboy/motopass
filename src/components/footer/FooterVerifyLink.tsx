import { Link, useLocation } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'
import { BUILD_ID } from '../../lib/buildInfo'
import { pageVerifyHref } from '../../lib/pageVerify'

export function FooterVerifyLink() {
  const { pathname } = useLocation()
  const { t } = useI18n()

  if (pathname === '/verify') return null

  return (
    <Link
      to={pageVerifyHref(pathname, BUILD_ID)}
      className="inline-flex items-center gap-1 leading-none font-semibold text-mp-proof shrink-0 px-2 py-0.5 rounded-lg border border-mp-proof/35 bg-mp-proof/10 hover:bg-mp-proof/15 transition-colors duration-fast"
      title={t('footer.verifyThisPageHint')}
    >
      <ShieldCheck size={11} aria-hidden />
      {t('footer.verifyThisPage')}
    </Link>
  )
}