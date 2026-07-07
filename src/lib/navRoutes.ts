/** Shared overflow routes for mobile More nav — batch 12 item 298 */
export const MORE_ROUTES = [
  { to: '/simulator', key: 'nav.simulator' as const },
  { to: '/compare', key: 'nav.compare' as const },
  { to: '/vault', key: 'nav.vault' as const },
  { to: '/verify', key: 'nav.verify' as const },
  { to: '/blog', key: 'nav.blog' as const },
  { to: '/agents', key: 'nav.agents' as const },
  { to: '/apply', key: 'nav.apply' as const },
] as const

export const MORE_PATHS = MORE_ROUTES.map(r => r.to)