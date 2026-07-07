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
        className="flex items-center gap-2 text-xs text-nostr-violet bg-nostr-violet-soft border border-nostr-violet/20 rounded-full px-3 py-1.5 max-w-[200px]"
        aria-label={`Nostr connected: ${session.npub}`}
      >
        <Zap size={12} className="shrink-0" aria-hidden="true" />
        <span className="truncate font-mono" aria-hidden="true">{session.npub.slice(0, 12)}…</span>
        <span className="text-nostr-violet/80 shrink-0">{t('nostr.connected')}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={loading}
      className="chip text-xs !text-nostr-violet !border-nostr-violet/30 hover:!bg-nostr-violet-soft"
    >
      <Zap size={12} />
      {loading ? '…' : t('nostr.connect')}
    </button>
  )
}