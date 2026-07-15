import { Shield } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

type VerifyResultsExplainerProps = {
  /** pageKeys key for the explainer body */
  messageKey: 'verify.resultsExplainer' | 'vault.verify.resultsExplainerOk' | 'vault.verify.resultsExplainerFail'
}

export function VerifyResultsExplainer({ messageKey }: VerifyResultsExplainerProps) {
  const { t } = useI18n()

  return (
    <p className="flex gap-2 text-xs text-ink-muted leading-relaxed pt-1">
      <Shield size={14} className="text-btc-orange shrink-0 mt-0.5" aria-hidden />
      <span>{t(messageKey)}</span>
    </p>
  )
}