import { BtcDualPrice } from './BtcDualPrice'

export function CompareMoneyCell({ usd }: { usd: number | null | undefined }) {
  if (usd == null) {
    return <span className="text-xs text-mp-ink-muted italic">not on file</span>
  }
  return <BtcDualPrice usd={usd} size="xs" layout="stack" className="items-end" />
}