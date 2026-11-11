import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Card } from './ui/Card'
import { useI18n } from '../i18n/I18nContext'

/**
 * Liaison desk.
 *
 * This card used to be a persona card ("Kimi", photo, “Online”, office hours,
 * npub) which read as a live human service the site does not run — and worse,
 * as an AI agent with office hours on a passport product. It now says plainly
 * which part is automated and which part is a person.
 */
export function AgentCardKimi() {
  const { t } = useI18n()

  return (
    <Card variant="elevated" className="h-full border-nostr-violet/20">
      <div className="section-label mb-2">{t('liaison.eyebrow')}</div>
      <h3 className="text-xl font-display font-semibold text-ink">{t('liaison.title')}</h3>
      <p className="text-sm text-ink-secondary mt-2 leading-relaxed">{t('liaison.sub')}</p>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="rounded-mp-md border border-mp/60 bg-card-muted/30 px-3 py-2.5">
          <dt className="font-chrome text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            {t('liaison.automatedLabel')}
          </dt>
          <dd className="mt-1 text-ink-secondary leading-relaxed">{t('liaison.automatedBody')}</dd>
        </div>
        <div className="rounded-mp-md border border-mp/60 bg-card-muted/30 px-3 py-2.5">
          <dt className="font-chrome text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            {t('liaison.humanLabel')}
          </dt>
          <dd className="mt-1 text-ink-secondary leading-relaxed">{t('liaison.humanBody')}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-ink-muted leading-relaxed">{t('liaison.status')}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/apply" className="btn-secondary text-sm inline-flex items-center gap-2">
          <MessageCircle size={14} aria-hidden /> {t('liaison.cta')}
        </Link>
      </div>
    </Card>
  )
}
