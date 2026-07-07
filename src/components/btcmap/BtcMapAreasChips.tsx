import { ExternalLink, Globe } from 'lucide-react'
import type { BtcMapArea } from '../../lib/btcmap'
import { btcMapCommunityUrl, btcMapCountryUrl } from '../../lib/btcmap'

export function BtcMapAreasChips({ areas }: { areas: BtcMapArea[] }) {
  if (!areas.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {areas.map((a) => {
        const href = a.type === 'country'
          ? btcMapCountryUrl(a.url_alias)
          : btcMapCommunityUrl(a.url_alias)
        return (
          <a
            key={a.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-chip border border-mp-border bg-mp-card-muted px-2.5 py-1 text-xs font-chrome text-ink-secondary hover:border-btc-orange/35 hover:text-accent transition-colors"
          >
            {a.icon ? (
              <img src={a.icon} alt="" className="w-4 h-4 rounded-sm object-cover" />
            ) : (
              <Globe size={12} className="text-btc-orange" />
            )}
            <span>{a.name}</span>
            <span className="text-[10px] uppercase tracking-wide text-ink-muted">{a.type}</span>
            <ExternalLink size={10} />
          </a>
        )
      })}
    </div>
  )
}