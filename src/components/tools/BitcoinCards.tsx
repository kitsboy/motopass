import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Landmark, Wallet } from 'lucide-react'
import { inspectBitcoinInput } from '../../lib/bitcoinInspect'
import { decodeSilentPaymentAddress, deriveSilentPaymentOutput } from '../../lib/silentPayments'
import { formatSatsExact } from '../../lib/satsAnchor'
import { ClearButton, FieldRow, ToolCard, VerificationTrail, buttonClass, inputClass, useToolIntake } from './toolsShared'
import { QrScanButton } from './QrScanner'

function AddressPsbtTool() {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof inspectBitcoinInput>> | null>(null)
  const [busy, setBusy] = useState(false)

  useToolIntake('address-psbt', setRaw)

  const run = async () => {
    setBusy(true)
    setResult(await inspectBitcoinInput(raw))
    setBusy(false)
  }

  return (
    <ToolCard icon={<Landmark size={11} aria-hidden="true" />} eyebrow="BASE LAYER" title="Read an address or PSBT" toolId="address-psbt">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Derives the scriptPubKey from a bech32, bech32m or Base58Check address, or reads a base64/hex PSBT. Supported
        ECDSA (including P2SH multisig) and Schnorr (key-path and taproot script-path) signatures are verified against the
        unsigned transaction; unsupported inputs are labelled, not guessed. Nothing is signed or broadcast.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="address-psbt-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Address or PSBT
        </label>
        <textarea
          id="address-psbt-input"
          value={raw}
          onChange={event => setRaw(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void run()
          }}
          rows={3}
          spellCheck={false}
          placeholder="bc1… / 1… / cHNidP…"
          className={inputClass}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={busy || !raw.trim()} className={buttonClass}>
            {busy ? 'Reading…' : 'Inspect'}
          </button>
          <QrScanButton onScan={setRaw} />
          <ClearButton
            onClick={() => {
              setRaw('')
              setResult(null)
            }}
            disabled={!raw && !result}
          />
        </div>
      </form>
      <div aria-live="polite" className="mt-3">
        {result?.result.ok === false && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {result.result.error}
          </p>
        )}
        {result?.kind === 'address' && result.result.ok && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-mp-proof">
              <CheckCircle2 size={11} aria-hidden="true" /> Address checksum valid
            </p>
            <div className="mt-1.5">
              <FieldRow label="Network" value={result.result.address.network} />
              <FieldRow label="Type" value={result.result.address.type} />
              <FieldRow
                label="scriptPubKey"
                value={<span className="font-mono text-[10px]">{result.result.address.scriptPubKey}</span>}
                copy={result.result.address.scriptPubKey}
              />
              <FieldRow
                label="Program"
                value={<span className="font-mono text-[10px]">{result.result.address.program ?? '—'}</span>}
                copy={result.result.address.program ?? undefined}
              />
            </div>
          </div>
        )}
        {result?.kind === 'psbt' && result.result.ok && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <VerificationTrail
              steps={[
                { label: 'structure', state: 'pass' },
                {
                  label: 'signatures',
                  state:
                    result.result.psbt.signaturesInvalid > 0
                      ? 'fail'
                      : result.result.psbt.signaturesValid > 0
                        ? 'pass'
                        : 'unknown',
                },
                { label: 'broadcast', state: 'unknown' },
              ]}
              tool="psbt"
              title="PSBT signature check"
              limits={[
                'Only SIGHASH_ALL ECDSA and SIGHASH_DEFAULT/SIGHASH_ALL taproot signatures are verified.',
                'P2SH-P2WSH and P2SH multisig require the redeem/witness scripts to be present.',
                'A valid signature does not prove the transaction was broadcast or confirmed.',
                'PSBTs do not encode a network, so addresses are shown with Bitcoin mainnet prefixes.',
              ]}
              fields={{
                inputs: result.result.psbt.inputs,
                outputs: result.result.psbt.outputs,
                valid: result.result.psbt.signaturesValid,
                invalid: result.result.psbt.signaturesInvalid,
                unchecked: result.result.psbt.signaturesUnsupported,
                feeSats: result.result.psbt.feeSats,
              }}
            />
            <p className="text-[10px] font-semibold text-mp-proof">PSBT structure read · signatures checked where supported</p>
            <div className="mt-1.5">
              <FieldRow label="Version" value={result.result.psbt.version} />
              <FieldRow label="Inputs / outputs" value={`${result.result.psbt.inputs} / ${result.result.psbt.outputs}`} />
              <FieldRow label="Partial signatures" value={result.result.psbt.partialSigs} />
              <FieldRow label="Taproot signatures" value={result.result.psbt.tapSigs} />
              <FieldRow
                label="Verification"
                value={`${result.result.psbt.signaturesValid} valid · ${result.result.psbt.signaturesInvalid} invalid · ${result.result.psbt.signaturesUnsupported} unchecked`}
              />
              <FieldRow
                label="Input value"
                value={result.result.psbt.inputSats == null ? 'incomplete witness UTXOs' : formatSatsExact(result.result.psbt.inputSats)}
              />
              <FieldRow
                label="Output value"
                value={result.result.psbt.outputSats == null ? 'unreadable' : formatSatsExact(result.result.psbt.outputSats)}
              />
              <FieldRow
                label="Fee"
                value={result.result.psbt.feeSats == null ? 'not computable from witness UTXOs' : formatSatsExact(result.result.psbt.feeSats)}
              />
            </div>
            <div className="mt-2 space-y-2">
              {result.result.psbt.inputDetails.map((input, index) => (
                <div key={`input-${index}`} className="rounded-mp-sm border border-mp-border-subtle/60 p-1.5">
                  <p className="font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">Input {index}</p>
                  <FieldRow label="Prev txid" value={<span className="break-all font-mono text-[10px]">{input.prevTxid ?? '—'}</span>} />
                  <FieldRow label="Prev vout" value={input.vout ?? '—'} />
                  <FieldRow label="Type" value={input.scriptType} />
                  <FieldRow
                    label="Address"
                    value={<span className="font-mono text-[10px]">{input.address ?? 'not in witness UTXO'}</span>}
                    copy={input.address ?? undefined}
                  />
                  {input.nonWitnessUtxo && <FieldRow label="Non-witness UTXO" value="present" />}
                  {input.signatures.map((signature, signatureIndex) => (
                    <p
                      key={`sig-${index}-${signatureIndex}`}
                      className={`mt-1 text-[10px] leading-relaxed ${signature.status === 'invalid' ? 'text-mp-wax' : signature.status === 'valid' ? 'text-mp-proof' : 'text-mp-ink-tertiary'}`}
                    >
                      {signature.scheme.toUpperCase()} {signature.status}: {signature.note}
                    </p>
                  ))}
                </div>
              ))}
              {result.result.psbt.outputDetails.map((output, index) => (
                <div key={`output-${index}`} className="rounded-mp-sm border border-mp-border-subtle/60 p-1.5">
                  <p className="font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">Output {index}</p>
                  <FieldRow
                    label="Value"
                    value={output.amountSats == null ? 'unreadable' : formatSatsExact(output.amountSats)}
                  />
                  <FieldRow label="Type" value={output.scriptType} />
                  <FieldRow
                    label="Address"
                    value={<span className="font-mono text-[10px]">{output.address ?? 'custom script'}</span>}
                    copy={output.address ?? undefined}
                  />
                  {(output.possibleChange || output.addressReuse || output.dust) && (
                    <p className="mt-1 text-[10px] leading-relaxed text-mp-wax">
                      {output.possibleChange ? 'Possible change. ' : ''}
                      {output.addressReuse && !output.possibleChange ? 'Address reuse. ' : ''}
                      {output.dust ? 'Below dust threshold. ' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
              PSBTs do not encode a network, so these addresses use Bitcoin mainnet prefixes.
            </p>
            {result.result.psbt.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-mp-wax">
                {result.result.psbt.warnings.map(warning => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </ToolCard>
  )
}

function SilentPaymentsTool() {
  const [address, setAddress] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [txid, setTxid] = useState('')
  const [vout, setVout] = useState('0')
  const [decoded, setDecoded] = useState<Awaited<ReturnType<typeof decodeSilentPaymentAddress>> | null>(null)
  const [derived, setDerived] = useState<Awaited<ReturnType<typeof deriveSilentPaymentOutput>> | null>(null)

  useToolIntake('silent-payments', setAddress)

  const run = async () => {
    const next = decodeSilentPaymentAddress(address)
    setDecoded(next)
    if (!next.ok || !privateKey.trim()) {
      setDerived(null)
      return
    }
    setDerived(
      await deriveSilentPaymentOutput({
        address,
        inputPrivateKey: privateKey,
        txid,
        vout: Number(vout),
      }),
    )
  }

  return (
    <ToolCard icon={<Wallet size={11} aria-hidden="true" />} eyebrow="BIP-352" title="Read a Silent Payment address" toolId="silent-payments">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Decodes an <span className="font-mono">sp1…</span> address into its scan and spend keys. An optional input key derives one
        one-time P2TR output for a specific outpoint; it is used in this tab and never stored. This does not scan the chain.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="sp-address" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Silent Payment address
        </label>
        <input
          id="sp-address"
          value={address}
          onChange={event => setAddress(event.target.value)}
          spellCheck={false}
          placeholder="sp1… or tsp1…"
          className={inputClass}
        />
        <label htmlFor="sp-key" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Input private key (hex, optional)
        </label>
        <input
          id="sp-key"
          type="password"
          value={privateKey}
          onChange={event => setPrivateKey(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="kept in this tab only"
          className={inputClass}
        />
        <div className="grid grid-cols-[1fr_90px] gap-2">
          <div>
            <label htmlFor="sp-txid" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
              Smallest input txid
            </label>
            <input id="sp-txid" value={txid} onChange={event => setTxid(event.target.value)} spellCheck={false} placeholder="64 hex" className={inputClass} />
          </div>
          <div>
            <label htmlFor="sp-vout" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
              vout
            </label>
            <input id="sp-vout" value={vout} onChange={event => setVout(event.target.value)} inputMode="numeric" className={inputClass} />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={!address.trim()} className={buttonClass}>
            Read address
          </button>
          <QrScanButton onScan={setAddress} />
          <ClearButton
            onClick={() => {
              setAddress('')
              setPrivateKey('')
              setTxid('')
              setVout('0')
              setDecoded(null)
              setDerived(null)
            }}
            disabled={!address && !privateKey && !txid && !decoded}
          />
        </div>
      </form>
      <div aria-live="polite" className="mt-3">
        {decoded && !decoded.ok && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {decoded.error}
          </p>
        )}
        {decoded?.ok && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <VerificationTrail
              steps={[
                { label: 'bech32m', state: 'pass' },
                { label: 'keys', state: 'pass' },
                { label: 'output', state: derived?.ok ? 'pass' : derived ? 'fail' : 'unknown' },
                { label: 'chain scan', state: 'unknown' },
              ]}
              tool="silent-payments"
              title="Silent Payment address check"
              limits={[
                'A derived output is sender-side arithmetic for one outpoint, not a chain scan.',
                'The receiver must scan with the scan private key to find the payment.',
                'The optional input key is never stored in this receipt.',
              ]}
              fields={{
                network: decoded.address.network,
                scanPubkey: decoded.address.scanPubkey,
                spendPubkey: decoded.address.spendPubkey,
                outputAddress: derived?.ok ? derived.address : null,
              }}
            />
            <p className="text-[10px] font-semibold text-mp-proof">Address decodes · version 0</p>
            <div className="mt-1.5">
              <FieldRow label="Network" value={decoded.address.network} />
              <FieldRow label="Scan key" value={<span className="break-all font-mono text-[10px]">{decoded.address.scanPubkey}</span>} copy={decoded.address.scanPubkey} />
              <FieldRow label="Spend key" value={<span className="break-all font-mono text-[10px]">{decoded.address.spendPubkey}</span>} copy={decoded.address.spendPubkey} />
            </div>
            {derived && !derived.ok && <p className="mt-2 text-[10px] text-mp-wax">{derived.error}</p>}
            {derived?.ok && (
              <div className="mt-2 rounded-mp-sm border border-mp-border-subtle/60 p-1.5">
                <FieldRow label="Output key" value={<span className="break-all font-mono text-[10px]">{derived.xOnlyPubkey}</span>} copy={derived.xOnlyPubkey} />
                <FieldRow label="scriptPubKey" value={<span className="break-all font-mono text-[10px]">{derived.scriptPubKey}</span>} copy={derived.scriptPubKey} />
                <FieldRow label="One-time address" value={<span className="break-all font-mono text-[10px]">{derived.address}</span>} copy={derived.address} />
                <FieldRow label="Input hash" value={<span className="break-all font-mono text-[10px]">{derived.inputHash}</span>} />
              </div>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
              A derived output proves this address and outpoint produce that script. It does not prove the receiver scanned it or
              that a payment was broadcast. Reusing an input key across wallets can break the sender-side privacy assumption.
            </p>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

export { AddressPsbtTool, SilentPaymentsTool }
