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
        active ? 'text-black font-semibold' : 'text-white/80'
      }`}
      style={{
        borderColor: `${item.color}55`,
        backgroundColor: active ? item.color : `${item.color}18`,
      }}
    >
      {labelName(labelId, lang)}
    </Tag>
  )
}