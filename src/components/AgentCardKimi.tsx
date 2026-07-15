import { MessageCircle } from 'lucide-react'
import { TiltCard } from './beui/TiltCard'
import { AnimatedBadge } from './beui/AnimatedBadge'
import { useI18n } from '../i18n/I18nContext'
import { isOfficeHoursOpen, KIMI_TIMEZONE } from '../lib/agentOfficeHours'
import { CopyField } from './ui/CopyField'

const KIMI_NPUB = 'npub1kimi…motopass'

export function AgentCardKimi() {
  const { t } = useI18n()
  const availableNow = isOfficeHoursOpen(KIMI_TIMEZONE)

  return (
    <TiltCard className="rounded-mp-xl">
      <div className="glass-card-elevated border-nostr-violet/25 bg-gradient-to-br from-transparent to-nostr-violet-soft/35 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          <div className="relative shrink-0">
            <img
              src="/images/kimi.jpg"
              alt="Kimi — MotoPass liaison agent"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-mp-lg object-cover border-2 border-nostr-violet/25 shadow-card"
            />
            <AnimatedBadge status="success" className="absolute -bottom-2 -right-2">
              Online
            </AnimatedBadge>
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="section-label mb-1">{t('agents.kimi.liaison')}</div>
            <h3 className="text-xl font-display font-semibold text-mp-ink">Kimi</h3>
            <p className="text-xs text-mp-ink-secondary mt-1">{t('agents.kimi.sub')}</p>
            {availableNow && (
              <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-chrome font-medium text-mp-proof bg-mp-proof/10 border border-mp-proof/30 rounded-full px-2.5 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-mp-proof animate-pulse" aria-hidden />
                {t('agents.availableNow')} · {t('agents.officeHours')} · {t('agents.kimi.timezone')}
              </span>
            )}
            <p className="text-sm text-mp-ink-secondary mt-3 leading-relaxed">{t('agents.kimi.body')}</p>
            <div className="mt-4 max-w-sm">
              <CopyField label={t('agents.copyNpub')} value={KIMI_NPUB} truncate />
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <a
                href="https://nostr.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm inline-flex items-center gap-2 border border-nostr-violet/30 text-nostr-violet hover:bg-nostr-violet-soft rounded-full px-4 py-1.5 transition-colors font-medium"
              >
                <MessageCircle size={14} /> {t('agents.kimi.message')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </TiltCard>
  )
}