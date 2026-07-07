/** Lazy route prefetch map — warms chunks on nav hover/focus (batch 19). */
const ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/PitchPage'),
  '/programs': () => import('../pages/ProgramsPage'),
  '/portfolio': () => import('../pages/PortfolioPage'),
  '/btcmap': () => import('../pages/BtcMapPage'),
  '/simulator': () => import('../pages/StackSimulatorPage'),
  '/compare': () => import('../pages/FinanceComparePage'),
  '/vault': () => import('../pages/VaultPage'),
  '/blog': () => import('../pages/BlogPage'),
  '/verify': () => import('../pages/VerifyPage'),
  '/agents': () => import('../pages/AgentsPage'),
  '/apply': () => import('../pages/ApplyPage'),
  '/register': () => import('../pages/RegisterPage'),
  '/dashboard': () => import('../pages/DashboardPage'),
  '/profile': () => import('../pages/ProfilePage'),
}

const prefetched = new Set<string>()

export function prefetchRoute(path: string) {
  const normalized = path.split('?')[0] || '/'
  if (prefetched.has(normalized)) return
  const loader = ROUTE_LOADERS[normalized]
  if (!loader) return
  prefetched.add(normalized)
  void loader()
}