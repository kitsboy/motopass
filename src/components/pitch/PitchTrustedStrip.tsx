import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Program } from '../../types/program'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

type PitchTrustedStripProps = {
  programs: Program[]
  loading?: boolean
}

/** Trusted-by program flag strip from live programs data. */
export function PitchTrustedStrip({ programs, loading }: PitchTrustedStripProps) {
  const { t } = useI18n()

  const entries = useMemo(() => {
    const sorted = [...programs]
      .filter(p => p.flag)
      .sort((a, b) => (b.sovereignty_score ?? 0) - (a.sovereignty_score ?? 0))
    const seen = new Set<string>()
    const out: { id: string; flag: string; name: string }[] = []
    for (const p of sorted) {
      if (!p.flag || seen.has(p.id)) continue
      seen.add(p.id)
      out.push({ id: p.id, flag: p.flag, name: p.name })
      if (out.length >= 18) break
    }
    return out
  }, [programs])

  if (loading) {
    return (
      <div
        className="border-y border-mp/40 bg-mp-section/30 py-4"
        aria-hidden
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-8 rounded-lg bg-card-muted/50 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!entries.length) return null

  const track = [...entries, ...entries]

  return (
    <section
      className="border-y border-mp/40 bg-mp-section/30 py-4 overflow-hidden"
      aria-label={t('pitch.trusted.label')}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <span className="club-eyebrow shrink-0 text-[10px]">{t('pitch.trusted.eyebrow')}</span>
        <div className="relative min-w-0 flex-1 overflow-hidden mask-fade-x">
          <ul
            className="pitch-trusted-track flex items-center gap-6 sm:gap-8 w-max"
            aria-hidden={entries.length <= 6}
          >
            {track.map((entry, i) => (
              <li key={`${entry.id}-${i}`} className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/programs?q=${encodeURIComponent(entry.name)}`}
                  className="group inline-flex items-center gap-2 rounded-xl border border-transparent px-2 py-1 transition-colors hover:border-btc-orange/25 hover:bg-btc-orange/5"
                  tabIndex={i < entries.length ? 0 : -1}
                  aria-hidden={i >= entries.length}
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {entry.flag}
                  </span>
                  <span className="font-chrome text-[11px] text-ink-muted group-hover:text-mp-btc-text whitespace-nowrap">
                    {entry.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <span className="sr-only">
          {formatT(t, 'pitch.trusted.count', { count: entries.length })}
        </span>
      </div>
    </section>
  )
}