/**
 * Post-first-paint deferral for non-critical work.
 *
 * The mempool spot price, Bitcoin block height and 50-country density snapshots
 * are live-data widgets that do NOT need to run at startup: consumers already
 * render a loading/fallback state until the fetch resolves. Scheduling their
 * initial fetch for the browser's idle window (right after first paint) keeps
 * the main thread free for scroll + cursor during load on EVERY route — the
 * page feels solid immediately, and the live numbers fill in a moment later.
 *
 * Falls back to a macrotask when `requestIdleCallback` is unavailable (older
 * WebKit) and caps the idle wait so data still arrives promptly.
 */
type Ric = (cb: () => void, opts?: { timeout?: number }) => number

const RIC = window as unknown as {
  requestIdleCallback?: Ric
  cancelIdleCallback?: (id: number) => void
}

/**
 * Run `fn` once the browser is idle after first paint.
 * Returns a cancel function to call in the effect cleanup.
 */
export function afterIdle(fn: () => void, timeoutMs = 1500): () => void {
  let ricId: number | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  if (typeof RIC.requestIdleCallback === 'function') {
    ricId = RIC.requestIdleCallback(fn, { timeout: timeoutMs })
  } else {
    // No idle callback: defer to the next macrotask so first paint isn't blocked.
    timer = setTimeout(fn, 0)
  }

  return () => {
    if (ricId != null && typeof RIC.cancelIdleCallback === 'function') {
      RIC.cancelIdleCallback(ricId)
    }
    if (timer) clearTimeout(timer)
  }
}
