import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

type Props = { label: string; value: string; mono?: boolean }

export function CopyField({ label, value, mono = true }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="card-muted">
      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-2">{label}</div>
      <div className="flex items-start gap-2">
        <code className={`flex-1 text-xs sm:text-sm text-ink break-all leading-relaxed ${mono ? 'font-mono' : ''}`}>
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 p-2 rounded-mp-md border border-mp hover:border-btc-orange/40 hover:bg-btc-orange-soft text-ink-muted hover:text-btc-orange transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={16} className="text-status-green" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  )
}