import { useState } from 'react'
import { LogOut, Zap } from 'lucide-react'
import { connectNostr, hasNostrExtension, type NostrSession } from '../lib/nostr'
import { useI18n } from '../i18n/I18nContext'

export function NostrConnect({
  onConnect,
  onLoadingChange,
}: {
  onConnect?: (s: NostrSession | null) => void
  onLoadingChange?: (loading: boolean) => void
}) {
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
    onLoadingChange?.(true)
    const s = await connectNostr()
    setSession(s)
    if (s) sessionStorage.setItem('motopass-npub', s.npub)
    onConnect?.(s)
    setLoading(false)
    onLoadingChange?.(false)
  }

  const disconnect = () => {
    if (!window.confirm('Disconnect Nostr from this session?')) return
    sessionStorage.removeItem('motopass-npub')
    setSession(null)
    onConnect?.(null)
  }

  if (session) {
    return (
      <div className="flex items-center gap-1">
        <div
          className="nav-btn nav-btn-violet !cursor-default max-w-[9.5rem] !px-2"
          title={session.npub}
          aria-label={`Nostr connected: ${session.npub}`}
        >
          <Zap size={12} className="shrink-0 fill-nostr-violet/20" aria-hidden="true" />
          <span className="truncate font-mono text-[10px]" aria-hidden="true">{session.npub.slice(0, 8)}…</span>
        </div>
        <button type="button" onClick={disconnect} className="nav-btn nav-btn-icon" aria-label="Disconnect Nostr" title="Disconnect">
          <LogOut size={14} />
        </button>
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