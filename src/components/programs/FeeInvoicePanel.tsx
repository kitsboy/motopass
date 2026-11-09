import { useMemo } from 'react'
import type { Program } from '../../types/program'
import { feeInvoice, type FeeLine } from '../../lib/feeInvoice'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { BtcDualPrice } from '../BtcDualPrice'
import { CountryFlag } from '../ui/CountryTitle'

/**
 * A sats figure is a payment rail only on the line the note allows.
 * Every other figure is a spot conversion of a dollar fee already on file.
 */
export function FeeInvoicePanel({ programs }: { programs: Program[] }) {
  const { t } = useI18n()
  const invoices = useMemo(
    () =>
      programs.map(program => ({
        program,
        invoice: feeInvoice(program.finance.bitcoin_specific, program.finance.gov_fees_usd),
      })),
    [programs],
  )
  const featured = invoices.filter(item => item.invoice.featured)
  const quiet = invoices.filter(item => !item.invoice.featured)

  return (
    <section className="mb-8 rounded-mp-lg border border-mp-border bg-section/40 p-4 sm:p-5" aria-labelledby="fee-heading">
      <span className="club-eyebrow mb-1.5 block">{t('fee.eyebrow')}</span>
      <h2 id="fee-heading" className="font-display text-h3 font-semibold tracking-tight text-ink">
        {t('fee.title')}
      </h2>
      <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-ink-secondary">{t('fee.lead')}</p>

      <ul className="mt-4 space-y-3">
        {featured.map(({ program, invoice }) => (
          <li key={program.id} className="rounded-mp-md border border-mp-border px-3 py-3">
            <div className="mb-2 flex items-center gap-2">
              <CountryFlag name={program.name} emoji={program.flag} size="sm" />
              <span className="text-sm font-medium text-mp-ink">{program.name}</span>
            </div>
            <ul className="space-y-2">
              {invoice.lines.map((line, index) => (
                <FeeRow key={`${program.id}-${index}`} line={line} />
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-mp-ink-secondary">
        {formatT(t, 'fee.quiet', { count: quiet.length })}{' '}
        {quiet.map(item => item.program.name).join(', ')}
      </p>
    </section>
  )
}

function FeeRow({ line }: { line: FeeLine }) {
  const { t } = useI18n()
  const title =
    line.rail === 'bitcoin' ? t('fee.bitcoin') : line.rail === 'unpriced' ? t('fee.unpriced') : line.rail === 'dollars' ? t('fee.dollars') : t('fee.fiat')
  return (
    <li>
      <p className={`text-xs font-medium ${line.rail === 'bitcoin' ? 'text-mp-btc-text' : 'text-mp-ink-secondary'}`}>{title}</p>
      {line.usd != null && line.usd > 0 ? (
        <>
          <BtcDualPrice usd={line.usd} size="xs" layout="inline" />
          {line.rail !== 'bitcoin' && <p className="text-[11px] text-mp-ink-tertiary">{t('fee.spot')}</p>}
        </>
      ) : (
        <p className="text-[11px] text-mp-ink-tertiary">{t('fee.noAmount')}</p>
      )}
    </li>
  )
}
