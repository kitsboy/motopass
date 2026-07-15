import { useMemo, useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { retrievePrograms } from '../lib/paige/retrieve'
import { buildPaigeResponse } from '../lib/paige/respond'

type Msg = { role: 'user' | 'paige'; text: string }

export function PaigeChat({ compact = false }: { compact?: boolean }) {
  const { programs } = usePrograms()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'paige',
      text: 'Paige here — ask about Uruguay, UAE, Portugal, stacking, or Bitcoin residency pathways. I cite Satohash proofs when available.',
    },
  ])
  const [busy, setBusy] = useState(false)

  const flagshipCount = useMemo(() => programs.filter((p) => p.flagship_depth).length, [programs])

  const send = () => {
    const q = input.trim()
    if (!q || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setBusy(true)
    window.setTimeout(() => {
      const hits = retrievePrograms(programs, q)
      const text = buildPaigeResponse(q, hits)
      setMessages((m) => [...m, { role: 'paige', text }])
      setBusy(false)
    }, 280)
  }

  return (
    <div className={`card border-nostr-violet/25 bg-nostr-violet-soft/60 ${compact ? '!p-4' : ''}`}>
      <div className={`flex items-center gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
        <Bot size={compact ? 14 : 16} className="text-nostr-violet" />
        <span className={`font-semibold text-ink ${compact ? 'text-xs' : 'text-sm'}`}>Paige AI</span>
        <span className="text-[10px] font-mono uppercase tracking-wide text-mp-btc-text bg-btc-orange-soft px-2 py-0.5 rounded-chip">
          RAG · {flagshipCount} flagships
        </span>
      </div>
      <div className={`${compact ? 'max-h-32' : 'max-h-48'} overflow-y-auto space-y-2 mb-3 text-xs leading-relaxed`} aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-mp-md px-3 py-2 whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-mp-card text-ink ml-8' : 'bg-nostr-violet/10 text-ink-secondary mr-4'
            }`}
          >
            {m.text}
          </div>
        ))}
        {busy && <div className="text-ink-muted text-[11px] animate-pulse">Paige is retrieving…</div>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask Paige about your stack…"
          aria-label="Ask Paige"
          className="flex-1 rounded-mp-md border border-mp bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
        <button type="button" onClick={send} disabled={busy || !input.trim()} className="btn-primary !px-3" aria-label="Send">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}