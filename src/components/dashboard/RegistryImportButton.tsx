import { useRef, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { useToast } from '../ui/Toast'
import { loadStampedDocuments, saveStampedDocuments, type StampedDocument } from '../../lib/documentStamp'
import { parseDocumentRegistryBackup, mergeRegistryBackup } from '../../lib/documentRegistryExport'

export function RegistryImportButton({
  onImported,
}: {
  /** Called with the merged registry after a successful restore. */
  onImported: (docs: StampedDocument[]) => void
}) {
  const { t } = useI18n()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let text: string
    try {
      text = await file.text()
    } catch {
      toast(t('dashboard.registryRestoreError'), 'error')
      return
    }
    const result = parseDocumentRegistryBackup(text)
    if (!result.ok) {
      toast(`${t('dashboard.registryRestoreError')}: ${result.error}`, 'error')
      return
    }
    const merged = mergeRegistryBackup(loadStampedDocuments(), result.docs)
    saveStampedDocuments(merged)
    onImported(merged)
    toast(formatT(t, 'dashboard.registryRestored', { count: result.imported }), 'success')
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        onChange={e => void handleFile(e)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="chip text-xs inline-flex items-center gap-1"
      >
        <Upload size={12} aria-hidden />
        {t('dashboard.registryRestore')}
      </button>
    </>
  )
}
