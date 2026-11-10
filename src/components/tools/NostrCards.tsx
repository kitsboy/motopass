import { useState } from 'react'
import { AlertTriangle, BadgeCheck, ShieldCheck } from 'lucide-react'
import { nip05Verdict, resolveNip05 } from '../../lib/nip05'
import { forgetNip05Pin, recordNip05Pin, type Nip05PinRecord } from '../../lib/nip05Pin'
import { inspectNip17GiftWrap } from '../../lib/nip17'
import { decode as decodeNip19, npubEncode } from 'nostr-tools/nip19'
import { CheckLine, ClearButton, FieldRow, ToolCard, VerificationTrail, buttonClass, inputClass } from './toolsShared'

function expectedPubkey(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^[0-9a-f]{64}$/i.test(trimmed)) return trimmed.toLowerCase()
  try {
    const decoded = decodeNip19(trimmed)
    return decoded.type === 'npub' ? decoded.data : null
  } catch {
    return null
  }
}

function Nip05Tool() {
  const [handle, setHandle] = useState('')
  const [expected, setExpected] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof resolveNip05>> | null>(null)
  const [pin, setPin] = useState<Nip05PinRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const expectedHex = expected.trim() ? expectedPubkey(expected) : null
  const invalidExpected = Boolean(expected.trim() && !expectedHex)
  const verdict = result?.ok ? nip05Verdict(result.pubkey, expectedHex) : null

  const run = async () => {
    setBusy(true)
    const next = await resolveNip05(handle)
    setResult(next)
    setPin(next.ok ? recordNip05Pin(handle, next.pubkey, next.relays) : null)
    setBusy(false)
  }

  return (
    <ToolCard icon={<BadgeCheck size={11} aria-hidden="true" />} eyebrow="NIP-05" title="Resolve a name to an npub" toolId="nip05" network>
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Reads the domain&apos;s <span className="font-mono">/.well-known/nostr.json</span> and shows the npub, hex key and
        relays it maps to. A match is domain trust: the domain owner can change the mapping.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="nip05-handle" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          NIP-05 name
        </label>
        <input
          id="nip05-handle"
          value={handle}
          onChange={event => setHandle(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void run()
          }}
          spellCheck={false}
          placeholder="name@domain"
          className={inputClass}
        />
        <label htmlFor="nip05-expected" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Expected key (npub or hex, optional)
        </label>
        <input
          id="nip05-expected"
          value={expected}
          onChange={event => setExpected(event.target.value)}
          spellCheck={false}
          placeholder="npub1… or 64 hex characters"
          className={inputClass}
        />
        {invalidExpected && (
          <p className="mt-1 text-[10px] text-mp-wax">Expected key must be an npub or 64 hex characters.</p>
        )}
        <button type="submit" disabled={busy || !handle.trim() || invalidExpected} className={`${buttonClass} mt-2`}>
          {busy ? 'Resolving…' : 'Resolve name'}
        </button>
        <ClearButton
          onClick={() => {
            setHandle('')
            setExpected('')
            setResult(null)
            setPin(null)
          }}
          disabled={!handle && !expected && !result}
        />
      </form>
      <div aria-live="polite" className="mt-3">
        {result && !result.ok && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {result.error}
          </p>
        )}
        {result?.ok && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <VerificationTrail
              steps={[
                { label: 'domain JSON', state: 'pass' },
                { label: 'key match', state: verdict == null ? 'unknown' : verdict === 'match' ? 'pass' : 'fail' },
                { label: 'domain trust', state: 'unknown' },
              ]}
              tool="nip05"
              title="NIP-05 name resolution"
              limits={[
                'A match is domain trust: the domain owner can repoint the name at any time.',
                'The local pin is public data stored in this browser, not an identity proof.',
                'The lookup made one https request and did not verify the person behind the key.',
              ]}
              fields={{ handle: `${result.identifier.name}@${result.identifier.domain}`, pubkey: result.pubkey, verdict }}
            />
            <p className={`text-[10px] font-semibold ${verdict === 'mismatch' ? 'text-mp-wax' : verdict === 'match' ? 'text-mp-proof' : 'text-mp-ink-tertiary'}`}>
              {verdict === 'match'
                ? 'Name resolves to the expected key'
                : verdict === 'mismatch'
                  ? 'Name resolves to a different key'
                  : 'Name resolved · no expected key supplied'}
            </p>
            <div className="mt-1.5">
              <FieldRow
                label="NIP-05"
                value={`${result.identifier.name}@${result.identifier.domain}`}
              />
              <FieldRow
                label="npub"
                value={<span className="font-mono text-[10px]">{npubEncode(result.pubkey)}</span>}
                copy={npubEncode(result.pubkey)}
              />
              <FieldRow
                label="Hex key"
                value={<span className="font-mono text-[10px]">{result.pubkey}</span>}
                copy={result.pubkey}
              />
              <FieldRow label="Relays" value={result.relays.length > 0 ? result.relays.join(', ') : 'none advertised'} />
            </div>
            {pin && (
              <div className={`mt-2 border-t border-mp-border-subtle/60 pt-2 text-[10px] leading-relaxed ${pin.status === 'rotated' ? 'text-mp-wax' : 'text-mp-ink-tertiary'}`}>
                <p>
                  {pin.status === 'new'
                    ? 'Pinned the first key seen for this name in this browser.'
                    : pin.status === 'same'
                      ? 'Same key as the local continuity pin.'
                      : 'Key changed since the local pin. Verify the new key out of band before trusting it.'}
                </p>
                {pin.previous && (
                  <p className="mt-1 break-all font-mono text-[9px]">
                    Pinned {pin.previous.pubkey.slice(0, 16)}… → now {pin.pin.pubkey.slice(0, 16)}…
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    forgetNip05Pin(handle)
                    setPin(null)
                  }}
                  className="mt-1 font-chrome text-[9px] uppercase tracking-wide text-mp-ink-tertiary underline underline-offset-2 hover:text-mp-ink"
                >
                  Forget local pin
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolCard>
  )
}

function Nip17Tool() {
  const [raw, setRaw] = useState('')
  const [secret, setSecret] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof inspectNip17GiftWrap>> | null>(null)

  const run = () => setResult(inspectNip17GiftWrap(raw, secret))

  return (
    <ToolCard icon={<ShieldCheck size={11} aria-hidden="true" />} eyebrow="NIP-17 / NIP-59" title="Inspect a gift-wrapped DM" toolId="nip17">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Checks the public kind 1059 wrapper, then optionally unwraps the NIP-44 seal and unsigned rumor with the recipient key.
        The key stays in this tab; it is never stored, returned or logged. A valid seal proves the sender key, not delivery.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          run()
        }}
      >
        <label htmlFor="nip17-event" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Gift-wrap event JSON
        </label>
        <textarea id="nip17-event" value={raw} onChange={event => setRaw(event.target.value)} rows={5} spellCheck={false} placeholder='{"kind":1059,…}' className={`${inputClass} font-mono text-[9px]`} />
        <label htmlFor="nip17-secret" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Recipient nsec or hex (optional, to unwrap)
        </label>
        <input id="nip17-secret" type="password" value={secret} onChange={event => setSecret(event.target.value)} spellCheck={false} autoComplete="off" placeholder="kept in this tab only" className={inputClass} />
        <button type="submit" disabled={!raw.trim()} className={`${buttonClass} mt-2`}>
          Inspect DM
        </button>
        <ClearButton onClick={() => { setRaw(''); setSecret(''); setResult(null) }} disabled={!raw && !secret && !result} />
      </form>
      <div aria-live="polite" className="mt-3">
        {result && !result.ok && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {result.error}
          </p>
        )}
        {result?.ok && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <VerificationTrail
              steps={[
                { label: 'wrapper sig', state: result.result.checks.signature ? 'pass' : 'fail' },
                { label: 'one recipient', state: result.result.checks.oneRecipient ? 'pass' : 'fail' },
                { label: 'seal', state: result.result.unlocked ? (result.result.unlocked.checks.sealSignature ? 'pass' : 'fail') : 'unknown' },
                { label: 'sender match', state: result.result.unlocked ? (result.result.unlocked.checks.senderMatches ? 'pass' : 'fail') : 'unknown' },
              ]}
              tool="nip17"
              title="NIP-17 gift-wrap inspection"
              limits={[
                'The wrapper key is random; its signature proves who published the wrapper, not the sender.',
                'A valid seal proves the sender key, not delivery, reading or reply.',
                'Unwrapping used the recipient secret in memory only; no secret is written to this receipt.',
              ]}
              fields={{ wrapper: result.result.event.id, recipients: result.result.recipients.join(', '), unlocked: Boolean(result.result.unlocked) }}
            />
            <div>
              <CheckLine label="Kind 1059 / 21059" value={result.result.checks.kind} />
              <CheckLine label="Wrapper signature" value={result.result.checks.signature} />
              <CheckLine label="One recipient" value={result.result.checks.oneRecipient} />
              <CheckLine label="Past timestamp" value={result.result.checks.pastTimestamp} />
            </div>
            <div className="mt-1.5">
              <FieldRow label="Wrapper author" value={<span className="break-all font-mono text-[9px]">{result.result.event.pubkey}</span>} />
              <FieldRow label="Recipients" value={result.result.recipients.length > 0 ? result.result.recipients.join(', ') : 'none'} />
            </div>
            {result.result.unlockError && <p className="mt-2 text-[10px] leading-relaxed text-mp-wax">No unwrap: {result.result.unlockError}</p>}
            {result.result.unlocked && (
              <div className="mt-2 rounded-mp-sm border border-mp-border-subtle/60 p-1.5">
                <div className="mb-1 flex flex-wrap items-center gap-1">
                  <CheckLine label="Seal kind 13" value={result.result.unlocked.checks.sealKind} />
                  <CheckLine label="Seal signature" value={result.result.unlocked.checks.sealSignature} />
                  <CheckLine label="Empty seal tags" value={result.result.unlocked.checks.sealEmptyTags} />
                  <CheckLine label="Sender matches rumor" value={result.result.unlocked.checks.senderMatches} />
                  <CheckLine label="Rumor id" value={result.result.unlocked.checks.rumorId} />
                  <CheckLine label="DM kind" value={result.result.unlocked.checks.rumorKind} />
                </div>
                <FieldRow label="Sender npub" value={<span className="break-all font-mono text-[9px]">{npubEncode(result.result.unlocked.rumor.pubkey)}</span>} copy={npubEncode(result.result.unlocked.rumor.pubkey)} />
                <FieldRow label="Sent" value={new Date(result.result.unlocked.rumor.created_at * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'} />
                <p className="mt-1 font-chrome text-[9px] uppercase tracking-wide text-mp-ink-tertiary">Content</p>
                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-mp-sm bg-mp-canvas/70 p-2 text-[10px] text-mp-ink">{result.result.unlocked.rumor.content}</pre>
              </div>
            )}
            {result.result.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-mp-wax">
                {result.result.warnings.map(warning => <li key={warning}>{warning}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </ToolCard>
  )
}

export { Nip05Tool, Nip17Tool }
