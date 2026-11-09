import { useEffect, useState } from 'react'
import type { Program } from '../../types/program'
import type { AdvisoryFile, ArAdvice, UkAdvice, UsAdvice } from '../../lib/advisories'
import { ukStatusKey } from '../../lib/advisories'
import { programCountryCode } from '../../lib/countryCode'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { CountryFlag } from '../ui/CountryTitle'

/**
 * Three public feeds, each speaking to its own citizens.
 * A blank line means that page did not name the country.
 */
export function AdvisoryBoard({ programs }: { programs: Program[] }) {
  const { t } = useI18n()
  const [file, setFile] = useState<AdvisoryFile | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [open, setOpen] = useState<string | null>(null)
  const [held, setHeld] = useState<'all' | 'us' | 'uk' | 'ar'>('all')

  useEffect(() => {
    let live = true
    fetch('/data/advisories.json')
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (!live) return
        setFile(data as AdvisoryFile | null)
        setPhase(data ? 'ready' : 'missing')
      })
      .catch(() => {
        if (!live) return
        setFile(null)
        setPhase('missing')
      })
    return () => {
      live = false
    }
  }, [])

  const otherAlerts = (file?.argentina_alerts ?? []).filter(alert => alert.matches.length === 0)
  const when = file?.fetched_at?.slice(0, 10) ?? t('advice.unknownDate')

  return (
    <section className="mb-8 rounded-mp-lg border border-mp-border bg-section/40 p-4 sm:p-5" aria-labelledby="advice-heading">
      <span className="club-eyebrow mb-1.5 block">{t('advice.eyebrow')}</span>
      <h2 id="advice-heading" className="font-display text-h3 font-semibold tracking-tight text-ink">
        {t('advice.title')}
      </h2>
      <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-ink-secondary">{t('advice.lead')}</p>
      <p className="mt-2 text-[11px] text-mp-ink-tertiary">
        {phase === 'loading' ? t('advice.copying') : formatT(t, 'advice.fetched', { date: when })}
      </p>

      {phase === 'missing' && <p className="mt-3 text-sm text-mp-ink-secondary">{t('advice.notOnFile')}</p>}

      {phase === 'ready' && (
      <>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('advice.hold')}>
        {([
          ['all', 'advice.holdAll'],
          ['us', 'advice.holdUs'],
          ['uk', 'advice.holdUk'],
          ['ar', 'advice.holdAr'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={held === key}
            className={`chip text-xs ${held === key ? 'border-mp-btc text-mp-ink' : ''}`}
            onClick={() => {
              setHeld(key)
              setOpen(null)
            }}
          >
            {t(label)}
          </button>
        ))}
      </div>
      <div className={`mt-4 hidden gap-2 border-b border-mp-border-subtle pb-2 text-[10px] font-chrome uppercase tracking-wide text-mp-ink-tertiary sm:grid ${held === 'all' ? 'sm:grid-cols-[10.5rem_1fr_1fr_1fr]' : 'sm:grid-cols-[10.5rem_1fr]'}`}>
        <span>{t('advice.country')}</span>
        {(held === 'all' || held === 'us') && <span>{t('advice.usAudience')}</span>}
        {(held === 'all' || held === 'uk') && <span>{t('advice.ukAudience')}</span>}
        {(held === 'all' || held === 'ar') && <span>{t('advice.arAudience')}</span>}
      </div>

      <ul className="divide-y divide-mp-border-subtle">
        {programs.map(program => {
          const iso = programCountryCode(program.name)
          const row = file?.by_iso?.[iso]
          const expanded = open === program.name
          return (
            <li key={program.id} className="py-2.5">
              <div className={`grid gap-2 sm:items-start ${held === 'all' ? 'sm:grid-cols-[10.5rem_1fr_1fr_1fr]' : 'sm:grid-cols-[10.5rem_1fr]'}`}>
                <div className="flex min-w-0 items-center gap-2">
                  <CountryFlag name={program.name} emoji={program.flag} size="sm" />
                  <span className="min-w-0 text-sm font-medium text-mp-ink">{program.name}</span>
                </div>
                {(held === 'all' || held === 'us') && (
                  <UsCell advice={row?.us ?? null} missing={t('advice.notOnFile')} levelWord={t('advice.levelWord')} />
                )}
                {(held === 'all' || held === 'uk') && (
                  <UkCell advice={row?.uk ?? null} missing={t('advice.notOnFile')} none={t('advice.noUkCode')} t={t} />
                )}
                {(held === 'all' || held === 'ar') && <ArCell alerts={row?.ar ?? []} none={t('advice.noArAlert')} />}
              </div>
              <button
                type="button"
                className="mt-1 font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary hover:text-mp-ink"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : program.name)}
              >
                {expanded ? t('advice.hide') : held === 'all' ? t('advice.read') : t('advice.otherPassports')}
              </button>
              {expanded && held === 'all' && (
                <div className="mt-2 grid gap-2 text-xs leading-relaxed text-mp-ink-secondary sm:grid-cols-3">
                  <p>{row?.us?.summary || t('advice.notOnFile')}</p>
                  <p>{row?.uk?.change || t('advice.notOnFile')}</p>
                  <p>{row?.ar?.[0]?.detail || t('advice.noArAlert')}</p>
                </div>
              )}
              {expanded && held !== 'all' && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {held !== 'us' && <UsCell advice={row?.us ?? null} missing={t('advice.notOnFile')} levelWord={t('advice.levelWord')} />}
                  {held !== 'uk' && (
                    <UkCell advice={row?.uk ?? null} missing={t('advice.notOnFile')} none={t('advice.noUkCode')} t={t} />
                  )}
                  {held !== 'ar' && <ArCell alerts={row?.ar ?? []} none={t('advice.noArAlert')} />}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {otherAlerts.length > 0 && (
        <div className="mt-4 border-t border-mp-border-subtle pt-3">
          <h3 className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{t('advice.otherAr')}</h3>
          <ul className="mt-2 space-y-2">
            {otherAlerts.map(alert => (
              <li key={alert.href} className="text-sm leading-relaxed text-mp-ink-secondary">
                <a href={alert.href} target="_blank" rel="noreferrer" className="font-medium text-mp-ink underline-offset-2 hover:underline">
                  {alert.title}
                </a>
                <span className="mt-0.5 block">{alert.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      </>
      )}
    </section>
  )
}

function UsCell({ advice, missing, levelWord }: { advice: UsAdvice | null; missing: string; levelWord: string }) {
  if (!advice?.level) return <p className="text-xs text-mp-ink-tertiary">{missing}</p>
  const tone = advice.level >= 3 ? 'text-mp-wax' : advice.level === 2 ? 'text-mp-copper' : 'text-mp-ink'
  return (
    <p className="text-xs leading-snug">
      <a href={advice.href} target="_blank" rel="noreferrer" className={`font-medium underline-offset-2 hover:underline ${tone}`}>
        {levelWord} {advice.level}
      </a>
      <span className="mt-0.5 block text-mp-ink-secondary">{advice.label}</span>
    </p>
  )
}

function UkCell({
  advice,
  missing,
  none,
  t,
}: {
  advice: UkAdvice | null
  missing: string
  none: string
  t: (key: import('../../i18n/translations').TranslationKey) => string
}) {
  if (!advice) return <p className="text-xs text-mp-ink-tertiary">{missing}</p>
  const codes = advice.alert_status
  return (
    <p className="text-xs leading-snug">
      <a href={advice.href} target="_blank" rel="noreferrer" className="font-medium text-mp-ink underline-offset-2 hover:underline">
        {advice.updated?.slice(0, 10) || missing}
      </a>
      {codes.length === 0 ? (
        <span className="mt-0.5 block text-mp-ink-tertiary">{none}</span>
      ) : (
        codes.map(code => {
          const key = ukStatusKey(code)
          return (
            <span key={code} className="mt-0.5 block text-mp-wax">
              {key ? t(key) : code}
            </span>
          )
        })
      )}
    </p>
  )
}

function ArCell({ alerts, none }: { alerts: ArAdvice[]; none: string }) {
  if (alerts.length === 0) return <p className="text-xs text-mp-ink-tertiary">{none}</p>
  return (
    <p className="text-xs leading-snug">
      {alerts.map(alert => (
        <a key={alert.href} href={alert.href} target="_blank" rel="noreferrer" className="mt-0.5 block font-medium text-mp-wax underline-offset-2 hover:underline">
          {alert.title}
        </a>
      ))}
    </p>
  )
}
