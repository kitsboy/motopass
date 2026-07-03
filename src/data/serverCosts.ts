/** Infrastructure donation addresses — Give A Bit / MotoPass server costs */

export const SERVER_COSTS = {
  layer1: {
    label: 'Bitcoin · Layer 1',
    hint: 'On-chain',
    address: 'bc1qgiveabitmotopass0servercostsl1donate2026',
    description:
      'On-chain donations help cover Cloudflare Pages, research hosting, and Satohash stamping infrastructure. Confirmations typically 10–60 minutes.',
  },
  layer2: {
    label: 'Lightning · Layer 2',
    hint: 'Instant sats',
    address: 'lnbc1motopassgiveabitservercosts...demo@relay.giveabit.io',
    description:
      'Lightning tips settle instantly — ideal for recurring server-cost support. Invoice refreshed periodically; contact hello@giveabit.io for a live BOLT11.',
  },
} as const