import { useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSignature } from 'lucide-react'
import { verifyMessageSignature } from '../../lib/messageSignature'
import { ClearButton, FieldRow, ToolCard, VerificationTrail, buttonClass, inputClass } from './toolsShared'

function MessageSignatureTool() {
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [result, setResult] = useState<ReturnType<typeof verifyMessageSignature> | null>(null)

  const run = () => setResult(verifyMessageSignature(address, message, signature))

  return (
    <ToolCard
      icon={<FileSignature size={11} aria-hidden="true" />}
      eyebrow="BIP-137"
      title="Verify a signed message"
      toolId="message-signature"
    >
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Recovers the Bitcoin key from a legacy <span className="font-mono">Bitcoin Signed Message</span> signature and
        checks that it hashes to the address you supply. This covers P2PKH, P2SH-P2WPKH and P2WPKH only — not BIP-322,
        taproot messages or arbitrary scripts.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          run()
        }}
      >
        <label htmlFor="message-address" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Signing address
        </label>
        <input
          id="message-address"
          value={address}
          onChange={event => setAddress(event.target.value)}
          spellCheck={false}
          placeholder="1… / 3… / bc1q…"
          className={inputClass}
        />
        <label htmlFor="message-text" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Exact message
        </label>
        <textarea
          id="message-text"
          value={message}
          onChange={event => setMessage(event.target.value)}
          rows={3}
          spellCheck={false}
          placeholder="The message the signer committed to"
          className={inputClass}
        />
        <label htmlFor="bip137-signature-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Base64 compact signature
        </label>
        <textarea
          id="bip137-signature-input"
          value={signature}
          onChange={event => setSignature(event.target.value)}
          rows={2}
          spellCheck={false}
          placeholder="H… / I… (65 bytes, base64)"
          className={`${inputClass} font-mono text-[9px]`}
        />
        <button type="submit" disabled={!address.trim() || !message.length || !signature.trim()} className={`${buttonClass} mt-2`}>
          Verify message
        </button>
        <ClearButton
          onClick={() => {
            setAddress('')
            setMessage('')
            setSignature('')
            setResult(null)
          }}
          disabled={!address && !message && !signature && !result}
        />
      </form>

      <div aria-live="polite" className="mt-3">
        {result && result.status === 'unreadable' && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {result.note}
          </p>
        )}
        {result && result.status !== 'unreadable' && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <VerificationTrail
              steps={[
                { label: 'format', state: 'pass' },
                { label: 'key recovery', state: result.recoveredPubkey ? 'pass' : 'fail' },
                { label: 'address match', state: result.status === 'valid' ? 'pass' : 'fail' },
                { label: 'replay context', state: 'unknown' },
              ]}
              tool="message-signature"
              title="BIP-137 signed-message check"
              limits={[
                'Legacy message signing proves control of the key at signing time; it does not prove funds, balance or current ownership.',
                'The exact message matters. Whitespace, Unicode normalisation or a different line ending changes the digest.',
                'This format covers P2PKH, P2SH-P2WPKH and P2WPKH only; BIP-322 and taproot messages are not supported.',
                'A signed message can be replayed wherever it is accepted; this card does not check the relying party or context.',
              ]}
              fields={{
                address: address.trim(),
                addressType: result.addressType,
                recoveredAddress: result.recoveredAddress,
                recoveredPubkey: result.recoveredPubkey,
              }}
            />
            <p className={`flex items-center gap-1 text-[10px] font-semibold ${result.status === 'valid' ? 'text-mp-proof' : 'text-mp-wax'}`}>
              {result.status === 'valid' ? <CheckCircle2 size={11} aria-hidden="true" /> : <AlertTriangle size={11} aria-hidden="true" />}
              {result.status === 'valid' ? 'Address controls the signing key' : 'Signature does not match this address'}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-mp-ink-tertiary">{result.note}</p>
            {result.recoveredPubkey && (
              <div className="mt-1.5">
                <FieldRow
                  label="Recovered key"
                  value={<span className="break-all font-mono text-[9px]">{result.recoveredPubkey}</span>}
                  copy={result.recoveredPubkey}
                />
                <FieldRow label="Address type" value={result.addressType ?? 'unknown'} />
              </div>
            )}
            <p className="mt-2 text-[9px] leading-relaxed text-mp-ink-tertiary">
              A valid result means this exact message and signature recover a key whose hash matches this address. It is
              not a transaction signature, a payment receipt or proof that the signer still controls the address.
            </p>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

export { MessageSignatureTool }
