import { useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSignature } from 'lucide-react'
import { verifySignedMessage } from '../../lib/signedMessage'
import { ClearButton, FieldRow, ToolCard, VerificationTrail, buttonClass, inputClass, useToolIntake } from './toolsShared'

function MessageSignatureTool() {
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [result, setResult] = useState<ReturnType<typeof verifySignedMessage> | null>(null)

  useToolIntake('message-signature', value => setSignature(value))

  const run = () => setResult(verifySignedMessage(address, message, signature))

  return (
    <ToolCard
      icon={<FileSignature size={11} aria-hidden="true" />}
      eyebrow="BIP-137 / BIP-322"
      title="Verify a signed message"
      toolId="message-signature"
    >
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Detects BIP-137 legacy signatures and BIP-322 simple proofs. BIP-322 covers P2WPKH and single-key P2TR; BIP-137
        covers P2PKH, P2SH-P2WPKH and P2WPKH. Full, proof-of-funds, P2WSH and multisig proofs are explicitly labelled
        unsupported rather than guessed at.
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
          Exact message (empty is allowed for BIP-322)
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
        <label htmlFor="signed-message-signature-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Base64 signature
        </label>
        <textarea
          id="signed-message-signature-input"
          value={signature}
          onChange={event => setSignature(event.target.value)}
          rows={2}
          spellCheck={false}
          placeholder="smp… / a witness stack / 65-byte BIP-137"
          className={`${inputClass} font-mono text-[10px]`}
        />
        <button type="submit" disabled={!address.trim() || !signature.trim()} className={`${buttonClass} mt-2`}>
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
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              {result.note}
            </p>
            {result.format && (
              <p className="mt-1.5 text-[11px] text-mp-ink-tertiary">
                Detected: {result.format}. No signature was treated as valid.
              </p>
            )}
          </div>
        )}
        {result && result.status !== 'unreadable' && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <VerificationTrail
              steps={result.checks}
              tool="message-signature"
              title={`${result.format ?? 'Signed message'} check`}
              limits={result.limits}
              fields={{
                format: result.format,
                address: address.trim(),
                addressType: result.addressType,
                recoveredAddress: result.recoveredAddress,
                recoveredPubkey: result.recoveredPubkey,
              }}
            />
            <p className={`flex items-center gap-1 text-[11px] font-semibold ${result.status === 'valid' ? 'text-mp-proof' : 'text-mp-wax'}`}>
              {result.status === 'valid' ? <CheckCircle2 size={11} aria-hidden="true" /> : <AlertTriangle size={11} aria-hidden="true" />}
              {result.status === 'valid' ? `${result.format} signature verifies` : 'Signature does not match this address'}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-mp-ink-tertiary">{result.note}</p>
            {result.recoveredPubkey && (
              <div className="mt-1.5">
                <FieldRow
                  label="Recovered key"
                  value={<span className="break-all font-mono text-[10px]">{result.recoveredPubkey}</span>}
                  copy={result.recoveredPubkey}
                />
                <FieldRow label="Format" value={result.format ?? 'unknown'} />
                <FieldRow label="Address type" value={result.addressType ?? 'unknown'} />
              </div>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
              A valid result means this exact message and signature recover or verify the key committed by this address.
              It is not a transaction signature, a payment receipt or proof that the signer still controls the address.
            </p>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

export { MessageSignatureTool }
