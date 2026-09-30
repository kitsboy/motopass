import { GitCompareArrows } from 'lucide-react'
import { PageHeader } from '../ui/PageHeader'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

export function CompareHero({ slotCount }: { slotCount: number }) {
  const { t } = useI18n()

  return (
    <PageHeader
      eyebrow={t('compare.eyebrow')}
      title={t('compare.title')}
      subtitle={t('compare.subtitle')}
      actions={
        <div className="flex flex-wrap items-center gap-2" aria-label={formatT(t, 'compare.programsLabel', { count: slotCount })}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-mp-border-subtle/70 px-3 py-1.5 text-xs font-mono text-mp-ink-secondary">
            <GitCompareArrows size={13} aria-hidden />
            {formatT(t, 'compare.programsLabel', { count: slotCount })}
          </span>
        </div>
      }
    />
  )
}
