import { useId, useRef, useState } from 'react'
import { Loader2, UploadCloud } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useI18n } from '../../i18n/I18nContext'

export function VaultOtsDropZone({
  busy,
  selectedFile,
  onFile,
}: {
  busy: boolean
  selectedFile: string | null
  onFile: (file: File) => void
}) {
  const { t } = useI18n()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function pick(file: File | undefined) {
    if (file && !busy) onFile(file)
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".ots,.txt,application/octet-stream,text/plain"
        className="sr-only"
        disabled={busy}
        onChange={e => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <button
        type="button"
        aria-controls={inputId}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          if (!busy) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          pick(e.dataTransfer.files[0])
        }}
        className={cn(
          'w-full rounded-mp-lg border-2 border-dashed p-5 text-center transition-all bg-card-muted/30',
          dragging ? 'border-btc-orange bg-btc-orange-soft/60' : 'border-mp/70 hover:border-btc-orange/40 hover:bg-section/40',
          busy && 'opacity-60 cursor-not-allowed',
        )}
      >
        {busy ? (
          <Loader2 size={24} className="mx-auto mb-2 text-btc-orange animate-spin" aria-hidden />
        ) : (
          <UploadCloud size={24} className="mx-auto mb-2 text-btc-orange" aria-hidden />
        )}
        <div className="font-chrome text-xs font-semibold text-ink">{t('vault.otsDropTitle')}</div>
        <div className="text-[10px] text-ink-muted mt-1">{t('vault.otsDropDescription')}</div>
      </button>
      {selectedFile && (
        <p className="text-xs font-mono text-ink-muted truncate opacity-80">{selectedFile}</p>
      )}
    </div>
  )
}