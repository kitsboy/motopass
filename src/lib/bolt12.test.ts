import { describe, expect, it } from 'vitest'
import { parseBolt12Offer, offerDeepLink, shortOffer, decodeBolt12 } from './bolt12'
import { BECH32_CHARSET, bytesToWords } from './bech32'

/** Official offer vectors from lightning/bolts bolt12/offers-test.json. */
const OFFER_NODE_ONLY = 'lno1zcss9mk8y3wkklfvevcrszlmu23kfrxh49px20665dqwmn4p72pksese'
const OFFER_DESCRIPTION =
  'lno1pgx9getnwss8vetrw3hhyuckyypwa3eyt44h6txtxquqh7lz5djge4afgfjn7k4rgrkuag0jsd5xvxg'

/** Official invoice_request signature vector from bolt12/signature-test.json. */
const INVOICE_REQUEST =
  'lnr1qqyqqqqqqqqqqqqqqcp4256ypqqkgzshgysy6ct5dpjk6ct5d93kzmpq23ex2ct5d9ek293pqthvwfzadd7jejes8q9lhc4rvjxd022zv5l44g6qah82ru5rdpnpjkppqvjx204vgdzgsqpvcp4mldl3plscny0rt707gvpdh6ndydfacz43euzqhrurageg3n7kafgsek6gz3e9w52parv8gs2hlxzk95tzeswywffxlkeyhml0hh46kndmwf4m6xma3tkq2lu04qz3slje2rfthc89vss'

function encodeNoChecksum(hrp: string, bytes: Uint8Array): string {
  return `${hrp}1${bytesToWords(bytes).map(word => BECH32_CHARSET[word]).join('')}`
}

function tlv(type: number, value: Uint8Array): Uint8Array {
  return Uint8Array.from([type, value.length, ...value])
}

describe('decodeBolt12 offers', () => {
  it('decodes an unsigned offer and says there is no signature to verify', async () => {
    const result = await decodeBolt12(OFFER_NODE_ONLY)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.decoded.kind).toBe('offer')
    expect(result.decoded.fields.map(field => field.type)).toEqual([22])
    expect(result.decoded.nodeId).toBe(
      '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619',
    )
    expect(result.decoded.signatureCheck).toBe('unsigned')
    expect(result.decoded.signatureNote).toContain('offers are unsigned by design')
  })

  it('reads description and node id from the second official vector', async () => {
    const result = await decodeBolt12(OFFER_DESCRIPTION)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.decoded.description).toBe('Test vectors')
    expect(result.decoded.nodeId).toHaveLength(66)
    expect(result.decoded.signatureCheck).toBe('unsigned')
  })

  it('refuses a signature on an offer as malformed', async () => {
    const bytes = Uint8Array.from([
      ...tlv(22, new Uint8Array(33).fill(2)),
      ...tlv(240, new Uint8Array(64).fill(1)),
    ])
    const result = await decodeBolt12(encodeNoChecksum('lno', bytes))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.decoded.signatureCheck).toBe('invalid')
    expect(result.decoded.signatureNote).toContain('must not carry a signature')
  })
})

describe('decodeBolt12 signatures', () => {
  it('verifies the official invoice_request signature and Merkle root', async () => {
    const result = await decodeBolt12(INVOICE_REQUEST)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.decoded.kind).toBe('invoice_request')
    expect(result.decoded.signatureTag).toBe('lightninginvoice_requestsignature')
    expect(result.decoded.merkleRoot).toBe('608407c18ad9a94d9ea2bcdbe170b6c20c462a7833a197621c916f78cf18e624')
    expect(result.decoded.signingKey).toBe(
      '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c',
    )
    expect(result.decoded.signatureCheck).toBe('valid')
  })

  it('marks a signature that does not match the key as invalid', async () => {
    const payer = new Uint8Array(33)
    payer[0] = 2
    payer[32] = 1
    const bytes = Uint8Array.from([...tlv(88, payer), ...tlv(240, new Uint8Array(64).fill(5))])
    const result = await decodeBolt12(encodeNoChecksum('lnr', bytes))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.decoded.signatureCheck).toBe('invalid')
    expect(result.decoded.signatureNote).toContain('does not verify')
  })

  it('says unavailable when the message has no key to check against', async () => {
    const bytes = tlv(240, new Uint8Array(64).fill(5))
    const result = await decodeBolt12(encodeNoChecksum('lni', bytes))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.decoded.signatureCheck).toBe('unavailable')
    expect(result.decoded.signatureNote).toContain('no invoice_node_id')
  })
})

describe('BOLT12 structure', () => {
  it('rejects mixed case, unknown prefixes, out-of-order TLVs and bad padding', async () => {
    expect((await decodeBolt12('LNO1zcss9mk8y3wkklfvevcrszlmu23kfrxh49px20665dqwmn4p72pksese')).ok).toBe(false)
    expect(await decodeBolt12('lnx1qqqq')).toEqual({
      ok: false,
      error: 'Unknown BOLT12 prefix — expected lno, lnr or lni',
    })
    const outOfOrder = Uint8Array.from([...tlv(22, new Uint8Array(33).fill(2)), ...tlv(10, new Uint8Array([65]))])
    expect(await decodeBolt12(encodeNoChecksum('lno', outOfOrder))).toEqual({
      ok: false,
      error: 'TLV fields are not in ascending order',
    })
    expect(await decodeBolt12('lno1zcss9mk8y3wkklfvevcrszlmu23kfrxh49px20665dqwmn4p72pkseseq')).toEqual({
      ok: false,
      error: 'BOLT12 data does not pad to whole bytes',
    })
  })

  it('accepts the + line-splitting BOLT12 allows', async () => {
    const split = `${OFFER_NODE_ONLY.slice(0, 20)}+\n${OFFER_NODE_ONLY.slice(20)}`
    const result = await decodeBolt12(split)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.decoded.nodeId).toHaveLength(66)
  })
})

describe('parseBolt12Offer', () => {
  it('validates the TLV stream without a bech32 checksum and lowercases the offer', () => {
    const parsed = parseBolt12Offer(OFFER_NODE_ONLY.toUpperCase())
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.offer.hrp).toBe('lno')
      expect(parsed.offer.offer).toBe(OFFER_NODE_ONLY)
    }
  })

  it('refuses BOLT11, an edited offer and empty input', () => {
    expect(parseBolt12Offer('lnbc1qqqq')).toEqual({ ok: false, error: 'Not a BOLT12 offer — expected lno1…' })
    expect(parseBolt12Offer('')).toEqual({ ok: false, error: 'No offer configured' })
    expect(parseBolt12Offer(`${OFFER_NODE_ONLY}q`)).toMatchObject({ ok: false })
  })

  it('only deep-links a structurally valid offer', () => {
    expect(offerDeepLink(OFFER_NODE_ONLY)).toBe(`lightning:${OFFER_NODE_ONLY}`)
    expect(offerDeepLink('lno1garbage')).toBeNull()
  })

  it('shortens for display without pretending the short form is payable', () => {
    const long = `${OFFER_NODE_ONLY}qqqqqq`
    expect(shortOffer(long)).toBe(`${long.slice(0, 10)}…${long.slice(-6)}`)
    expect(shortOffer('lno1short')).toBe('lno1short')
    expect(shortOffer('lno1')).toBe('lno1')
  })
})
