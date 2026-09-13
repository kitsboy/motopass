import { Link } from 'react-router-dom'
import { CheckCircle2, Rocket, Lock, ExternalLink, ArrowRight } from 'lucide-react'
import { SeoHead } from '../components/SeoHead'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { useI18n } from '../i18n/I18nContext'

/** Real confirmation route — reached after an application submit or donation. */
export function ThankYouPage() {
  const { t } = useI18n()

  return (
    <div className="page-container px-4 sm:px-6 py-8 pb-24 md:pb-16 max-w-3xl mx-auto">
      <SeoHead
        title={t('thankYou.title')}
        description={t('thankYou.metaDescription')}
        url="https://motopass.giveabit.io/thank-you"
      />
      <PageHeader eyebrow="APPLICATION" title={t('thankYou.title')} subtitle={t('thankYou.sub')} />

      <Card variant="proof" animate className="space-y-4 text-center py-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mp-proof/15 border border-mp-proof/30">
          <CheckCircle2 size={30} className="text-mp-proof" aria-hidden />
        </div>
        <h2 className="font-display text-xl font-semibold text-mp-proof">{t('thankYou.done')}</h2>
        <p className="font-body text-sm text-ink-muted max-w-md mx-auto">{t('thankYou.doneSub')}</p>

        <div className="rounded-mp-md border border-mp/60 bg-card-muted/50 p-4 text-left space-y-2 mx-auto max-w-md">
          <p className="font-chrome text-[10px] uppercase tracking-wider text-mp-proof">
            {t('thankYou.nextHeading')}
          </p>
          <ul className="space-y-2 font-body text-xs text-ink-secondary">
            <li className="flex items-start gap-2">
              <Rocket size={13} className="text-btc-orange shrink-0 mt-0.5" aria-hidden />
              <span>{t('thankYou.stepFee')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock size={13} className="text-mp-proof shrink-0 mt-0.5" aria-hidden />
              <span>{t('thankYou.stepVault')}</span>
            </li>
            <li className="flex items-start gap-2">
              <ExternalLink size={13} className="text-mp-btc-text shrink-0 mt-0.5" aria-hidden />
              <span>{t('thankYou.stepStamp')}</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link to="/apply" className="btn-primary inline-flex items-center justify-center gap-2">
            {t('thankYou.backToApply')} <ArrowRight size={14} aria-hidden />
          </Link>
          <Link to="/vault" className="btn-secondary inline-flex items-center justify-center gap-2">
            {t('thankYou.openVault')}
          </Link>
          <Link to="/agents" className="btn-secondary inline-flex items-center justify-center gap-2">
            {t('thankYou.meetAgents')}
          </Link>
        </div>

        <p className="font-chrome text-[10px] text-ink-muted pt-2">
          {t('thankYou.privacyNote')}
        </p>
      </Card>
    </div>
  )
}