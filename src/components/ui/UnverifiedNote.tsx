import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

/**
 * The site's figures are not yet traced to official pages (0 of 141 money and
 * time figures, as of the current audit). Rather than quietly show numbers that
 * no source supports, every surface that displays them says so, and links to
 * the page that explains why.
 */
export function UnverifiedNote({ figures }: { figures?: number }) {
  return (
    <aside
      className="mb-6 flex items-start gap-2.5 rounded-lg border border-status-amber/35 bg-status-amber/10 px-3.5 py-3 text-sm text-ink-secondary"
      role="note"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-amber" aria-hidden="true" />
      <p className="leading-snug">
        {figures ? (
          <>
            <strong className="text-ink">
              {figures} {figures === 1 ? 'figure' : 'figures'} here are unverified
            </strong>{' '}
            — not yet traced to an official page.{' '}
          </>
        ) : (
          <>
            <strong className="text-ink">These figures are unverified</strong> — not yet traced to
            an official page.{' '}
          </>
        )}
        <Link to="/proof#unverified" className="underline underline-offset-2">
          Why we show them anyway
        </Link>
        .
      </p>
    </aside>
  )
}

/** The one-word version, for a figure that sits inside a card or a table cell. */
export function UnverifiedChip() {
  return (
    <Link
      to="/proof#unverified"
      className="inline-flex items-center gap-1 rounded border border-status-amber/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-status-amber no-underline"
      title="Not yet traced to an official page"
    >
      Unverified
    </Link>
  )
}
