import type { LucideIcon } from 'lucide-react'
import { LayoutGrid, Shield, TrendingDown } from 'lucide-react'
import type { TranslationKey } from '../i18n/translations'

export type NavRoute = {
  to: string
  key: TranslationKey
  apply?: true
  end?: boolean
}

/** Canonical main nav — Programs · Vault · Distressed · BTC Map · Simulator · Agents · Apply */
export const MAIN_NAV_ROUTES: readonly NavRoute[] = [
  { to: '/programs', key: 'nav.programs' },
  { to: '/vault', key: 'nav.vault' },
  { to: '/distressed', key: 'nav.distressed' },
  { to: '/btcmap', key: 'nav.btcmap' },
  { to: '/simulator', key: 'nav.simulator' },
  { to: '/agents', key: 'nav.agents' },
  { to: '/apply', key: 'nav.apply', apply: true },
] as const

export const MAIN_NAV_PATHS = MAIN_NAV_ROUTES.map(r => r.to)

/** Secondary routes — More sheet + footer only (not primary chrome) */
export const OVERFLOW_NAV_ROUTES: readonly NavRoute[] = [
  { to: '/compare', key: 'nav.compare' },
  { to: '/portfolio', key: 'nav.portfolio' },
  { to: '/verify', key: 'nav.verify' },
] as const

/** Primary mobile bottom tabs */
export const MOBILE_TAB_ROUTES: readonly { to: string; key: TranslationKey; icon: LucideIcon }[] = [
  { to: '/programs', key: 'nav.programs', icon: LayoutGrid },
  { to: '/vault', key: 'nav.vault', icon: Shield },
  { to: '/distressed', key: 'nav.distressed', icon: TrendingDown },
] as const

/** Overflow routes in the mobile More sheet (excludes bottom-tab + Apply) */
export const MORE_ROUTES: readonly NavRoute[] = [
  ...MAIN_NAV_ROUTES.filter(
    r => !r.apply && !MOBILE_TAB_ROUTES.some(t => t.to === r.to),
  ),
  ...OVERFLOW_NAV_ROUTES,
]

export const MORE_PATHS = MORE_ROUTES.map(r => r.to)

export function navPillClass(isActive: boolean): string {
  return isActive ? 'nav-pill nav-pill-active' : 'nav-pill'
}

export function navTileClass(isActive: boolean): string {
  return `nav-mobile-tile ${isActive ? 'nav-mobile-tile-active' : ''}`
}

export function navTabClass(isActive: boolean): string {
  return `nav-tab ${isActive ? 'nav-tab-active' : ''}`
}

export function eliteNavLinkClass(isActive: boolean): string {
  return `elite-nav-link${isActive ? ' elite-nav-link--active' : ''}`
}

export function eliteDrawerLinkClass(isActive: boolean): string {
  return `elite-drawer-link${isActive ? ' elite-drawer-link--active' : ''}`
}

export function isNavActive(pathname: string, to: string, end?: boolean): boolean {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}