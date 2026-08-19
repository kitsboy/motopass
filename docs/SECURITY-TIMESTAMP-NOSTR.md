# Security — Satohash timestamps and Nostr attestations

**BUILD:** 2026.08.18-68  
**Status:** Binding for `/verify`, `/vault`, and any code that stamps or announces a hash.

A stranger with a Bitcoin node + OpenTimestamps can verify a claim. A Nostr client cannot.

---

## 1. Artifact taxonomy

```
preimage  →  SHA-256  →  Satohash stamp id  →  .ots  →  Bitcoin block
                                              ↘ optional kind 30078 attestation (gossip)
```

| Artifact | Role |
|----------|------|
| Preimage | Private unless the user chose to publish it. Never store prefixes. |
| SHA-256 | Fingerprint. Format-valid ≠ stamped. |
| Satohash stamp | Family API receipt. Pending until `confirmed` / `anchored` + block height. |
| `.ots` | OpenTimestamps proof. Browser check is structural only. |
| Bitcoin block | Independent time. |
| Nostr kind `30078` | Signed *claim* by a pubkey. **Not a timestamp.** |

## 2. Non-goals

- A Nostr event is not a Bitcoin timestamp.
- `proof-status=verified` on a tag is not a timestamp.
- A green badge from a URL regex is not a timestamp.
- A Satohash stamp does not make legal text or tax advice true (`BITCOIN-VERIFICATION.md` §7).

## 3. Kind / tag contract

Kind `30078` (parameterized replaceable).

| Tag | Rule |
|-----|------|
| `d` | `motopass-stamp-<64hex>` or `motopass-program-<slug>` |
| `hash` | Required for announce. 64 hex. |
| `satohash` | Optional. `https:` only, allowlisted origin. |
| `stamp-id` | `[a-zA-Z0-9._-]{1,128}` |
| `block` | Integer 0…20_000_000 |
| `ots` | Relative `/proofs/*.ots` only |
| `proof-status` | `demo` \| `unverified` \| `pending` \| `confirmed` — never infer “verified” from a URL |

Content is JSON we built. No raw user notes, names, or preimage text.

## 4. Allowlists

Satohash origins: `VITE_SATOHASH_URL`, `VITE_SATOHASH_API_URL`, plus `https://satohash.io` and `https://satohash.giveabit.io`. A bad env origin is a security incident — it also expands the Nostr URL allowlist.

Relays: `wss://` only. Default set in `src/lib/nostr.ts`. `VITE_NOSTR_RELAY` must stay `wss:`.

OTS paths: `/proofs/<safe>.ots`. No scheme, no `..`.

Never put `proof_url` or `ots_path` in `href` until `isAllowedSatohashUrl` / `sanitizeOtsPath` pass.

## 5. NIP-07 trusted computing base

We sign only templates we built. After `signEvent`:

1. Type-check `id`, `sig`, `pubkey`, `tags`, `content`.
2. Refuse publish if kind / `created_at` / tags / content differ from the template.
3. Refuse publish if `id !== getEventHash(signed)` or Schnorr `verifyEvent` fails.
4. Recovery `rejected` — do not send the signer’s payload.

The extension can still show the user a different prompt. Documented TCB.

## 6. Replaceable events

Same pubkey + kind + `d` → newest `created_at` wins. Indexers must query `(pubkey, d)`, never `d` alone. There is no official MotoPass operator npub yet. Public relays can drop or serve stale replaceables. `1/4 relays accepted` does not upgrade trust.

## 7. Verifier algorithm

A UI may say **Bitcoin-verified** only if all of:

1. Recompute SHA-256 of the stated preimage (or confirm the user supplied the hash).
2. `GET` Satohash stamp: hash equality + terminal status + block height **or**
3. Independent `ots verify` against a calendar / Bitcoin.

Negative cases that must stay *unverified*: demo/stub URL, hash-format-only, pending stamp, NIP-07 swapped body, health ping with no stamp.

Implementation: `src/lib/timestampSecurity.ts`, `src/lib/nostrTimestamp.ts`. Tests: `timestampSecurity.test.ts`, `nostrTimestamp.test.ts`, `programAdapter.test.ts` (recorded ≠ verified).

## 8. PII / preimage

- Verify history stores **hash only** — no first-48-char labels.
- Announce never includes the textarea / application notes.
- Apply/Profile hashes remain local; do not announce those payloads.
- Public-announce is opt-in (button). Copy warns: hash + Satohash URL + block only.

## 9. Demo / seed data

Stub URLs (`aaaa`, `placeholder`, `stub`, `demo`, `0000000`) → badge **Demo Anchor**. Allowlisted real-looking URL → **Proof on file**, never **Bitcoin-verified**. Vault announce tags `demo` or `unverified`.

## 10. URL and fetch

- `satohashVerifyUrl` / `stampGuideUrl` / `proofVerifyUrl` return `''` unless hash/id + origin pass.
- `getStamp` rejects ids that fail `sanitizeStampId`.
- No Satohash API keys from the browser.

## 11. Recovery

`announceTimestampOnNostr` never throws.

| Mode | Meaning |
|------|---------|
| `published` | ≥1 relay accepted. Keep event id. |
| `signed-unpublished` | Signed; relays missed. JSON in UI + `sessionStorage`. |
| `stub` | No NIP-07. Unsigned JSON shown + copyable. |
| `rejected` | Allowlist fail or signer swapped payload. Do not publish. |

## 12. Attack vectors (standing)

| Vector | Control |
|--------|---------|
| Spoofed Nostr as proof | Gossip vs proof; badges honest |
| NIP-07 payload swap | Template match before publish |
| `javascript:` / open redirect | Allowlisted `href` only |
| Preimage leak | No history labels; no notes in events |
| Demo as verified | `recorded` / `demo` / never URL→verified |
| Replaceable overwrite | Document consume-by-pubkey |
| XSS via event JSON | React text + `<pre>` |
| Bad `VITE_*` fetch | HTTPS allowlist on links; sanitize stamp id |
| Lost stub | Render JSON + copy + sessionStorage |

## 13. Incident

If an operator nsec leaks: rotate, publish a newer 30078 with the same `d` only after a new Satohash stamp, and treat old events as gossip. Revoke stamp ids on the Satohash side if the API supports it.

---

Cross-references: [BITCOIN-VERIFICATION.md](./BITCOIN-VERIFICATION.md) · `src/lib/timestampSecurity.ts` · `src/lib/nostrTimestamp.ts`
