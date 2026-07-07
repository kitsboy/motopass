import { useMemo, useState } from 'react';
import { ExternalLink, Zap } from 'lucide-react';
import { ClassyModal } from '../ui/ClassyModal';
import { ModalTabs } from '../ui/ModalTabs';
import { ProofBadge } from '../ui/ProofBadge';
import { StatCard } from '../ui/StatCard';
import { useI18n } from '../../i18n/I18nContext';
import { BtcMapProgramPanel } from '../btcmap/BtcMapProgramPanel';
import { Program, ProgramModalTab, scoreWeight } from './types';

interface ProgramModalProps {
  program: Program | null;
  onClose: () => void;
  onAddToStack?: (program: Program) => void;
  inPortfolio?: boolean;
  initialTab?: ProgramModalTab;
}

/**
 * ProgramModal
 * Reuses the ClassyModal shell for consistent bottom-sheet/dialog behavior,
 * with tabbed finance-dense content pulled from legacy modal patterns.
 * Sovereignty score is always shown on a /100 scale.
 */
export function ProgramModal({
  program,
  onClose,
  onAddToStack,
  inPortfolio = false,
  initialTab = 'Overview',
}: ProgramModalProps) {
  if (!program) return null;

  return (
    <ProgramModalBody
      key={program.id}
      program={program}
      onClose={onClose}
      onAddToStack={onAddToStack}
      inPortfolio={inPortfolio}
      initialTab={initialTab}
    />
  );
}

function ProgramModalBody({
  program,
  onClose,
  onAddToStack,
  inPortfolio,
  initialTab,
}: {
  program: Program;
  onClose: () => void;
  onAddToStack?: (program: Program) => void;
  inPortfolio: boolean;
  initialTab: ProgramModalTab;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<ProgramModalTab>(initialTab);
  const isFlagship = scoreWeight(program.sovereigntyScore) === 'flagship';

  const TABS = useMemo(
    () => [
      { id: 'Overview' as const, label: t('modal.tabOverview') },
      { id: 'Finance' as const, label: t('modal.tabFinance') },
      { id: 'Bitcoin' as const, label: t('modal.tabBitcoin') },
      { id: 'Legal' as const, label: t('modal.tabLegal') },
      { id: 'Sources' as const, label: t('modal.tabSources') },
    ],
    [t],
  );

  return (
    <ClassyModal
      open
      onClose={onClose}
      closeLabel={t('modal.close')}
      eyebrow={`${program.tier} · ${program.region}`}
      title={program.country}
    >
      <div className="mb-4 flex items-center gap-3">
        <ProofBadge status={program.proofStatus} txHint={program.proofRef} />
        {isFlagship && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-mp-btc-text">{t('modal.flagship')}</span>
        )}
      </div>

      <ModalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <div className="space-y-4 text-sm text-mp-ink-secondary">
          <p className="leading-relaxed">{program.summary}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              [t('modal.sovereignty'), `${program.sovereigntyScore}/100`],
              [t('modal.stacking'), program.stackingSynergy ?? '—'],
              [t('modal.risk'), program.riskLevel ?? '—'],
              [t('modal.lightning'), program.lightningReady ? t('modal.yes') : t('modal.no')],
            ].map(([k, v]) => (
              <div key={k} className="card-muted font-medium text-mp-ink">
                <span className="text-mp-ink-muted block text-[10px] uppercase tracking-wide mb-0.5">{k}</span>
                {v}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Finance' && (
        <dl className="text-sm space-y-3">
          {[
            [t('modal.minInvestment'), `$${(program.minInvestment ?? 0).toLocaleString()}`],
            [t('modal.typical'), `$${(program.typicalInvestment ?? 0).toLocaleString()}`],
            [t('modal.govFees'), `$${(program.govFees ?? 0).toLocaleString()}`],
            [t('modal.processing'), `${program.processingTimeMonths ?? '—'} ${t('modal.months')}`],
          ].map(([dt, dd]) => (
            <div key={dt} className="flex justify-between border-b border-mp-border-subtle pb-2">
              <dt className="text-mp-ink-muted">{dt}</dt>
              <dd className="font-mono text-mp-ink font-medium">{dd}</dd>
            </div>
          ))}
          {program.taxBenefits && (
            <div>
              <dt className="text-mp-ink-muted mb-1">{t('modal.taxBenefits')}</dt>
              <dd className="text-mp-ink-secondary leading-relaxed">{program.taxBenefits}</dd>
            </div>
          )}
        </dl>
      )}

      {tab === 'Bitcoin' && (
        <div className="text-sm space-y-3 text-mp-ink-secondary">
          {program.bitcoinIntegration && <p className="leading-relaxed">{program.bitcoinIntegration}</p>}
          {program.bitcoinSpecific && (
            <p className="text-mp-btc-text font-medium">{program.bitcoinSpecific}</p>
          )}
          {program.cryptoFriendlyScore != null && (
            <div className="flex items-center gap-2 text-mp-ink">
              <Zap size={14} className="text-mp-btc" /> {t('modal.score')}: {program.cryptoFriendlyScore}/10
            </div>
          )}
          {program.proofUrl && (
            <a
              href={program.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="proof-badge inline-flex items-center gap-1 hover:opacity-90 hover:border-mp-proof/50"
            >
              {t('modal.verifyBlock')} #{program.proofBlockHeight ?? '—'} <ExternalLink size={12} />
            </a>
          )}
          <BtcMapProgramPanel programName={program.country} programId={program.id} />
        </div>
      )}

      {tab === 'Legal' && (
        <p className="text-sm text-mp-ink-secondary leading-relaxed card-muted">
          {t('modal.legalStatus')}: <strong className="text-mp-ink">{program.status ?? '—'}</strong>. {t('modal.lastChecked')}{' '}
          {program.lastChecked ?? '—'}. {t('modal.legalDisclaimer')}
        </p>
      )}

      {tab === 'Sources' && (
        <ul className="text-sm space-y-2">
          {(program.sources?.length ? program.sources : [t('modal.noSources')]).map((s) => (
            <li key={s} className="text-mp-ink-secondary flex gap-2">
              <span className="text-mp-btc">•</span> {s}
            </li>
          ))}
        </ul>
      )}

      {tab === 'Overview' && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label={t('modal.minInvestStat')} value={`$${program.minInvestment.toLocaleString()}`} />
          <StatCard label={t('modal.avgTimeline')} value={`${program.timelineDays}d`} />
          <StatCard label={t('modal.sovereigntyScore')} value={`${program.sovereigntyScore}/100`} />
        </div>
      )}

      {onAddToStack && (
        <div className="mt-6 flex flex-col gap-3 border-t border-mp-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-mp-ink-tertiary">
            {t('modal.figuresNote')}
          </p>
          <button
            type="button"
            onClick={() => onAddToStack(program)}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-chrome text-sm font-semibold transition-transform duration-fast ease-spring-snappy hover:-translate-y-0.5 ${
              inPortfolio
                ? 'border border-mp-border bg-mp-section text-mp-ink-secondary hover:border-mp-border-strong'
                : 'bg-mp-btc text-mp-ink-on-accent shadow-mp-glow'
            }`}
          >
            {inPortfolio ? t('modal.removeFromStack') : t('modal.addToStack')}
          </button>
        </div>
      )}
    </ClassyModal>
  );
}