import { BtcDualPrice } from './BtcDualPrice'

export function CompareMoneyCell({ usd }: { usd: number }) {
  return <BtcDualPrice usd={usd} size="xs" layout="stack" className="items-end" />
}