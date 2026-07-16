export type BtcMapLayoutMode = 'split' | 'map' | 'list'

const PHONE_LANDSCAPE_MQ = '(max-width: 767px) and (orientation: landscape)'
const TABLET_LANDSCAPE_MQ = '(min-width: 768px) and (max-width: 1279px) and (orientation: landscape)'
const TABLET_PORTRAIT_MQ = '(min-width: 768px) and (max-width: 1279px) and (orientation: portrait)'

/** Default layout: split on landscape phone/tablet, list on portrait tablet (items 725, 789). */
export function defaultBtcMapLayout(): BtcMapLayoutMode {
  if (typeof window === 'undefined') return 'split'
  if (window.matchMedia(PHONE_LANDSCAPE_MQ).matches) return 'split'
  if (window.matchMedia(TABLET_LANDSCAPE_MQ).matches) return 'split'
  if (window.matchMedia(TABLET_PORTRAIT_MQ).matches) return 'list'
  return 'split'
}

export function isTabletLandscape(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(TABLET_LANDSCAPE_MQ).matches
}

export const BTC_MAP_PHONE_LANDSCAPE_MQ = PHONE_LANDSCAPE_MQ
export const BTC_MAP_TABLET_LANDSCAPE_MQ = TABLET_LANDSCAPE_MQ

/** True when split view should be forced (landscape phone or tablet). */
export function isForcedSplitLandscape(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia(PHONE_LANDSCAPE_MQ).matches || window.matchMedia(TABLET_LANDSCAPE_MQ).matches
  )
}