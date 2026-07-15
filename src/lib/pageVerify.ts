/** Canonical payload for “verify this page” — hashed on /verify */
export function buildPageVerifyPayload(pathname: string, buildId: string) {
  return { page: pathname, build: buildId, platform: 'MotoPass' }
}

/** Link to /verify with current route + BUILD context (pre-fills hash input). */
export function pageVerifyHref(pathname: string, buildId: string, hash?: string | null): string {
  const params = new URLSearchParams({ path: pathname, build: buildId })
  if (hash?.trim()) params.set('hash', hash.trim())
  return `/verify?${params.toString()}`
}

/** Extract a proof/hash from the current route search string when present. */
export function routeHashFromSearch(search: string): string | null {
  const params = new URLSearchParams(search)
  return params.get('hash') ?? params.get('proof') ?? null
}