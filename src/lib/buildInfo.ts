/** Single source of truth for BUILD — bump BUILD_ID on every push/ship */
export const BUILD_ID = '2026.07.15-46'
export const BUILD_LABEL = `stop CDN cache poison — no-cache assets, boot guard, eager home`
export const BUILD_DATE = '2026-07-15'
/** Shown in site footer — must stay in sync with BUILD_ID */
export const FOOTER_VERSION = `BUILD ${BUILD_ID}`