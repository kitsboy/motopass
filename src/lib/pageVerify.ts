/** Canonical payload for “verify this page” — hashed on /verify */
export function buildPageVerifyPayload(pathname: string, buildId: string) {
  return { page: pathname, build: buildId, platform: 'MotoPass' }
}

/** Link to /verify with current route + BUILD context (pre-fills hash input). */
export function pageVerifyHref(pathname: string, buildId: string): string {
  const params = new URLSearchParams({ path: pathname, build: buildId })
  return `/verify?${params.toString()}`
}