import { Link } from 'react-router-dom'
import type { TranslationKey } from '../../i18n/translations'
import { useI18n } from '../../i18n/I18nContext'

export type RoadmapLink = { key: TranslationKey; to: string }

type PitchRoadmapTimelineProps = {
  links: readonly RoadmapLink[]
  nextLabel: string
}

/** Responsive roadmap timeline with connector lines between milestones. */
export function PitchRoadmapTimeline({ links, nextLabel }: PitchRoadmapTimelineProps) {
  const { t } = useI18n()

  return (
    <div className="pitch-roadmap">
      <div className="text-2xl font-display text-gradient-orange mb-5">{nextLabel}</div>
      <ol className="pitch-roadmap-list relative space-y-0">
        {links.map(({ key, to }, i) => (
          <li key={key} className="pitch-roadmap-item relative flex gap-4 pb-5 last:pb-0">
            <div className="pitch-roadmap-rail flex flex-col items-center shrink-0" aria-hidden>
              <span className="pitch-roadmap-node" />
              {i < links.length - 1 && <span className="pitch-roadmap-connector" />}
            </div>
            <Link
              to={to}
              className="group flex-1 min-w-0 rounded-xl border border-transparent px-2 py-1 -ml-1 transition-colors hover:border-btc-orange/20 hover:bg-btc-orange/5"
            >
              <span className="flex gap-2 text-sm text-ink-secondary group-hover:text-mp-btc-text transition-colors">
                <span className="text-mp-btc-text shrink-0">→</span>
                <span>{t(key)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}