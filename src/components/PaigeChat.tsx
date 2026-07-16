import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bot, Send, ArrowRight, FileSearch, Trash2 } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { usePrograms } from '../hooks/usePrograms'
import { retrievePrograms } from '../lib/paige/retrieve'
import type { PaigeHit } from '../lib/paige/retrieve'
import { buildPaigeBlocks, buildPaigeResponse, PAIGE_DISCLAIMER } from '../lib/paige/respond'
import { compareHandoffPath, resolveCompareHandoff } from '../lib/paige/compareHandoff'
import {
  clearPaigeHistory,
  loadPaigeHistory,
  savePaigeHistory,
  type StoredMsg,
} from '../lib/paige/paigeHistory'
import { isStreamComplete, nextStreamIndex, PAIGE_CHAR_MS } from '../lib/paige/streamText'
import { toCinematicProgram } from '../lib/programAdapter'
import { ProgramModal } from './programs/ProgramModal'
import type { Program as CinematicProgram } from './programs/types'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import type { TranslationKey } from '../i18n/translations'

type UserMsg = { role: 'user'; text: string }
type PaigeTextMsg = { role: 'paige'; kind: 'text'; text: string }
type PaigeHitsMsg = { role: 'paige'; kind: 'hits'; hits: PaigeHit[] }
type PaigeCompareMsg = { role: 'paige'; kind: 'compare'; programIds: number[]; label: string }
type PaigeStreamingMsg = { role: 'paige'; kind: 'streaming'; text: string; displayed: number }
type Msg = UserMsg | PaigeTextMsg | PaigeHitsMsg | PaigeCompareMsg | PaigeStreamingMsg

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

function toStoredMsg(m: Msg): StoredMsg | null {
  if (m.role === 'user') return { role: 'user', text: m.text }
  if (m.kind === 'text') return { role: 'paige', kind: 'text', text: m.text }
  if (m.kind === 'hits') return { role: 'paige', kind: 'hits', programIds: m.hits.map((h) => h.program.id) }
  if (m.kind === 'compare') return { role: 'paige', kind: 'compare', programIds: m.programIds, label: m.label }
  return null
}

function hydrateStoredMessages(stored: StoredMsg[], programs: ReturnType<typeof usePrograms>['programs'], greeting: string): Msg[] {
  const hydrated: Msg[] = [{ role: 'paige', kind: 'text', text: greeting }]
  for (const s of stored) {
    if (s.role === 'user') {
      hydrated.push({ role: 'user', text: s.text })
      continue
    }
    if (s.kind === 'text') {
      hydrated.push({ role: 'paige', kind: 'text', text: s.text })
      continue
    }
    const hits = s.programIds
      .map((id) => programs.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((program) => retrievePrograms([program], program.name, 1)[0])
      .filter((h): h is PaigeHit => Boolean(h))
    if (s.kind === 'hits' && hits.length) {
      hydrated.push({ role: 'paige', kind: 'hits', hits })
    }
    if (s.kind === 'compare' && hits.length >= 2) {
      hydrated.push({
        role: 'paige',
        kind: 'compare',
        programIds: s.programIds,
        label: s.label,
      })
    }
  }
  return hydrated
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

function lastHitProgramIds(messages: Msg[]): number[] {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i]
    if (m.role === 'paige' && m.kind === 'hits') return m.hits.map((h) => h.program.id)
  }
  return []
}

export function PaigeChat({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const { programs } = usePrograms()
  const greeting = t('paige.greeting')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([{ role: 'paige', kind: 'text', text: greeting }])
  const [busy, setBusy] = useState(false)
  const [modalProgram, setModalProgram] = useState<CinematicProgram | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const streamTimer = useRef<number | null>(null)

  const flagshipCount = useMemo(() => programs.filter((p) => p.flagship_depth).length, [programs])

  useEffect(() => {
    if (hydrated || !programs.length) return
    const stored = loadPaigeHistory()
    if (stored.length) {
      setMessages(hydrateStoredMessages(stored, programs, greeting))
    }
    setHydrated(true)
  }, [hydrated, programs, greeting])

  const persistHistory = useCallback((next: Msg[]) => {
    const stored = next
      .filter((m) => !(m.role === 'paige' && m.kind === 'text' && m.text === greeting))
      .map(toStoredMsg)
      .filter((m): m is StoredMsg => m !== null)
    savePaigeHistory(stored)
  }, [greeting])

  useEffect(() => {
    if (!hydrated) return
    persistHistory(messages)
  }, [messages, hydrated, persistHistory])

  useEffect(() => {
    const streaming = messages.find((m): m is PaigeStreamingMsg => m.role === 'paige' && m.kind === 'streaming')
    if (!streaming) return

    if (isStreamComplete(streaming.displayed, streaming.text.length)) {
      setMessages((prev) =>
        prev.map((m) =>
          m.role === 'paige' && m.kind === 'streaming'
            ? { role: 'paige', kind: 'text', text: streaming.text }
            : m,
        ),
      )
      setBusy(false)
      return
    }

    streamTimer.current = window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.role !== 'paige' || m.kind !== 'streaming') return m
          return {
            ...m,
            displayed: nextStreamIndex(m.displayed, m.text.length, reduceMotion ?? false),
          }
        }),
      )
    }, reduceMotion ? 0 : PAIGE_CHAR_MS)

    return () => {
      if (streamTimer.current) window.clearTimeout(streamTimer.current)
    }
  }, [messages, reduceMotion])

  const clearHistory = () => {
    clearPaigeHistory()
    setMessages([{ role: 'paige', kind: 'text', text: greeting }])
    setBusy(false)
  }

  const send = (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setInput('')
    const nextMessages: Msg[] = [...messages, { role: 'user', text: q }]
    setMessages(nextMessages)
    setBusy(true)

    window.setTimeout(() => {
      const compareIds = resolveCompareHandoff(q, programs, lastHitProgramIds(nextMessages))
      if (compareIds && compareIds.length >= 2) {
        const names = compareIds
          .map((id) => programs.find((p) => p.id === id)?.name)
          .filter(Boolean)
          .join(' vs ')
        setMessages((m) => [
          ...m,
          {
            role: 'paige',
            kind: 'compare',
            programIds: compareIds,
            label: names || t('paige.compareLabel'),
          },
        ])
        setBusy(false)
        return
      }

      const hits = retrievePrograms(programs, q)
      if (!hits.length) {
        const text = buildPaigeResponse(q, hits)
        setMessages((m) => [...m, { role: 'paige', kind: 'streaming', text, displayed: 0 }])
        return
      }

      const intro = `Found ${hits.length} matching program${hits.length === 1 ? '' : 's'} in the corpus…`
      setMessages((m) => [
        ...m,
        { role: 'paige', kind: 'streaming', text: intro, displayed: 0 },
      ])

      window.setTimeout(() => {
        setMessages((m) => {
          const withoutStreaming = m.filter((msg) => !(msg.role === 'paige' && msg.kind === 'streaming'))
          return [...withoutStreaming, { role: 'paige', kind: 'hits', hits }]
        })
        setBusy(false)
      }, reduceMotion ? 120 : Math.min(intro.length * PAIGE_CHAR_MS + 200, 2400))
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
          <button
            type="button"
            onClick={clearHistory}
            className="ml-auto inline-flex items-center gap-1 text-[10px] font-chrome text-ink-muted hover:text-ink-secondary"
            aria-label={t('paige.clearHistory')}
          >
            <Trash2 size={12} aria-hidden />
            {t('paige.clearHistory')}
          </button>
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
            if (m.kind === 'streaming') {
              return (
                <div key={i} className="rounded-mp-md px-3 py-2 whitespace-pre-wrap bg-nostr-violet/10 text-ink-secondary mr-4">
                  {highlightUnverified(m.text.slice(0, m.displayed))}
                  {!isStreamComplete(m.displayed, m.text.length) && (
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-nostr-violet/60 animate-pulse align-middle" aria-hidden />
                  )}
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
            if (m.kind === 'compare') {
              return (
                <div key={i} className="rounded-mp-md px-3 py-2 bg-nostr-violet/10 text-ink-secondary mr-4 space-y-2">
                  <p>{formatT(t, 'paige.compareHandoff', { programs: m.label })}</p>
                  <button
                    type="button"
                    onClick={() => navigate(compareHandoffPath(m.programIds))}
                    className="inline-flex items-center gap-1 text-[11px] font-chrome font-medium text-mp-btc-text hover:underline underline-offset-2"
                  >
                    {t('paige.openCompare')} <ArrowRight size={12} aria-hidden />
                  </button>
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
          {busy && !messages.some((m) => m.role === 'paige' && m.kind === 'streaming') && (
            <div className="text-ink-muted text-[11px] animate-pulse">{t('paige.busy')}</div>
          )}
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