import { Landmark, Scale, Newspaper } from 'lucide-react'
import type { CountryTrustEnvelope } from '../../types/countryTrust'

/**
 * SourceTierStrip — Official / Legal / Trusted Secondary badges.
 * Renders the REAL tier counts from the envelope. Hover a badge to see the
 * actual source names + official URLs behind that tier.
 */
export function SourceTierStrip({ sources }: { sources: CountryTrustEnvelope['sources'] }) {
  const tiers = [
    {
      key: 'official' as const,
      label: 'Official',
      count: sources.tiers.official,
      Icon: Landmark,
      cls: 'border-mp-proof/35 bg-mp-proof-soft text-mp-proof',
      desc: 'Government / regulator / official source',
    },
    {
      key: 'legal' as const,
      label: 'Legal',
      count: sources.tiers.legal,
      Icon: Scale,
      cls: 'border-mp-ochre/40 bg-mp-btc-soft text-mp-btc-text',
      desc: 'Legislation, law, decree, or legal text',
    },
    {
      key: 'secondary' as const,
      label: 'Trusted Secondary',
      count: sources.tiers.secondary,
      Icon: Newspaper,
      cls: 'border-mp-border-strong/50 bg-mp-section text-mp-ink-secondary',
      desc: 'Verified secondary reporting / research',
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
              : `${desc} — none on record yet`
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
          title="Primary official source URL"
        >
          official source ↗
        </a>
      )}
    </div>
  )
}
