import { useMemo, useState } from 'react'
import type { Program as DataProgram } from '../../types/program'
import { toCinematicPrograms } from '../../lib/programAdapter'
import { buildDecisionPack, formatClocks, type RouteLine } from '../../lib/decisionPack'
import { sumKnownFamily, sumRouteMins, visibleRoutes } from '../../lib/routeMix'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/translations'
import { BtcDualPrice } from '../BtcDualPrice'
import { CountryFlag } from '../ui/CountryTitle'

interface Pick {
  countryId: string
  label: string
}

function feeKey(stance: string): TranslationKey {
  if (stance === 'yes') return 'pack.feeYes'
  if (stance === 'no') return 'pack.feeNo'
  if (stance === 'partial') return 'pack.feePartial'
  return 'pack.notOnFile'
}

function filingKey(mode: string): TranslationKey {
  if (mode === 'in_country') return 'pack.fileInCountry'
  if (mode === 'remote') return 'pack.fileRemote'
  return 'pack.notOnFile'
}

/**
 * One route per country, added into a single total.
 * Announced routes stay hidden until the visitor opens that switch.
 */
export function RouteMixer({ programs }: { programs: DataProgram[] }) {
  const { t } = useI18n()
  const cinematic = useMemo(() => toCinematicPrograms(programs), [programs])
  const [countryId, setCountryId] = useState(cinematic[0]?.id ?? '')
  const [includeAnnounced, setIncludeAnnounced] = useState(false)
  const [picks, setPicks] = useState<Pick[]>([])

  const country = cinematic.find(program => program.id === countryId) ?? cinematic[0]
  const pack = country ? buildDecisionPack(country) : null
  const routes = pack ? visibleRoutes(pack, includeAnnounced) : []
  const clocks = pack
    ? formatClocks(pack, {
        missing: t('pack.notOnFile'),
        none: t('pack.none'),
        atGrant: t('pack.atGrant'),
        mo: t('pack.mo'),
        day: t('pack.day'),
        year: t('pack.year'),
      })
    : null

  const chosen = picks.flatMap(pick => {
    const program = cinematic.find(item => item.id === pick.countryId)
    if (!program) return []
    const route = visibleRoutes(buildDecisionPack(program), includeAnnounced).find(item => item.label === pick.label)
    return route ? [{ program, route }] : []
  })
  const total = sumRouteMins(chosen.map(item => item.route))
  const family = sumKnownFamily(chosen.map(item => item.route))
  const selectedMix = chosen.find(item => item.program.id === country?.id)

  function add(route: RouteLine) {
    if (!country) return
    setPicks(current => [
      ...current.filter(pick => pick.countryId !== country.id),
      { countryId: country.id, label: route.label },
    ])
  }

  return (
    <section className="mb-10" aria-labelledby="route-mixer-heading">
      <div className="mb-4 max-w-2xl">
        <span className="club-eyebrow mb-1.5 block">{t('mixer.eyebrow')}</span>
        <h2 id="route-mixer-heading" className="font-display text-h3 font-semibold tracking-tight text-ink">
          {t('mixer.title')}
        </h2>
        <p className="mt-2 font-body text-sm leading-relaxed text-ink-secondary">{t('mixer.lead')}</p>
      </div>

      <label className="mb-4 inline-flex items-center gap-2 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={includeAnnounced}
          onChange={event => setIncludeAnnounced(event.target.checked)}
          className="h-4 w-4 accent-btc-orange"
        />
        {t('mixer.includeAnnounced')}
      </label>

      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-4">
        <div className="max-h-80 overflow-y-auto rounded-mp-lg border border-mp-border bg-[rgb(var(--mp-card-rgb))]" role="listbox" aria-label={t('mixer.countries')}>
          {cinematic.map(program => {
            const selected = program.id === country?.id
            return (
              <button
                key={program.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => setCountryId(program.id)}
                className={`flex w-full items-center gap-2 border-b border-mp-border-subtle px-3 py-2 text-left text-sm last:border-b-0 ${
                  selected ? 'bg-mp-btc-soft text-mp-ink' : 'text-mp-ink-secondary hover:bg-mp-section'
                }`}
              >
                <CountryFlag name={program.country} emoji={program.flag} size="sm" />
                <span className="min-w-0">{program.country}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 rounded-mp-lg border border-mp-border bg-[rgb(var(--mp-card-rgb))] p-3 lg:hidden max-lg:sticky max-lg:top-0 max-lg:z-30">
          <p className="text-sm text-mp-ink">
            {country?.country ?? t('mixer.empty')}
            {selectedMix ? (
              <span className="text-mp-ink-tertiary">
                {' · '}
                {selectedMix.route.label}
              </span>
            ) : null}
          </p>
          {chosen.length === 0 ? (
            <p className="mt-1 text-xs text-mp-ink-secondary">{t('mixer.empty')}</p>
          ) : (
            <div className="mt-1">
              <BtcDualPrice usd={total} size="xs" layout="inline" />
            </div>
          )}
        </div>

        {country && pack && clocks && (
          <div className="mt-4 rounded-mp-lg border border-mp-border bg-section/40 p-4 lg:mt-0">
            <h3 className="font-display text-lg font-semibold text-ink">{country.country}</h3>
            <dl className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  [t('pack.process'), clocks.process],
                  [t('pack.inCountry'), clocks.days],
                  [t('pack.citizenship'), clocks.years],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{label}</dt>
                  <dd className="font-mono text-sm text-mp-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-mp-ink-secondary">
              {t('pack.fee')}: {t(feeKey(pack.feeInBitcoin))}. {t('pack.filing')}: {t(filingKey(pack.filing))}
            </p>
            <ul className="mt-3 space-y-2" aria-label={t('pack.routes')}>
              {routes.map(route => {
                const inMix = picks.some(pick => pick.countryId === country.id && pick.label === route.label)
                return (
                  <li key={route.label}>
                    <button
                      type="button"
                      onClick={() => add(route)}
                      aria-pressed={inMix}
                      className={`w-full rounded-mp-md border px-3 py-2 text-left ${
                        inMix ? 'border-mp-btc bg-mp-btc-soft' : 'border-mp-border hover:border-mp-copper/40'
                      }`}
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-display text-sm font-semibold text-mp-ink">{route.label}</span>
                        <span className={`font-mono text-[9px] uppercase tracking-wide ${route.status === 'announced' ? 'text-mp-wax' : 'text-mp-ink-tertiary'}`}>
                          {t(route.status === 'announced' ? 'pack.announced' : route.status === 'reformed' ? 'pack.reformed' : route.status === 'closed' ? 'pack.closed' : 'pack.live')}
                        </span>
                      </span>
                      <span className="mt-1 block">
                        <BtcDualPrice usd={route.minUsd} size="xs" layout="inline" />
                      </span>
                      {route.family.length > 0 && (
                        <span className="mt-1 block text-[11px] leading-relaxed text-mp-ink-secondary">
                          {route.family.map(price => (
                            <span key={price.who} className="mr-3 inline-block">
                              {price.who}: {price.usd == null ? t('pack.included') : ''}
                              {price.usd != null && <BtcDualPrice usd={price.usd} size="xs" layout="inline" />}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
              {routes.length === 0 && <li className="text-sm text-mp-ink-secondary">{t('pack.notOnFile')}</li>}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-mp-lg border border-mp-border p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{t('mixer.total')}</h3>
            {chosen.length === 0 ? (
              <p className="mt-1 text-sm text-mp-ink-secondary">{t('mixer.empty')}</p>
            ) : (
              <BtcDualPrice usd={total} size="sm" />
            )}
          </div>
          {chosen.length > 0 && (
            <p className="text-xs text-mp-ink-secondary">
              {t('mixer.family')}: {family > 0 ? '' : t('pack.notOnFile')}
              {family > 0 && <BtcDualPrice usd={family} size="xs" layout="inline" />}
            </p>
          )}
        </div>
        {chosen.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-mp-ink">
            {chosen.map(item => (
              <li key={`${item.program.id}-${item.route.label}`} className="flex flex-wrap items-center justify-between gap-2 border-t border-mp-border-subtle pt-2">
                <span>
                  {item.program.country}
                  <span className="text-mp-ink-tertiary"> · {item.route.label}</span>
                </span>
                <button
                  type="button"
                  className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary hover:text-mp-ink"
                  onClick={() => setPicks(current => current.filter(pick => pick.countryId !== item.program.id))}
                >
                  {t('mixer.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
