# Bitcoin tools — fixture and regression policy

Every tool that makes a proof claim must have a reproducible fixture and a
regression check. A new claim cannot ship on a self-generated round trip alone:
use a published specification vector or a captured live artifact, and say which
one in the table below. A format that cannot be checked must stay labelled
`unchecked`, not be promoted to `pass`.

`npm run tools:check` runs in CI and fails when a tool card is added without a
row here, or when a row loses its provenance label.

| Tool id | Claim checked | Fixture provenance | Regression |
|---|---|---|---|
| `bolt11` | bech32 checksum, network, amount, expiry, fields | Deterministic fixtures in `src/lib/bolt11.test.ts` | checksum, amount modes, malformed input |
| `bolt11-signature` | ECDSA payee-key recovery and `n` match | Deterministic recovery fixture in `src/lib/bolt11Signature.test.ts` | valid, mismatch, unreadable |
| `bolt12` | BOLT12 TLV structure and BIP-340 message signature | Published BOLT12 invoice-request vector in `src/lib/bolt12.test.ts` | offer unsigned, request signature, malformed TLV |
| `bolt12-request` | request construction, amount/quantity constraints, response signatures | Deterministic request fixture in `src/lib/bolt12Request.test.ts` | amount, quantity, response mismatch |
| `preimage` | SHA-256 preimage relation only | Deterministic hash vector in `src/lib/preimage.test.ts` | match, mismatch, malformed hex |
| `payment-evidence` | Cross-links invoice, preimage, zap receipt and signed message | Published BIP-137/BIP-322 vectors plus deterministic NIP-57 and invoice fixtures in `src/lib/paymentEvidence.test.ts` | invoice only, preimage mismatch, zap hash/amount mismatch, malformed bundle |
| `receipt` | NIP-57 zap receipt structure and signature | Deterministic NIP-57 fixture in `src/lib/tipReceipt.test.ts` | signature, amount, malformed |
| `lnurl` | LUD-16/LUD-01 metadata and optional HTTPS fetch | Deterministic parser fixture; live fetch is opt-in in `src/lib/lnurlInspect.test.ts` | malformed metadata, network request only on action |
| `zap` | NIP-57 zap request/receipt linkage | Deterministic fixture in `src/lib/zapReceipt.test.ts` | signature, amount, event linkage |
| `nip05` | domain JSON mapping and local continuity pin | Deterministic resolver fixture; live domain lookup is opt-in in `src/lib/nip05Pin.test.ts` | rotation, blocked storage, malformed handle |
| `nip17` | kind-1059/21059 wrapper, seal and rumor | Deterministic NIP-59 fixture in `src/lib/nip17.test.ts` | signature, recipients, future timestamp, tagged seal |
| `address-psbt` | address checksum and supported PSBT signatures | Published BIP-143/BIP-341 vectors plus deterministic fixtures in `src/lib/psbtAdvanced.test.ts` | P2SH multisig, tapscript, wrong leaf, unsupported |
| `message-signature` | BIP-137 key recovery and BIP-322 simple P2WPKH/P2TR binding | Published Bitcoin Core BIP-137 and BIP-322 basic vectors in `src/lib/messageSignature.test.ts` and `src/lib/bip322.test.ts` | valid, changed message, wrong address, full/P2WSH unsupported, malformed |
| `silent-payments` | BIP-352 address decode and sender-side output | Published BIP-352 vector in `src/lib/silentPayments.test.ts` | mainnet/testnet, invalid outpoint, bad checksum |

## Rules for the next verifier

1. Link the published BIP/BOLT/NIP section and the fixture file.
2. Add at least one invalid or mismatched fixture, not only a passing one.
3. Keep unsupported paths visible in the trail as `unchecked`.
4. Add a mobile regression path when the card has new input controls.
5. Record the exact command and result in the session handoff.
