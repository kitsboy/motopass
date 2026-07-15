import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Send, ArrowRight, FileSearch } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { retrievePrograms } from '../lib/paige/retrieve'
import type { PaigeHit } from '../lib/paige/retrieve'
import { buildPaigeBlocks, PAIGE_DISCLAIMER } from '../lib/paige/respond'
import { toCinematicProgram } from '../lib/programAdapter'
import { ProgramModal } from './programs/ProgramModal'
import type { Program as CinematicProgram } from './programs/types'
import { useI18n } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/translations'

type UserMsg = { role: 'user'; text: string }
type PaigeTextMsg = { role: 'paige'; kind: 'text'; text: string }
type PaigeHitsMsg = { role: 'paige'; kind: 'hits'; hits: PaigeHit[] }
type Msg = UserMsg | PaigeTextMsg | PaigeHitsMsg

const PROMPT_KEYS: TranslationKey[] = [
  'paige.promptUruguay',
  'paige.promptUae',
  'paige.promptStacking',
  'paige.promptPortugal',
]

function highlightUnverified(text: string) {
  const parts = text.split(/(\[unverified\]|UNVERIFIED)/gi)
  return parts.map((part, i) => {
    if (/^\[unverified\]$|^UNVERIFIED$/i.test(part)) {
      return (
        <span key={i} className="text-status-amber font-medium bg-status-amber/10 rounded px-0.5">
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function PaigeHitsBubble({
  hits,
  onOpenProgram,
  viewSourceLabel,
}: {
  hits: PaigeHit[]
  onOpenProgram: (program: CinematicProgram) => void
  viewSourceLabel: string
}) {
  const blocks = buildPaigeBlocks(hits)

  return (
    <div className="rounded-mp-md px-3 py-2 bg-nostr-violet/10 text-ink-secondary mr-4 space-y-3">
      {blocks.map((block) => {
        const cinematic = toCinematicProgram(hits.find((h) => h.program.id === block.programId)!.program)
        return (
          <div key={block.programId} className="space-y-1.5">
            <p className="font-medium text-ink">
              <strong>{block.programName}</strong> ({block.region}) — {block.status}
            </p>
            {block.verified ? (
              <p className="text-mp-proof text-[11px]">
                ✓ Satohash verified · block #{block.blockHeight ?? '—'}
              </p>
            ) : (
              <p className="text-status-amber text-[11px] font-medium bg-status-amber/10 rounded px-1.5 py-0.5 inline-block">
                ⚠ UNVERIFIED — treat claims as research stubs until stamped
              </p>
            )}
            <ul className="list-none space-y-0.5">
              {block.snippets.map((s, i) => (
                <li key={i} className="text-ink-secondary">
                  • {highlightUnverified(s)}
                </li>
              ))}
            </ul>
            {block.redFlag && (
              <p className="text-status-amber text-[11px]">⚠ {block.redFlag}</p>
            )}
            <button
              type="button"
              onClick={() => onOpenProgram(cinematic)}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-chrome font-medium text-mp-btc-text hover:underline underline-offset-2"
            >
              <FileSearch size={12} aria-hidden />
              {viewSourceLabel}
              {block.field ? ` · ${block.field}` : ''}
            </button>
          </div>
        )
      })}
      <p className="text-[10px] text-ink-muted pt-1 border-t border-mp/30">{PAIGE_DISCLAIMER}</p>
    </div>
  )
}

export function PaigeChat({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  const { programs } = usePrograms()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'paige', kind: 'text', text: t('paige.greeting') },
  ])
  const [busy, setBusy] = useState(false)
  const [modalProgram, setModalProgram] = useState<CinematicProgram | null>(null)

  const flagshipCount = useMemo(() => programs.filter((p) => p.flagship_depth).length, [programs])

  const send = (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setBusy(true)
    window.setTimeout(() => {
      const hits = retrievePrograms(programs, q)
      if (!hits.length) {
        setMessages((m) => [
          ...m,
          {
            role: 'paige',
            kind: 'text',
            text: `I couldn't match "${q}" to a verified program in our corpus. Try a country name (Uruguay, UAE, Portugal) or "Bitcoin residency".\n\n${PAIGE_DISCLAIMER}`,
          },
        ])
      } else {
        setMessages((m) => [...m, { role: 'paige', kind: 'hits', hits }])
      }
      setBusy(false)
    }, 280)
  }

  return (
    <>
      <div className={`card border-nostr-violet/25 bg-nostr-violet-soft/60 ${compact ? '!p-4' : ''}`}>
        <div className={`flex items-center gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
          <Bot size={compact ? 14 : 16} className="text-nostr-violet" />
          <span className={`font-semibold text-ink ${compact ? 'text-xs' : 'text-sm'}`}>Paige AI</span>
          <span className="text-[10px] font-mono uppercase tracking-wide text-mp-btc-text bg-btc-orange-soft px-2 py-0.5 rounded-chip">
            RAG · {flagshipCount} flagships
          </span>
        </div>
        <div
          className={`${compact ? 'max-h-32' : 'max-h-48'} overflow-y-auto space-y-2 mb-3 text-xs leading-relaxed`}
          aria-live="polite"
        >
          {messages.map((m, i) => {
            if (m.role === 'user') {
              return (
                <div key={i} className="rounded-mp-md px-3 py-2 whitespace-pre-wrap bg-mp-card text-ink ml-8">
                  {m.text}
                </div>
              )
            }
            if (m.kind === 'text') {
              return (
                <div key={i} className="rounded-mp-md px-3 py-2 whitespace-pre-wrap bg-nostr-violet/10 text-ink-secondary mr-4">
                  {highlightUnverified(m.text)}
                </div>
              )
            }
            return (
              <PaigeHitsBubble
                key={i}
                hits={m.hits}
                onOpenProgram={setModalProgram}
                viewSourceLabel={t('paige.viewSource')}
              />
            )
          })}
          {busy && <div className="text-ink-muted text-[11px] animate-pulse">{t('paige.busy')}</div>}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PROMPT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => send(t(key))}
              disabled={busy}
              className="chip text-[10px] !py-1 !px-2.5 disabled:opacity-50"
            >
              {t(key)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t('paige.placeholder')}
            aria-label="Ask Paige"
            className="flex-1 rounded-mp-md border border-mp bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={busy || !input.trim()}
            className="btn-primary !px-3"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
        <Link
          to="/agents#agents-paige"
          className="text-xs font-chrome font-medium text-nostr-violet inline-flex items-center gap-1 hover:underline underline-offset-2"
        >
          {t('paige.escalate')} <ArrowRight size={12} />
        </Link>
      </div>

      <ProgramModal
        program={modalProgram}
        onClose={() => setModalProgram(null)}
        initialTab="Sources"
      />
    </>
  )
}