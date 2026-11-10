import { useEffect, useRef, useState } from 'react'
import { nip19 } from 'nostr-tools'
import { Check, Copy, KeyRound, Unplug } from 'lucide-react'
import { nip46Request, nip46Signer, parseBunkerUri, createRelayTransport, createNostrConnectSession } from '../../lib/nip46'
import { formatNip05, nip05Verdict, resolveNip05 } from '../../lib/nip05'
import { MOTOPASS_RELAYS } from '../../lib/nostr'
import type { LedgerSigner } from '../../lib/nostrLedger'

/**
 * Sign without a browser extension.
 *
 * Two paths: paste a `bunker://` connection, or display a `nostrconnect://`
 * URI for a signer app to approve. Either way the user's key stays in the
 * signer; this tab holds a throwaway client key in memory. NIP-05 is shown as
 * what it is — the domain's claim about a pubkey, not a person.
 */

type Props = {
  onSigner: (signer: LedgerSigner | null, pubkey: string | null) => void
}

const HEX64 = /^[a-f0-9]{64}$/i

export function RemoteSigner({ onSigner }: Props) {
  const [mode, setMode] = useState<'bunker' | 'connect'>('bunker')
  const [bunkerInput, setBunkerInput] = useState('')
  const [connectUri, setConnectUri] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pubkey, setPubkey] = useState<string | null>(null)
  const [identity, setIdentity] = useState('')
  const [identityState, setIdentityState] = useState<{ verdict: string; detail: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const transportRef = useRef<ReturnType<typeof createRelayTransport> | null>(null)

  useEffect(() => {
    return () => {
      try {
        transportRef.current?.destroy()
      } catch {
        /* already gone */
      }
    }
  }, [])

  const reset = () => {
    try {
      transportRef.current?.destroy()
    } catch {
      /* already gone */
    }
    transportRef.current = null
    setPubkey(null)
    setConnectUri(null)
    setNotice(null)
    setIdentityState(null)
    onSigner(null, null)
  }

  const finish = (transport: ReturnType<typeof createRelayTransport>, secret: Uint8Array, remotePubkey: string, userPubkey: string) => {
    setPubkey(userPubkey)
    setNotice('Remote signer connected — signing happens in the signer app.')
    onSigner(nip46Signer(transport, secret, remotePubkey), userPubkey)
  }

  const connectBunker = async () => {
    setError(null)
    setNotice(null)
    const connection = parseBunkerUri(bunkerInput)
    if (!connection) {
      setError('Use bunker://<signer-pubkey>?relay=wss://… with at least one wss relay.')
      return
    }
    setBusy(true)
    reset()
    const transport = createRelayTransport(connection.relays)
    transportRef.current = transport
    const secret = crypto.getRandomValues(new Uint8Array(32))
    const connected = await nip46Request(transport, secret, connection.remotePubkey, 'connect', [
      connection.remotePubkey,
      connection.secret ?? '',
    ])
    if (!connected.ok) {
      setBusy(false)
      setError(connected.error)
      reset()
      return
    }
    const who = await nip46Request(transport, secret, connection.remotePubkey, 'get_public_key', [])
    setBusy(false)
    if (!who.ok || typeof who.result !== 'string' || !HEX64.test(who.result)) {
      setError(who.ok ? 'Signer did not return a hex pubkey' : who.error)
      reset()
      return
    }
    finish(transport, secret, connection.remotePubkey, who.result.toLowerCase())
  }

  const connectNostrConnect = async () => {
    setError(null)
    setNotice(null)
    const relays = MOTOPASS_RELAYS.slice(0, 2)
    const session = createNostrConnectSession({ relays, name: 'MotoPass' })
    if (!session) {
      setError('No relay is configured for pairing.')
      return
    }
    reset()
    const transport = createRelayTransport(relays)
    transportRef.current = transport
    setConnectUri(session.uri)
    setBusy(true)
    const paired = await session.waitForSigner(transport, { timeoutMs: 120_000 })
    if (!paired.ok) {
      setBusy(false)
      setError(paired.error)
      return
    }
    const who = await nip46Request(transport, session.secret, paired.remotePubkey, 'get_public_key', [])
    setBusy(false)
    if (!who.ok || typeof who.result !== 'string' || !HEX64.test(who.result)) {
      setError(who.ok ? 'Signer did not return a hex pubkey' : who.error)
      return
    }
    finish(transport, session.secret, paired.remotePubkey, who.result.toLowerCase())
  }

  const verifyIdentity = async () => {
    if (!pubkey) return
    const resolved = await resolveNip05(identity)
    if (!resolved.ok) {
      setIdentityState({ verdict: 'unverified', detail: resolved.error })
      return
    }
    const verdict = nip05Verdict(resolved.pubkey, pubkey)
    setIdentityState({
      verdict,
      detail:
        verdict === 'match'
          ? `${formatNip05(resolved.identifier)} resolves to this npub`
          : `${formatNip05(resolved.identifier)} resolves to a different npub`,
    })
  }

  const copyUri = async () => {
    if (!connectUri) return
    try {
      await navigator.clipboard.writeText(connectUri)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (pubkey) {
    const npub = nip19.npubEncode(pubkey)
    return (
      <div className="rounded-mp-md border border-mp-border bg-section/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-chrome text-[11px] font-semibold uppercase tracking-wide text-mp-ink-secondary">
            Remote signer
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2.5 py-1 font-chrome text-[11px] text-mp-ink-tertiary hover:border-mp-wax/40 hover:text-mp-wax"
          >
            <Unplug size={11} aria-hidden="true" /> Disconnect
          </button>
        </div>
        <p className="mt-1 font-mono text-[10px] break-all text-mp-ink">{npub.slice(0, 18)}…{npub.slice(-8)}</p>
        {notice && <p className="mt-1 text-[10px] text-mp-proof">{notice}</p>}

        <div className="mt-2 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="nip05-name">
            NIP-05 name
          </label>
          <input
            id="nip05-name"
            value={identity}
            onChange={event => setIdentity(event.target.value)}
            placeholder="you@domain"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-full border border-mp-border bg-mp-card px-3 py-1 font-mono text-[11px] text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void verifyIdentity()}
            className="rounded-full border border-mp-border px-2.5 py-1 font-chrome text-[11px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
          >
            Check NIP-05
          </button>
        </div>
        {identityState && (
          <p
            className={`mt-1.5 text-[10px] leading-relaxed ${
              identityState.verdict === 'match' ? 'text-mp-proof' : 'text-mp-wax'
            }`}
          >
            {identityState.detail}
          </p>
        )}
        <p className="mt-1 text-[9px] leading-relaxed text-mp-ink-tertiary">
          NIP-05 is the domain&apos;s claim about a pubkey — the domain owner can change it. Your key stays in the
          signer app; this tab holds a throwaway client key in memory.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-mp-md border border-mp-border bg-section/40 p-3">
      <p className="flex items-center gap-1.5 font-chrome text-[11px] font-semibold uppercase tracking-wide text-mp-ink-secondary">
        <KeyRound size={11} aria-hidden="true" /> Remote signer
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-mp-ink-tertiary">
        No browser extension? Connect a NIP-46 signer — your key never enters this tab.
      </p>

      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => setMode('bunker')}
          className={`rounded-full border px-2.5 py-1 font-chrome text-[10px] ${
            mode === 'bunker' ? 'border-mp-btc/40 text-mp-btc-text' : 'border-mp-border text-mp-ink-tertiary'
          }`}
        >
          Bunker URI
        </button>
        <button
          type="button"
          onClick={() => setMode('connect')}
          className={`rounded-full border px-2.5 py-1 font-chrome text-[10px] ${
            mode === 'connect' ? 'border-mp-btc/40 text-mp-btc-text' : 'border-mp-border text-mp-ink-tertiary'
          }`}
        >
          Pair a signer app
        </button>
      </div>

      {mode === 'bunker' ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="bunker-uri">
            Bunker connection string
          </label>
          <input
            id="bunker-uri"
            type="password"
            value={bunkerInput}
            onChange={event => setBunkerInput(event.target.value)}
            placeholder="bunker://…"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-full border border-mp-border bg-mp-card px-3 py-1 font-mono text-[11px] text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void connectBunker()}
            disabled={busy || !bunkerInput.trim()}
            className="rounded-full bg-mp-btc px-3 py-1 font-chrome text-[11px] font-semibold text-mp-ink-on-accent disabled:opacity-50"
          >
            {busy ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {connectUri ? (
            <>
              <p className="break-all font-mono text-[9px] leading-relaxed text-mp-ink-tertiary">{connectUri}</p>
              <button
                type="button"
                onClick={() => void copyUri()}
                className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2.5 py-1 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
              >
                {copied ? <Check size={10} aria-hidden="true" /> : <Copy size={10} aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy pairing URI'}
              </button>
              {busy && <p className="text-[10px] text-mp-ink-tertiary">Waiting for a signer to approve…</p>}
            </>
          ) : (
            <button
              type="button"
              onClick={() => void connectNostrConnect()}
              disabled={busy}
              className="rounded-full border border-mp-btc/40 px-2.5 py-1 font-chrome text-[11px] font-semibold text-mp-btc-text hover:bg-mp-btc/10 disabled:opacity-50"
            >
              Show pairing URI
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-[10px] leading-relaxed text-mp-wax">{error}</p>}
    </div>
  )
}
