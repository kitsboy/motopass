import { useState } from 'react'
import { Zap } from 'lucide-react'
import { connectNostr, hasNostrExtension, type NostrSession } from '../lib/nostr'
import { useI18n } from '../i18n/I18nContext'

export function NostrConnect({ onConnect }: { onConnect?: (s: NostrSession | null) => void }) {
  const { t } = useI18n()
  const [session, setSession] = useState<NostrSession | null>(() => {
    const saved = sessionStorage.getItem('motopass-npub')
    return saved ? { npub: saved, pubkey: '' } : null
  })
  const [loading, setLoading] = useState(false)

  const connect = async () => {
    if (!hasNostrExtension()) {
      window.open('https://nostr.com/get-started', '_blank')
      return
    }
    setLoading(true)
    const s = await connectNostr()
    setSession(s)
    if (s) sessionStorage.setItem('motopass-npub', s.npub)
    onConnect?.(s)
    setLoading(false)
  }

  if (session) {
    return (
      <div
        className="nav-btn nav-btn-violet !cursor-default max-w-[9.5rem] !px-2"
        aria-label={`Nostr connected: ${session.npub}`}
      >
        <Zap size={12} className="shrink-0 fill-nostr-violet/20" aria-hidden="true" />
        <span className="truncate font-mono text-[10px]" aria-hidden="true">{session.npub.slice(0, 8)}…</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={loading}
      className="nav-btn nav-btn-violet"
    >
      <Zap size={12} strokeWidth={2.25} aria-hidden="true" />
      <span>{loading ? '…' : t('nostr.connect')}</span>
    </button>
  )
}