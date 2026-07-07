/** URL-safe slug for program names — used by offline cache paths. */
export function programCacheSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}