import { useState, type FormEvent } from 'react'
import { PlugZap, Unplug } from 'lucide-react'
import { nwcGetBalance, parseNwcUri, type NwcBalanceResult } from '../../lib/nwc'

const STORAGE_KEY = 'motopass-nwc-uri'

/**
 * Nostr Wallet Connect, read-only.
 *
 * Only `get_balance` is ever sent. The connection string is a bearer secret
 * that the wallet chooses the permissions for, so it is held in this tab's
 * sessionStorage and never written to localStorage, a URL or a log. The card
 * says this instead of implying the string is harmless.
 */
export function NwcBalanceCard() {
  const [uri, setUri] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [result, setResult] = useState<NwcBalanceResult | null>(null)
  const [busy, setBusy] = useState(false)

  const check = async (event: FormEvent) => {
    event.preventDefault()
    if (!uri.trim()) return
    try {
      sessionStorage.setItem(STORAGE_KEY, uri.trim())
    } catch {
      /* private mode — the check still works this session */
    }
    setBusy(true)
    setResult(await nwcGetBalance(uri))
    setBusy(false)
  }

  const disconnect = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* nothing stored */
    }
    setUri('')
    setResult(null)
  }

  const valid = parseNwcUri(uri) != null

  return (
    <section
      className="rounded-mp-lg border border-mp-border bg-section/40 p-4"
      aria-labelledby="nwc-balance-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="club-eyebrow mb-1 block">Lightning wallet</span>
          <h2 id="nwc-balance-heading" className="font-display text-sm font-semibold text-mp-ink">
            Can this stack be funded in sats?
          </h2>
        </div>
        {valid && (
          <button
            type="button"
            onClick={disconnect}
            className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2.5 py-1 font-chrome text-[11px] text-mp-ink-tertiary hover:border-mp-wax/40 hover:text-mp-wax"
          >
            <Unplug size={11} aria-hidden="true" /> Forget
          </button>
        )}
      </div>

      <p className="mt-1.5 text-[11px] leading-relaxed text-mp-ink-tertiary">
        Paste a NIP-47 connection string from your wallet. This app sends only a balance request —
        no invoices, no payments, no signatures. The wallet decides what the string allows.
      </p>

      <form onSubmit={(event) => void check(event)} className="mt-3 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="nwc-uri">
          Nostr Wallet Connect string
        </label>
        <input
          id="nwc-uri"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={uri}
          onChange={event => setUri(event.target.value)}
          placeholder="nostr+walletconnect://…"
          className="min-w-0 flex-1 rounded-full border border-mp-border bg-mp-card px-3 py-1.5 font-mono text-[11px] text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !uri.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-mp-btc px-3 py-1.5 font-chrome text-[11px] font-semibold text-mp-ink-on-accent disabled:opacity-50"
        >
          <PlugZap size={12} aria-hidden="true" />
          {busy ? 'Asking…' : 'Check balance'}
        </button>
      </form>

      {result && (
        <div className="mt-3" role="status">
          {result.ok ? (
            <p className="font-mono text-sm text-mp-btc-text">
              {result.balanceSats.toLocaleString()} sats
              <span className="ml-2 text-[10px] text-mp-ink-tertiary">{result.balanceMsat.toLocaleString()} msat</span>
            </p>
          ) : (
            <p className="text-[11px] text-mp-wax">{result.error}</p>
          )}
        </div>
      )}

      <p className="mt-2 border-t border-mp-border-subtle pt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
        Held in sessionStorage for this tab only. A wallet may still see the request as authorised
        activity — if that matters, use a connection scoped to balance reads.
      </p>
    </section>
  )
}
