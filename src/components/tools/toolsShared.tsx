import { useState, type ReactNode } from 'react'
import { Check, Copy, Download, Link2 } from 'lucide-react'
import { Card } from '../ui/Card'
import {
  buildVerificationReceipt,
  serializeVerificationReceipt,
  verificationReceiptFilename,
  type VerificationReceiptInput,
  type VerificationReceiptState,
} from '../../lib/verificationReceipt'

export type TrailState = VerificationReceiptState

export function VerificationTrail({
  steps,
  receipt,
  tool,
  title,
  limits,
  fields,
}: {
  steps: Array<{ label: string; state: TrailState }>
  receipt?: VerificationReceiptInput
  tool?: string
  title?: string
  limits?: string[]
  fields?: Record<string, string | number | boolean | null>
}) {
  const receiptInput =
    receipt ?? (tool && limits ? { tool, title: title ?? tool, steps, limits, fields } : undefined)
  const tone: Record<TrailState, string> = {
    pass: 'border-mp-proof-border text-mp-proof',
    fail: 'border-mp-wax/40 text-mp-wax',
    unknown: 'border-mp-border-subtle text-mp-ink-tertiary',
  }
  return (
    <div className="mb-2 flex flex-wrap gap-1" aria-label="Verification trail">
      {steps.map((step, index) => (
        <span
          key={`${step.label}-${index}`}
          className={`rounded-full border px-1.5 py-0.5 font-chrome text-[8px] uppercase tracking-wide ${tone[step.state]}`}
        >
          {step.label} · {step.state === 'pass' ? 'pass' : step.state === 'fail' ? 'fail' : 'unchecked'}
        </span>
      ))}
      {receiptInput && <VerificationReceiptButton receipt={receiptInput} />}
    </div>
  )
}

export function CopyButton({ value, label = 'Copy', text = 'Copy' }: { value: string; label?: string; text?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={`Copy ${label}`}
      className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-mp-border-subtle px-1.5 py-0.5 font-chrome text-[8px] font-semibold uppercase tracking-wide text-mp-ink-tertiary hover:border-mp-btc/40 hover:text-mp-btc-text focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40"
    >
      {copied ? <Check size={8} aria-hidden="true" /> : <Copy size={8} aria-hidden="true" />}
      {copied ? 'Copied' : text}
    </button>
  )
}

export function ToolLink({ toolId }: { toolId: string }) {
  return <CopyButton value={`${window.location.origin}/tools#${toolId}`} label="tool link" text="Link" />
}

export function ToolCard({
  icon,
  eyebrow,
  title,
  network = false,
  toolId,
  children,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  network?: boolean
  toolId?: string
  children: ReactNode
}) {
  return (
    <Card className="flex min-w-0 flex-col p-4 sm:p-5">
      <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
        {icon}
        {eyebrow}
        <span className="ml-auto flex items-center gap-1">
          {toolId && (
            <span className="inline-flex items-center gap-0.5 text-mp-ink-tertiary">
              <Link2 size={8} aria-hidden="true" />
              <ToolLink toolId={toolId} />
            </span>
          )}
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[8px] tracking-wide ${network ? 'border-mp-wax/40 text-mp-wax' : 'border-mp-proof-border text-mp-proof'}`}
          >
            {network ? 'NETWORK' : 'LOCAL'}
          </span>
        </span>
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-mp-ink">{title}</h2>
      <div className="mt-3 flex-1">{children}</div>
    </Card>
  )
}

export function FieldRow({ label, value, copy }: { label: string; value: ReactNode; copy?: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2 border-b border-mp-border-subtle/60 py-1 last:border-0">
      <span className="text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{label}</span>
      <span className="flex min-w-0 items-start gap-1 break-words text-[11px] text-mp-ink-secondary">
        <span className="min-w-0 break-words">{value}</span>
        {copy && <CopyButton value={copy} label={label} />}
      </span>
    </div>
  )
}

export function ClearButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="ml-2 text-[10px] font-semibold text-mp-ink-tertiary underline decoration-mp-border-subtle underline-offset-2 hover:text-mp-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40 disabled:opacity-40"
    >
      Clear
    </button>
  )
}

export const inputClass =
  'mt-1.5 w-full resize-y rounded-mp-md border border-mp-border bg-mp-canvas/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/30'

export const buttonClass =
  'inline-flex items-center gap-1.5 rounded-full border border-mp-btc/40 px-3 py-1.5 font-chrome text-[11px] font-semibold text-mp-btc-text transition-colors hover:bg-mp-btc/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40 disabled:cursor-not-allowed disabled:opacity-50'

const CHECK_TONE = {
  pass: 'text-mp-proof',
  fail: 'text-mp-wax',
  unknown: 'text-mp-ink-tertiary',
} as const

export function CheckLine({ label, value }: { label: string; value: boolean | null }) {
  const tone = value == null ? 'unknown' : value ? 'pass' : 'fail'
  return (
    <div className={`flex items-center justify-between gap-2 border-b border-mp-border-subtle/60 py-1 text-[10px] last:border-0 ${CHECK_TONE[tone]}`}>
      <span>{label}</span>
      <span className="font-semibold">{value == null ? 'not checked' : value ? 'pass' : 'fail'}</span>
    </div>
  )
}

export function VerificationReceiptButton({ receipt }: { receipt: VerificationReceiptInput }) {
  const [saved, setSaved] = useState(false)
  const download = () => {
    const now = new Date()
    const payload = buildVerificationReceipt(receipt, now)
    const blob = new Blob([serializeVerificationReceipt(payload)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = verificationReceiptFilename(receipt.tool, now)
    anchor.click()
    URL.revokeObjectURL(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }
  return (
    <button
      type="button"
      onClick={download}
      className="mt-2 inline-flex items-center gap-1 rounded-full border border-mp-border-subtle px-2 py-1 font-chrome text-[9px] font-semibold uppercase tracking-wide text-mp-ink-tertiary hover:border-mp-proof-border hover:text-mp-proof focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40"
    >
      <Download size={10} aria-hidden="true" />
      {saved ? 'Receipt downloaded' : 'Download verification receipt'}
    </button>
  )
}
