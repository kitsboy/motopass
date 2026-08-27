/** Infrastructure donation addresses — Give A Bit / MotoPass server costs */

export const SERVER_COSTS = {
  layer1: {
    label: 'Bitcoin · Layer 1',
    hint: 'On-chain',
    address: 'bc1pucgsh9g0vyzc9zn8e4up5d08vmk56rsk7em7gwzcv79hk0dkulaslpscgy',
    qrPayload: 'bitcoin:bc1pucgsh9g0vyzc9zn8e4up5d08vmk56rsk7em7gwzcv79hk0dkulaslpscgy',
    description:
      'On-chain donations help cover Cloudflare Pages, research hosting, and Satohash stamping infrastructure. Confirmations typically 10–60 minutes. Breez Spark deposit (Config A).',
  },
  layer2: {
    label: 'Lightning · Layer 2',
    hint: 'Instant sats',
    address: 'motopass@breez.tips',
    qrPayload: 'lightning:motopass@breez.tips',
    description:
      'Lightning Address via Breez Spark (non-custodial). Scan with any Lightning wallet that supports Lightning Addresses.',
  },
} as const