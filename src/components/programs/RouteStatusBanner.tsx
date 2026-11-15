import type { Program } from './types';

/**
 * RouteStatusBanner
 * Honest program-state surface: a bold strip on the card that tells a visitor
 * a program is NOT currently open for applications. Displays the status
 * (closed / changed / not confirmed), the date it was last checked, a plain
 * note explaining why, and — when the record has one — a link to the primary
 * source. Renders nothing for `open` or when no status is on file.
 */
export function RouteStatusBanner({ program }: { program: Program }) {
  const st = program.routeStatus;
  if (!st || st === 'open') return null;

  const cfg =
    st === 'closed'
      ? {
          label: 'Applications closed',
          ring: 'border-mp-accent-wax/45 bg-mp-section',
          dot: 'bg-mp-accent-wax',
        }
      : st === 'changed'
        ? {
            label: 'Program changed',
            ring: 'border-mp-accent-copper/45 bg-mp-section',
            dot: 'bg-mp-accent-copper',
          }
        : {
            label: 'Status not confirmed',
            ring: 'border-mp-accent-ochre/45 bg-mp-section',
            dot: 'bg-mp-accent-ochre',
          };

  const dateLabel = formatStatusDate(program.statusCheckedAt);

  return (
    <div role="status" className={`mb-3 rounded-card border-l-2 px-3 py-2 ${cfg.ring}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-mp-ink">
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
          {cfg.label}
        </span>
        {dateLabel && <span className="text-[10px] text-mp-ink-muted">as of {dateLabel}</span>}
      </div>
      {program.statusNote && <p className="mt-1 text-xs leading-relaxed text-mp-ink-secondary">{program.statusNote}</p>}
      {program.statusSource && (
        <a
          href={program.statusSource}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
          className="mt-1 inline-block max-w-full truncate align-middle text-[10px] underline decoration-dotted text-mp-ink-muted hover:text-mp-ink"
          title={program.statusSource}
        >
          Source · {hostOf(program.statusSource)}
        </a>
      )}
    </div>
  );
}

/** "2026-11-14" → "14 Nov 2026" (or null when unparseable). */
function formatStatusDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
