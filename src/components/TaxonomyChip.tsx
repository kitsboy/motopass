import { TAXONOMY, labelName } from '../data/taxonomy'
import { useI18n } from '../i18n/I18nContext'

export function TaxonomyChip({ labelId, active, onClick }: { labelId: string; active?: boolean; onClick?: () => void }) {
  const { lang } = useI18n()
  const item = TAXONOMY.find(t => t.id === labelId)
  if (!item) return null

  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
        active ? 'text-ink font-semibold shadow-sm' : 'text-ink-secondary'
      }`}
      style={{
        borderColor: active ? item.color : `${item.color}44`,
        backgroundColor: active ? `${item.color}22` : `${item.color}12`,
      }}
    >
      {labelName(labelId, lang)}
    </Tag>
  )
}