import type { DecisionPack, RouteLine } from './decisionPack'

/** Announced routes stay out of the mix until the visitor asks for them. */
export function visibleRoutes(pack: DecisionPack, includeAnnounced: boolean): RouteLine[] {
  if (includeAnnounced) return pack.routes
  return pack.routes.filter(route => route.status !== 'announced')
}

export function sumRouteMins(routes: RouteLine[]): number {
  return routes.reduce((sum, route) => sum + (Number.isFinite(route.minUsd) ? route.minUsd : 0), 0)
}

/** Family dollars that are actually written down. Included relatives with no price are not added. */
export function sumKnownFamily(routes: RouteLine[]): number {
  return routes.reduce((sum, route) => {
    const family = route.family.reduce((inner, price) => inner + (price.usd ?? 0), 0)
    return sum + family
  }, 0)
}
