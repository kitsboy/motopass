/** Single source of truth for BUILD — bump BUILD_ID on every push/ship */
export const BUILD_ID = '2026.07.15-48'
export const BUILD_LABEL = `Batch 23 — deploy health, compare diff, distressed/apply directories, footer verify, agent hours`
export const BUILD_DATE = '2026-07-15'
/** Shown in site footer — must stay in sync with BUILD_ID */
export const FOOTER_VERSION = `BUILD ${BUILD_ID}`