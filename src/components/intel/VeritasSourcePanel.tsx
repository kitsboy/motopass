import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, ShieldOff, ExternalLink, Landmark } from 'lucide-react'
import type { WatchUrl } from '../../types/program'
import type { TranslationKey } from '../../i18n/translations'
import { useI18n } from '../../i18n/I18nContext'
import { visitorLink, waybackUrl } from '../../lib/visitorLink'
import { probeOkIsNotHumanRead } from '../../lib/probeNotHumanRead'

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
  blocked: { icon: ShieldOff, cls: 'text-mp-ochre' },
  unreachable: { icon: ShieldX, cls: 'text-mp-wax' },
  unprobed: { icon: ShieldQuestion, cls: 'text-mp-ink-tertiary' },
}

function styleFor(status: string) {
  if (status in STATUS_STYLE) return STATUS_STYLE[status as WatchUrl['status']]
  return STATUS_STYLE.unprobed
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
          const s = styleFor(u.status)
          const Icon = s.icon
          const known = u.status in STATUS_STYLE
          const label = known
            ? t(`veritas.status.${u.status}` as TranslationKey)
            : t('veritas.status.unprobed')
          const probed = u.last_probed ? u.last_probed.slice(0, 10) : null
          const link = visitorLink(u.url, {
            status: u.status,
            probed: u.last_probed,
            liveMissed: t('veritas.liveMissed'),
          })
          // A changed page still loads, so the archive is a second link.
          // A dead page's main click is already the archive.
          const showMirror = u.status === 'changed' && !link.archived
          return (
            <li key={u.url} className="text-xs">
              <div className="flex items-center gap-2">
              <Icon size={13} className={`shrink-0 ${s.cls}`} aria-hidden />
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="truncate text-mp-ink-secondary hover:text-mp-btc-text hover:underline underline-offset-2"
                title={link.title}
              >
                {hostOf(u.url)}
              </a>
              {link.archived && (
                <span className="shrink-0 font-mono text-[10px] text-mp-ink-muted">{t('veritas.mirror')}</span>
              )}
              {showMirror && (
                <a
                  href={waybackUrl(u.url, u.last_probed)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="shrink-0 inline-flex items-center gap-0.5 text-mp-ink-muted hover:text-mp-btc-text"
                  title={`${t('veritas.mirror')} — ${hostOf(u.url)}`}
                >
                  <Landmark size={11} aria-hidden />
                  <span className="font-mono text-[10px]">{t('veritas.mirror')}</span>
                </a>
              )}
              <span className={`ml-auto shrink-0 font-mono text-[10px] ${s.cls}`}>{label}</span>
              {probed && (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="shrink-0 text-mp-ink-muted hover:text-mp-btc-text"
                  aria-label={`${t('veritas.openSource')} ${hostOf(u.url)}`}
                >
                  <ExternalLink size={11} aria-hidden />
                </a>
              )}
              </div>
              {probeOkIsNotHumanRead(u.url) && (
                <p className="mt-0.5 ps-5 text-[10px] leading-snug text-mp-wax">{t('veritas.notHumanRead')}</p>
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
