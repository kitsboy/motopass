import { useCallback, useId, useRef, useState } from 'react'
import { CheckCircle2, FileText, Loader2, UploadCloud, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type UploadItem = {
  id: string
  name: string
  size: number
  type: string
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  hash?: string
  satohashUrl?: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  items,
  onItemsChange,
  onFileAdded,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  maxFiles = 8,
  title = 'Drop passport documents here',
  description = 'PDF, JPG, PNG — hashed & stamped via Satohash.io',
}: {
  items: UploadItem[]
  onItemsChange: (items: UploadItem[]) => void
  onFileAdded: (item: UploadItem) => Promise<void>
  accept?: string
  maxFiles?: number
  title?: string
  description?: string
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const addFiles = useCallback(async (files: File[]) => {
    const remaining = maxFiles - items.length
    if (remaining <= 0) return
    for (const file of files.slice(0, remaining)) {
      const item: UploadItem = {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        progress: 0,
        status: 'uploading',
      }
      onItemsChange([...items, item])
      await onFileAdded(item)
    }
  }, [items, maxFiles, onItemsChange, onFileAdded])

  const remove = (id: string) => onItemsChange(items.filter(i => i.id !== id))

  return (
    <div className="space-y-3">
      <input ref={inputRef} id={inputId} type="file" accept={accept} multiple className="sr-only"
        onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)) }}
        className={cn(
          'w-full rounded-mp-xl border-2 border-dashed p-8 text-center transition-all bg-card',
          dragging ? 'border-btc-orange bg-btc-orange-soft' : 'border-mp hover:border-btc-orange/50 hover:bg-section/50',
        )}
      >
        <UploadCloud className="mx-auto mb-3 text-btc-orange" size={32} />
        <div className="font-display font-semibold text-sm text-ink">{title}</div>
        <div className="text-xs text-ink-muted mt-1">{description}</div>
        <div className="text-[10px] text-ink-muted mt-2">Tap to browse or scan with camera</div>
      </button>

      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3 rounded-mp-lg border border-mp bg-card p-3 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-mp-md bg-section text-ink-muted">
              {item.status === 'uploading' ? <Loader2 size={18} className="animate-spin text-btc-orange" /> :
               item.status === 'success' ? <CheckCircle2 size={18} className="text-status-green" /> :
               <FileText size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-ink">{item.name}</div>
              <div className="text-[10px] text-ink-muted">{formatBytes(item.size)}</div>
              {item.hash && (
                <a href={item.satohashUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-btc-orange hover:underline font-mono truncate block">
                  Satohash → {item.hash.slice(0, 16)}…
                </a>
              )}
            </div>
            <button type="button" onClick={() => remove(item.id)} className="p-1.5 text-ink-muted hover:text-ink rounded-mp-sm hover:bg-section">
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}