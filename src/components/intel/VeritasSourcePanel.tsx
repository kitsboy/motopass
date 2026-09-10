import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, ExternalLink } from 'lucide-react'
import type { WatchUrl } from '../../types/program'
import { useI18n } from '../../i18n/I18nContext'

interface VeritasSourcePanelProps {
  urls: WatchUrl[]
  probedAt?: string | null
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

const STATUS_STYLE: Record<WatchUrl['status'], { icon: typeof ShieldCheck; cls: string }> = {
  ok: { icon: ShieldCheck, cls: 'text-mp-proof' },
  changed: { icon: ShieldAlert, cls: 'text-mp-ochre' },
  unreachable: { icon: ShieldX, cls: 'text-mp-wax' },
  unprobed: { icon: ShieldQuestion, cls: 'text-mp-ink-tertiary' },
}

/**
 * Veritas v1 — renders the per-source probe results produced nightly by the
 * Country Intel watchdog: each official URL with its live status, the probe
 * date, and a direct link. This makes source trust *inspectable* rather than
 * asserted: every claim's origin is one click away, with an honest status.
 */
export function VeritasSourcePanel({ urls, probedAt }: VeritasSourcePanelProps) {
  const { t } = useI18n()
  if (!urls.length) return null

  const okCount = urls.filter(u => u.status === 'ok').length
  const changedCount = urls.filter(u => u.status === 'changed').length
  const downCount = urls.filter(u => u.status === 'unreachable').length

  return (
    <div className="rounded-mp-md border border-mp-border bg-section/60 p-3">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h4 className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-mp-btc" aria-hidden />
          {t('veritas.title')}
        </h4>
        <span className="font-mono text-[10px] text-mp-ink-muted">
          {okCount}/{urls.length} {t('veritas.healthy')}
        </span>
      </div>
      <ul className="space-y-1.5">
        {urls.map(u => {
          const s = STATUS_STYLE[u.status]
          const Icon = s.icon
          const label = t(`veritas.status.${u.status}`)
          const probed = u.last_probed ? u.last_probed.slice(0, 10) : null
          return (
            <li key={u.url} className="flex items-center gap-2 text-xs">
              <Icon size={13} className={`shrink-0 ${s.cls}`} aria-hidden />
              <a
                href={u.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="truncate text-mp-ink-secondary hover:text-mp-btc-text hover:underline underline-offset-2"
                title={u.url}
              >
                {hostOf(u.url)}
              </a>
              <span className={`ml-auto shrink-0 font-mono text-[10px] ${s.cls}`}>{label}</span>
              {probed && (
                <a
                  href={u.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="shrink-0 text-mp-ink-muted hover:text-mp-btc-text"
                  aria-label={`${t('veritas.openSource')} ${hostOf(u.url)}`}
                >
                  <ExternalLink size={11} aria-hidden />
                </a>
              )}
            </li>
          )
        })}
      </ul>
      <p className="mt-2.5 font-mono text-[10px] text-mp-ink-muted">
        {t('veritas.probeNote')}{probedAt ? ` · ${probedAt.slice(0, 10)}` : ''}
        {changedCount > 0 && ` · ${changedCount} ${t('veritas.changedCount')}`}
        {downCount > 0 && ` · ${downCount} ${t('veritas.downCount')}`}
      </p>
    </div>
  )
}
