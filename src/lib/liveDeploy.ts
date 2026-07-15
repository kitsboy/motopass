/** Production origin for deploy-health checks */
export const LIVE_ORIGIN = 'https://motopass.giveabit.io'

export type LiveIndexParse = {
  buildSalt: string | null
  mainBundlePath: string | null
}

/** Strip to vite BUILD_SALT form (e.g. 2026.07.15-48 → 20260715-48). */
export function buildIdToSalt(buildId: string): string {
  return buildId.replace(/[^a-zA-Z0-9-]/g, '')
}

/** e.g. 20260715-48 → 2026.07.15-48 */
export function saltToBuildId(salt: string): string | null {
  const m = salt.match(/^(\d{4})(\d{2})(\d{2})-(\d+)$/)
  if (!m) return null
  return `${m[1]}.${m[2]}.${m[3]}-${m[4]}`
}

export function parseLiveIndexHtml(html: string): LiveIndexParse {
  const jsMatch =
    html.match(/import\("(\/assets\/index-[^"]+\.js)/) ??
    html.match(/src="(\/assets\/index-[^"]+\.js)/)
  const mainBundlePath = jsMatch?.[1] ?? null
  const saltFromQuery = html.match(/\?b=([a-zA-Z0-9-]+)/)?.[1]
  const saltFromFilename = mainBundlePath?.match(/-(\d{8}-\d+)\.js$/)?.[1]
  const buildSalt = saltFromQuery ?? saltFromFilename ?? null
  return { buildSalt, mainBundlePath }
}