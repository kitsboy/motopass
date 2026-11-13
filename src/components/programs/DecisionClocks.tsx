import { useMemo } from 'react'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import type { TranslationKey } from '../../i18n/translations'
import {
  buildDecisionPack,
  formatClocks,
  type ClockDisplay,
  type DecisionPack,
  type FeeStance,
  type FilingMode,
  type Refundable,
  type RouteStatus,
} from '../../lib/decisionPack'
import { BtcDualPrice } from '../BtcDualPrice'
import type { Program } from './types'

interface DecisionClocksProps {
  program: Program
  variant: 'strip' | 'cell' | 'pack' | 'pill'
  /** Mark each clock whose figure has no page behind it in the record. */
  showEvidence?: boolean
}

function statusKey(status: RouteStatus): TranslationKey {
  if (status === 'announced') return 'pack.announced'
  if (status === 'reformed') return 'pack.reformed'
  if (status === 'closed') return 'pack.closed'
  return 'pack.live'
}

function statusClass(status: RouteStatus): string {
  if (status === 'announced') return 'border-mp-wax/40 bg-mp-wax/10 text-mp-wax'
  if (status === 'reformed') return 'border-mp-copper/40 text-mp-copper'
  if (status === 'closed') return 'border-mp-border text-mp-ink-tertiary line-through'
  return 'border-mp-border text-mp-ink-secondary'
}

function feeKey(stance: FeeStance): TranslationKey {
  if (stance === 'yes') return 'pack.feeYes'
  if (stance === 'no') return 'pack.feeNo'
  if (stance === 'partial') return 'pack.feePartial'
  return 'pack.notOnFile'
}

function filingKey(mode: FilingMode): TranslationKey {
  if (mode === 'in_country') return 'pack.fileInCountry'
  if (mode === 'remote') return 'pack.fileRemote'
  return 'pack.notOnFile'
}

function refundKey(value: Refundable): TranslationKey {
  if (value === 'yes') return 'pack.refundYes'
  if (value === 'partial') return 'pack.refundPartial'
  return 'pack.refundNo'
}

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{label}</dt>
      <dd className="mt-0.5 text-sm leading-snug text-mp-ink">{children}</dd>
    </div>
  )
}

function DecisionPackPanel({
  program,
  pack,
  clocks,
}: {
  program: Program
  pack: DecisionPack
  clocks: ClockDisplay
}) {
  const { t } = useI18n()
  const family = pack.routes.flatMap(route => route.family.map(price => ({ ...price, route: route.label })))
  const clocksAria = `${t('pack.processLong')}: ${clocks.process}. ${t('pack.inCountryLong')}: ${clocks.days}. ${t('pack.citizenshipLong')}: ${clocks.years}. ${t('pack.renewal')}: ${clocks.renewal}.`

  return (
    <section
      className="rounded-mp-lg border border-mp-border bg-section/50 p-3 sm:p-4"
      aria-labelledby={`decision-pack-${program.id}`}
      data-decision-clocks="pack"
    >
      <h4
        id={`decision-pack-${program.id}`}
        className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary"
      >
        {t('pack.title')}
      </h4>
      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={clocksAria}>
        {(
          [
            [t('pack.processLong'), clocks.process],
            [t('pack.inCountryLong'), clocks.days],
            [t('pack.citizenshipLong'), clocks.years],
            [t('pack.renewal'), clocks.renewal],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-md border border-mp-border-subtle bg-card px-2 py-1.5">
            <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{label}</dt>
            <dd className="font-mono text-sm text-mp-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <h5 className="mt-4 font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{t('pack.routes')}</h5>
      <ul className="mt-1">
        {pack.routes.map(route => (
          <li key={route.label} className="border-t border-mp-border-subtle py-2.5 first:border-t-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display text-sm font-semibold text-mp-ink">{route.label}</span>
              <span className={`rounded-chip border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${statusClass(route.status)}`}>
                {t(statusKey(route.status))}
              </span>
            </div>
            <div className="mt-1">
              <BtcDualPrice usd={route.minUsd} size="xs" layout="inline" />
            </div>
            {route.holding && (
              <p className="mt-1 text-xs leading-relaxed text-mp-ink-secondary">
                <span className="font-chrome uppercase tracking-wide text-mp-ink-tertiary">{t('pack.holding')}. </span>
                {route.holding}
              </p>
            )}
            {route.refundable && (
              <p className="mt-1 text-xs text-mp-ink-secondary">
                {t('pack.refundable')}: {t(refundKey(route.refundable))}
              </p>
            )}
            {route.capPerYear && (
              <p className="mt-1 text-xs text-mp-ink-secondary">
                {formatT(t, 'pack.cap', { count: route.capPerYear })}
              </p>
            )}
          </li>
        ))}
        {pack.routes.length === 0 && <li className="text-sm text-mp-ink-secondary">{t('pack.notOnFile')}</li>}
      </ul>

      <dl className="mt-3 grid gap-3 border-t border-mp-border-subtle pt-3">
        <div>
          <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{t('pack.family')}</dt>
          {family.length === 0 ? (
            <dd className="mt-0.5 text-sm text-mp-ink">{t('pack.notOnFile')}</dd>
          ) : (
            <dd className="mt-1 space-y-1">
              {family.map(price => (
                <div key={`${price.route}-${price.who}`} className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-mp-ink">
                  <span>
                    {price.who}
                    <span className="text-mp-ink-tertiary"> · {price.route}</span>
                  </span>
                  {price.usd == null ? (
                    <span className="font-mono text-xs">{t('pack.included')}</span>
                  ) : (
                    <BtcDualPrice usd={price.usd} size="xs" layout="inline" />
                  )}
                </div>
              ))}
            </dd>
          )}
        </div>
        <Fact label={t('pack.fee')}>{t(feeKey(pack.feeInBitcoin))}</Fact>
        {pack.feeNote && <p className="text-xs leading-relaxed text-mp-ink-secondary">{pack.feeNote}</p>}
        <Fact label={t('pack.crypto')}>{pack.cryptoTaxNote ?? t('pack.notOnFile')}</Fact>
        <Fact label={t('pack.filing')}>{t(filingKey(pack.filing))}</Fact>
        <div>
          <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{t('pack.mobility')}</dt>
          <dd className="mt-0.5 line-clamp-4 text-sm leading-snug text-mp-ink" title={pack.mobilityNote ?? undefined}>
            {pack.mobilityNote ?? (pack.mobilityScore == null ? t('pack.notOnFile') : formatT(t, 'pack.scoreOnFile', { score: pack.mobilityScore }))}
          </dd>
          {pack.mobilityNote && pack.mobilityScore != null && (
            <p className="mt-0.5 font-mono text-[11px] text-mp-ink-tertiary">
              {formatT(t, 'pack.scoreOnFile', { score: pack.mobilityScore })}
            </p>
          )}
        </div>
        <div>
          <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{t('pack.banking')}</dt>
          <dd className="mt-0.5 text-sm leading-snug text-mp-ink">
            {pack.bankingScore == null ? t('pack.notOnFile') : formatT(t, 'pack.scoreOnFile', { score: pack.bankingScore })}
          </dd>
          {pack.bankingNote && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-mp-ink-tertiary">{pack.bankingNote}</p>
          )}
        </div>
      </dl>
    </section>
  )
}

/**
 * Three research clocks — processing, days in country, years to citizenship —
 * shared by the card, the table, and the program modal.
 */
export function DecisionClocks({ program, variant, showEvidence = false }: DecisionClocksProps) {
  const { t } = useI18n()
  const pack = useMemo(() => buildDecisionPack(program), [program])
  const clocks = useMemo(
    () =>
      formatClocks(pack, {
        missing: t('pack.notOnFile'),
        none: t('pack.none'),
        atGrant: t('pack.atGrant'),
        mo: t('pack.mo'),
        day: t('pack.day'),
        year: t('pack.year'),
      }),
    [pack, t],
  )
  const aria = `${t('pack.processLong')}: ${clocks.process}. ${t('pack.inCountryLong')}: ${clocks.days}. ${t('pack.citizenshipLong')}: ${clocks.years}.`

  if (variant === 'pill') {
    if (!pack.announced) return null
    return (
      <span
        className="inline-flex items-center rounded-chip border border-mp-wax/40 bg-mp-wax/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-mp-wax"
        title={t('pack.announcedHint')}
      >
        {t('pack.announced')}
      </span>
    )
  }

  if (variant === 'cell') {
    return (
      <div className="leading-tight" aria-label={aria} data-decision-clocks="cell">
        <div className="font-mono text-sm text-mp-ink">{clocks.process}</div>
        <div className="whitespace-nowrap font-mono text-[10px] text-mp-ink-tertiary">
          {clocks.days} · {clocks.years}
        </div>
        {pack.announced && (
          <div className="font-mono text-[9px] uppercase tracking-wide text-mp-wax">{t('pack.announced')}</div>
        )}
      </div>
    )
  }

  if (variant === 'strip') {
    const items = [
      [t('pack.process'), clocks.process, program.claimSources?.['finance.processing_time_months']?.url],
      [t('pack.inCountry'), clocks.days, program.claimSources?.['compliance_clock.residency_day_count_target']?.url],
      [t('pack.citizenship'), clocks.years, program.claimSources?.['compliance_clock.citizenship_eligibility_years']?.url],
    ] as const
    return (
      <dl className="mt-3 grid grid-cols-3 gap-2" aria-label={aria} data-decision-clocks="strip">
        {items.map(([label, value, source]) => (
          <div key={label} className="min-w-0">
            <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{label}</dt>
            <dd className="font-mono text-sm leading-tight text-mp-ink">
              {value}
              {showEvidence && !source && (
                <span className="ml-1 align-middle text-[10px] font-normal italic text-mp-ink-muted">
                  ({t('programs.noSource')})
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return <DecisionPackPanel program={program} pack={pack} clocks={clocks} />
}
