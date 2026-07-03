/** Infrastructure donation addresses — Give A Bit / MotoPass server costs */

export const SERVER_COSTS = {
  layer1: {
    label: 'Bitcoin · Layer 1',
    hint: 'On-chain',
    address: 'bc1qhm5ndfjhqxdk3cx0pngyps4f5nnwdckulmge6c8keyf2pk0neqtshjn8ad',
    qrPayload: 'bitcoin:bc1qhm5ndfjhqxdk3cx0pngyps4f5nnwdckulmge6c8keyf2pk0neqtshjn8ad',
    description:
      'On-chain donations help cover Cloudflare Pages, research hosting, and Satohash stamping infrastructure. Confirmations typically 10–60 minutes.',
  },
  layer2: {
    label: 'Lightning · Layer 2',
    hint: 'Instant sats',
    address: 'motopass-server@giveabit.io',
    qrPayload: 'lightning:motopass-server@giveabit.io',
    temp: true,
    description:
      'TEMP Lightning address for server-cost tips — live BOLT11 coming soon. Scan with any Lightning wallet that supports Lightning Addresses.',
  },
} as const