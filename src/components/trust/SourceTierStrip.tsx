import { Landmark, Scale, Newspaper } from 'lucide-react'
import type { CountryTrustEnvelope } from '../../types/countryTrust'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

/**
 * SourceTierStrip — Official / Legal / Trusted Secondary badges.
 * Renders the REAL tier counts from the envelope. Hover a badge to see the
 * actual source names + official URLs behind that tier.
 */
export function SourceTierStrip({ sources }: { sources: CountryTrustEnvelope['sources'] }) {
  const { t } = useI18n()
  const tiers = [
    {
      key: 'official' as const,
      label: t('trust.tierOfficial'),
      count: sources.tiers.official,
      Icon: Landmark,
      cls: 'border-mp-proof/35 bg-mp-proof-soft text-mp-proof',
      desc: t('trust.tierOfficialDesc'),
    },
    {
      key: 'legal' as const,
      label: t('trust.tierLegal'),
      count: sources.tiers.legal,
      Icon: Scale,
      cls: 'border-mp-ochre/40 bg-mp-btc-soft text-mp-btc-text',
      desc: t('trust.tierLegalDesc'),
    },
    {
      key: 'secondary' as const,
      label: t('trust.tierSecondary'),
      count: sources.tiers.secondary,
      Icon: Newspaper,
      cls: 'border-mp-border-strong/50 bg-mp-section text-mp-ink-secondary',
      desc: t('trust.tierSecondaryDesc'),
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tiers.map(({ key, label, count, Icon, cls, desc }) => (
        <span
          key={key}
          className={`inline-flex items-center gap-1 rounded-chip border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] ${cls}`}
          title={
            count
              ? `${desc}. ${sources.list
                  .filter((s) => s.tier === key)
                  .map((s) => s.name)
                  .join(' · ')}`
              : formatT(t, 'trust.tierNone', { desc })
          }
        >
          <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
          <span>{label}</span>
          <span className="opacity-70">{count}</span>
        </span>
      ))}

      {sources.official_urls.length > 0 && (
        <a
          href={sources.official_urls[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[10px] text-mp-ink-tertiary underline decoration-dotted underline-offset-2 hover:text-mp-btc-text"
          title={t('trust.officialUrlTitle')}
        >
          {t('trust.officialSource')}
        </a>
      )}
    </div>
  )
}
