import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Check, Copy, Download, Link2, QrCode, Share2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { ReceiptQr } from './ReceiptQr'
import {
  buildReceiptShareLink,
  buildVerificationReceipt,
  serializeVerificationReceipt,
  verificationReceiptDigest,
  verificationReceiptFilename,
  type VerificationReceipt,
  type VerificationReceiptInput,
  type VerificationReceiptState,
} from '../../lib/verificationReceipt'
import { recordVerification } from '../../lib/verificationHistory'

export type TrailState = VerificationReceiptState

const NEXT_STEP: Record<
  string,
  { title: string; body: string; href?: string; linkLabel?: string }
> = {
  bolt11: {
    title: 'Verify the payee key next',
    body: 'A checksum only proves the invoice is well formed. Recover the signing key and compare it with a payee identity you already trust before paying.',
    href: '#bolt11-signature',
    linkLabel: 'Check the signature',
  },
  'bolt11-signature': {
    title: 'Read the payment terms next',
    body: 'A valid payee key does not prove the amount, expiry or route. Read the invoice and compare the payment hash with the payer or merchant.',
    href: '#bolt11',
    linkLabel: 'Read invoice terms',
  },
  bolt12: {
    title: 'Treat an unsigned offer as a claim',
    body: 'Offers have no signature by design. Only a request or invoice signature is cryptographic evidence; confirm the issuer and amount out of band.',
  },
  'bolt12-response': {
    title: 'Check the invoice independently',
    body: 'The request and invoice signatures verify, but settlement is not checked. Compare the payment hash and amount with the node or merchant before paying.',
  },
  psbt: {
    title: 'Review outputs and fee before signing',
    body: 'A valid PSBT signature does not prove the transaction is safe or broadcast. Confirm every output, the fee and the network in your signing wallet.',
  },
  'silent-payments': {
    title: 'The receiver must scan',
    body: 'This is sender-side arithmetic for one outpoint. The receiver still has to scan the chain with the scan key; do not reuse an input key across wallets.',
  },
  nip05: {
    title: 'Compare the npub out of band',
    body: 'A NIP-05 match is domain trust and the domain can rotate it. Compare the npub through another channel before relying on the name.',
  },
  nip17: {
    title: 'A seal proves the sender, not delivery',
    body: 'The gift wrap and seal can verify while the message is still unread or unsent. Reply only after confirming the sender through another channel.',
  },
  'message-signature': {
    title: 'Check the message context',
    body: 'This proves the key behind the address signed these exact bytes. It does not prove funds or current ownership; confirm the relying party and replay rules.',
  },
  preimage: {
    title: 'A hash relation is not settlement',
    body: 'A matching preimage proves the hash relation. Confirm the payment hash belongs to the invoice or receipt you actually care about.',
  },
  'payment-evidence': {
    title: 'A coherent bundle is not a payment',
    body: 'Cross-links can agree while the underlying invoice, receipt or message is still about something else. Keep the source and the payer context out of band.',
  },
}

interface ToolIntakeDetail {
  toolId: string
  value: string
}

const pendingIntake = new Map<string, string>()

/** Queue a detected artifact for a tool card, even if that card mounts later. */
export function prefillTool(toolId: string, value: string): void {
  pendingIntake.set(toolId, value)
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent<ToolIntakeDetail>('motopass:tool-intake', { detail: { toolId, value } }))
    } catch {
      // The pending value is still picked up when the card mounts.
    }
  }
}

export function useToolIntake(toolId: string, onValue: (value: string) => void): void {
  const callback = useRef(onValue)
  useEffect(() => {
    callback.current = onValue
  }, [onValue])
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToolIntakeDetail>).detail
      if (detail?.toolId === toolId && typeof detail.value === 'string') {
        pendingIntake.delete(toolId)
        callback.current(detail.value)
      }
    }
    window.addEventListener('motopass:tool-intake', handler)
    const pending = pendingIntake.get(toolId)
    if (pending != null) {
      pendingIntake.delete(toolId)
      callback.current(pending)
    }
    return () => window.removeEventListener('motopass:tool-intake', handler)
  }, [toolId])
}


function StickyVerificationSummary({ tool, steps }: { tool?: string; steps: Array<{ label: string; state: TrailState }> }) {
  if (!steps.length) return null
  const passed = steps.filter(step => step.state === 'pass').length
  const unknown = steps.filter(step => step.state === 'unknown')
  const failed = steps.filter(step => step.state === 'fail').length
  const next = tool ? NEXT_STEP[tool] : undefined
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-30 rounded-mp-md border border-mp-border-strong bg-mp-canvas/95 px-2.5 py-2 shadow-xl backdrop-blur lg:hidden"
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-secondary">
        <span>{passed} checked</span>
        <span className={failed ? 'text-mp-wax' : unknown.length ? 'text-mp-ink-tertiary' : 'text-mp-proof'}>
          {unknown.length} unchecked{failed ? ` · ${failed} failed` : ''}
        </span>
      </p>
      <p className="mt-0.5 text-[10px] leading-snug text-mp-ink-tertiary">
        {failed
          ? 'Stop and recheck the failing step against the original source.'
          : unknown.length
            ? `Next: verify ${unknown.map(step => step.label).join(', ')}.`
            : next?.title ?? 'A pass covers only the checks shown above.'}
      </p>
    </div>
  )
}

function NextStepPanel({ tool, steps }: { tool: string; steps: Array<{ label: string; state: TrailState }> }) {
  const failed = steps.filter(step => step.state === 'fail')
  const unknown = steps.filter(step => step.state === 'unknown')
  const next = NEXT_STEP[tool]
  const tone = failed.length > 0 ? 'border-mp-wax/40 bg-mp-wax/5' : 'border-mp-border-subtle bg-mp-canvas/40'
  const title = failed.length > 0 ? 'Stop: a check failed' : next?.title ?? (unknown.length > 0 ? 'Bounded result' : 'Checks passed locally')
  const body =
    failed.length > 0
      ? 'Do not act on this artifact. Re-check the failing step against the original source, or use an independent verifier.'
      : `${next?.body ?? 'A local pass only covers the checks shown above.'}${
          unknown.length > 0 ? ` Still unchecked: ${unknown.map(step => step.label).join(', ')}.` : ''
        }`

  return (
    <div className={`mt-1.5 rounded-mp-md border px-2.5 py-2 ${tone}`} role="note">
      <p className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${failed.length ? 'text-mp-wax' : 'text-mp-ink-secondary'}`}>
        <ArrowRight size={11} aria-hidden="true" />
        {title}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-mp-ink-tertiary">{body}</p>
      {next?.href && failed.length === 0 && (
        <a
          href={next.href}
          className="mt-1 inline-flex min-h-8 items-center gap-1 font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-btc-text underline underline-offset-2"
        >
          {next.linkLabel ?? 'Next step'}
          <ArrowRight size={10} aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

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
  const receiptKey = receiptInput ? JSON.stringify(receiptInput) : ''

  useEffect(() => {
    if (!receiptKey) return
    try {
      recordVerification(JSON.parse(receiptKey) as VerificationReceiptInput)
    } catch {
      // History is a convenience; never let storage or parsing break a result.
    }
  }, [receiptKey])

  const tone: Record<TrailState, string> = {
    pass: 'border-mp-proof-border text-mp-proof',
    fail: 'border-mp-wax/40 text-mp-wax',
    unknown: 'border-mp-border-subtle text-mp-ink-tertiary',
  }
  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center gap-1" aria-label="Verification trail">
        {steps.map((step, index) => (
          <span
            key={`${step.label}-${index}`}
            className={`rounded-full border px-2 py-1 font-chrome text-[10px] uppercase tracking-wide ${tone[step.state]}`}
          >
            {step.label} · {step.state === 'pass' ? 'pass' : step.state === 'fail' ? 'fail' : 'unchecked'}
          </span>
        ))}
        {receiptInput && <VerificationReceiptButton receipt={receiptInput} />}
        {receiptInput && <ReceiptLinkButton receipt={receiptInput} />}
        {receiptInput && <ReceiptQrButton receipt={receiptInput} />}
        {receiptInput && <ProofCardButton receipt={receiptInput} />}
      </div>
      {tool && <NextStepPanel tool={tool} steps={steps} />}
      <StickyVerificationSummary tool={tool} steps={steps} />
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
      className="ml-1 inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border border-mp-border-subtle px-2 py-1 font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary hover:border-mp-btc/40 hover:text-mp-btc-text focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40"
    >
      {copied ? <Check size={10} aria-hidden="true" /> : <Copy size={10} aria-hidden="true" />}
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
            className={`rounded-full border px-2 py-0.5 text-[10px] tracking-wide ${network ? 'border-mp-wax/40 text-mp-wax' : 'border-mp-proof-border text-mp-proof'}`}
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
      <span className="text-[11px] uppercase tracking-wide text-mp-ink-tertiary">{label}</span>
      <span className="flex min-w-0 items-start gap-1 break-words text-[12px] text-mp-ink-secondary">
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
    <div className={`flex items-center justify-between gap-2 border-b border-mp-border-subtle/60 py-1.5 text-[11px] last:border-0 ${CHECK_TONE[tone]}`}>
      <span>{label}</span>
      <span className="font-semibold">{value == null ? 'not checked' : value ? 'pass' : 'fail'}</span>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function VerificationReceiptButton({ receipt }: { receipt: VerificationReceiptInput }) {
  const [saved, setSaved] = useState(false)
  const download = () => {
    const now = new Date()
    const payload = buildVerificationReceipt(receipt, now)
    const blob = new Blob([serializeVerificationReceipt(payload)], { type: 'application/json' })
    downloadBlob(blob, verificationReceiptFilename(receipt.tool, now))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }
  return (
    <button
      type="button"
      onClick={download}
      className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-full border border-mp-border-subtle px-2.5 py-1 font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary hover:border-mp-proof-border hover:text-mp-proof focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40"
    >
      <Download size={11} aria-hidden="true" />
      {saved ? 'Receipt downloaded' : 'Download verification receipt'}
    </button>
  )
}

export function ReceiptQrButton({ receipt }: { receipt: VerificationReceiptInput }) {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<ReturnType<typeof buildReceiptShareLink> | null>(null)

  const show = () => {
    setLink(buildReceiptShareLink(buildVerificationReceipt(receipt)))
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-full border border-mp-border-subtle px-2.5 py-1 font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary hover:border-mp-proof-border hover:text-mp-proof focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40"
      >
        <QrCode size={11} aria-hidden="true" /> Receipt QR
      </button>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Receipt handoff QR"
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-4 sm:items-center"
          >
            <div className="w-full max-w-md rounded-mp-lg border border-mp-border-strong bg-mp-canvas p-3 shadow-2xl">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">Handoff</p>
                  <h2 className="font-display text-lg font-semibold text-mp-ink">Scan this receipt</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-11 rounded-full border border-mp-border-subtle px-2 text-[10px] font-semibold text-mp-ink-secondary"
                >
                  Close
                </button>
              </div>
              <div className="mt-3 flex justify-center">
                {link?.ok ? (
                  <ReceiptQr url={link.url} label="MotoPass receipt link" />
                ) : (
                  <p className="text-[11px] text-mp-wax">{link?.error ?? 'This receipt cannot be shown as a QR code.'}</p>
                )}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
                The receipt stays in the URL fragment. Compare the SHA-256 fingerprint on the recipient’s screen with
                this one out of band. A QR scan opens the verifier; it does not prove payment.
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export function ReceiptLinkButton({ receipt }: { receipt: VerificationReceiptInput }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const timeout = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timeout.current) window.clearTimeout(timeout.current)
    },
    [],
  )

  const copy = async () => {
    const link = buildReceiptShareLink(buildVerificationReceipt(receipt))
    if (!link.ok) {
      setStatus('error')
    } else {
      try {
        await navigator.clipboard.writeText(link.url)
        setStatus('copied')
      } catch {
        setStatus('error')
      }
    }
    timeout.current = window.setTimeout(() => setStatus('idle'), 2400)
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-full border border-mp-border-subtle px-2.5 py-1 font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary hover:border-mp-proof-border hover:text-mp-proof focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40"
    >
      <Link2 size={11} aria-hidden="true" />
      {status === 'copied' ? 'Receipt link copied' : status === 'error' ? 'Link unavailable' : 'Copy receipt link'}
    </button>
  )
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = word
      if (lines.length === maxLines) break
    } else {
      current = next
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

async function drawProofCard(receipt: VerificationReceipt): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#0b0f14'
  ctx.fillRect(0, 0, 1200, 630)
  ctx.fillStyle = '#f7931a'
  ctx.fillRect(0, 0, 1200, 10)
  ctx.strokeStyle = '#27313d'
  ctx.lineWidth = 2
  ctx.strokeRect(28, 28, 1144, 574)

  ctx.fillStyle = '#f7931a'
  ctx.font = "600 19px ui-monospace, SFMono-Regular, Menlo, monospace"
  ctx.fillText('MOTOPASS / VERIFICATION CARD', 64, 62)
  ctx.fillStyle = '#8b98a8'
  ctx.font = "400 16px ui-monospace, SFMono-Regular, Menlo, monospace"
  ctx.fillText(receipt.tool, 64, 92)

  ctx.fillStyle = '#f5f2ec'
  ctx.font = "600 42px system-ui, -apple-system, Segoe UI, sans-serif"
  const titleLines = wrapCanvasText(ctx, receipt.title, 1040, 2)
  titleLines.forEach((line, index) => ctx.fillText(line, 64, 132 + index * 48))

  ctx.fillStyle = '#8b98a8'
  ctx.font = "400 16px ui-monospace, SFMono-Regular, Menlo, monospace"
  ctx.fillText(new Date(receipt.generatedAt).toISOString(), 64, 250)

  const stateColor = { pass: '#6ee7a8', fail: '#ff8a7a', unknown: '#8b98a8' } as const
  const stepY = 292
  receipt.steps.slice(0, 6).forEach((step, index) => {
    const x = 64 + (index % 3) * 350
    const y = stepY + Math.floor(index / 3) * 62
    ctx.fillStyle = stateColor[step.state]
    ctx.beginPath()
    ctx.arc(x + 5, y + 6, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f5f2ec'
    ctx.font = "600 17px system-ui, -apple-system, Segoe UI, sans-serif"
    ctx.fillText(step.label.slice(0, 28), x + 18, y - 3)
    ctx.fillStyle = stateColor[step.state]
    ctx.font = "400 13px ui-monospace, SFMono-Regular, Menlo, monospace"
    ctx.fillText(step.state === 'unknown' ? 'UNCHECKED' : step.state.toUpperCase(), x + 18, y + 18)
  })

  ctx.fillStyle = '#8b98a8'
  ctx.font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace"
  ctx.fillText('LIMITS', 64, 428)
  ctx.font = "400 16px system-ui, -apple-system, Segoe UI, sans-serif"
  ctx.fillStyle = '#c8d0da'
  const limitLines = receipt.limits
    .slice(0, 2)
    .flatMap(limit => wrapCanvasText(ctx, limit, 1040, 2))
    .slice(0, 4)
  limitLines.forEach((line, index) => ctx.fillText(line, 64, 450 + index * 22))

  ctx.fillStyle = '#f7931a'
  ctx.font = "600 15px ui-monospace, SFMono-Regular, Menlo, monospace"
  ctx.fillText('NOT PROOF OF PAYMENT', 64, 572)
  ctx.fillStyle = '#8b98a8'
  ctx.font = "400 14px ui-monospace, SFMono-Regular, Menlo, monospace"
  ctx.fillText(`SHA-256 ${verificationReceiptDigest(receipt).slice(0, 20)}…`, 64, 596)
  ctx.fillText(`motopass.giveabit.io/tools/receipt`, 720, 573)

  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'))
}

export function ProofCardButton({ receipt }: { receipt: VerificationReceiptInput }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'shared' | 'downloaded'>('idle')
  const timeout = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timeout.current) window.clearTimeout(timeout.current)
    },
    [],
  )

  const share = async () => {
    setStatus('working')
    const now = new Date()
    const payload = buildVerificationReceipt(receipt, now)
    const blob = await drawProofCard(payload)
    if (!blob) {
      setStatus('idle')
      return
    }
    const filename = verificationReceiptFilename(receipt.tool, now).replace(/\.json$/, '.png')
    const file = new File([blob], filename, { type: 'image/png' })
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: receipt.title,
          text: 'MotoPass verification card — not proof of payment.',
        })
        setStatus('shared')
      } else {
        downloadBlob(blob, filename)
        setStatus('downloaded')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('idle')
        return
      }
      downloadBlob(blob, filename)
      setStatus('downloaded')
    }
    timeout.current = window.setTimeout(() => setStatus('idle'), 2200)
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      disabled={status === 'working'}
      className="mt-2 inline-flex items-center gap-1 rounded-full border border-mp-border-subtle px-2 py-1 font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary hover:border-mp-btc/40 hover:text-mp-btc-text focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40 disabled:opacity-50"
    >
      {status === 'shared' ? <Check size={10} aria-hidden="true" /> : <Share2 size={10} aria-hidden="true" />}
      {status === 'working' ? 'Drawing…' : status === 'shared' ? 'Card shared' : status === 'downloaded' ? 'Card downloaded' : 'Share proof card'}
    </button>
  )
}
