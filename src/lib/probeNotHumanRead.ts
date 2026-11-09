/** Hosts the 8 Nov human re-read could not open. A later probe status is not that read. */
const HOSTS = new Set(['cbiu.gov.dm', 'cnmv.es'])

export function probeOkIsNotHumanRead(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    return HOSTS.has(host)
  } catch {
    return false
  }
}
