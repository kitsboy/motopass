/**
 * Parse build salt + main bundle path from production index.html.
 * Salt matches vite BUILD_SALT (BUILD_ID with non-alphanumeric stripped).
 */
export function parseLiveIndex(html) {
  const jsMatch =
    html.match(/import\("(\/assets\/index-[^"]+\.js)/) ??
    html.match(/src="(\/assets\/index-[^"]+\.js)/)
  const mainBundlePath = jsMatch?.[1] ?? null
  const saltFromQuery = html.match(/\?b=([a-zA-Z0-9-]+)/)?.[1]
  const saltFromFilename = mainBundlePath?.match(/-(\d{8}-\d+)\.js$/)?.[1]
  const buildSalt = saltFromQuery ?? saltFromFilename ?? null
  return { buildSalt, mainBundlePath }
}

/** e.g. 20260715-48 → 2026.07.15-48 */
export function saltToBuildId(salt) {
  const m = salt?.match(/^(\d{4})(\d{2})(\d{2})-(\d+)$/)
  if (!m) return null
  return `${m[1]}.${m[2]}.${m[3]}-${m[4]}`
}