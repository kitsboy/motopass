import { useMemo, useState } from 'react';
import { ExternalLink, Zap, Check, X as XIcon } from 'lucide-react';
import { ClassyModal } from '../ui/ClassyModal';
import { ModalTabs } from '../ui/ModalTabs';
import { ProofBadge } from '../ui/ProofBadge';
import { StatCard } from '../ui/StatCard';
import { BtcDualPrice } from '../BtcDualPrice';
import { ComplianceClock } from '../portfolio/ComplianceClock';
import { useI18n } from '../../i18n/I18nContext';
import { BtcMapProgramPanel } from '../btcmap/BtcMapProgramPanel';
import { Program, ProgramModalTab, scoreWeight, hasFlagshipDepth } from './types';

interface ProgramModalProps {
  program: Program | null;
  onClose: () => void;
  onAddToStack?: (program: Program) => void;
  inPortfolio?: boolean;
  initialTab?: ProgramModalTab;
}

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

function TestBadge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-mp-md border px-3 py-2 text-xs font-medium ${
      pass ? 'border-mp-proof/30 bg-mp-proof/10 text-mp-proof' : 'border-mp-wax/30 bg-mp-wax/10 text-mp-wax'
    }`}>
      {pass ? <Check size={14} /> : <XIcon size={14} />}
      {label}
    </div>
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
  const deep = hasFlagshipDepth(program);

  const TABS = useMemo(() => {
    const base = [
      { id: 'Overview' as const, label: t('modal.tabOverview') },
      ...(deep ? [{ id: 'Pathways' as const, label: t('modal.tabPathways') }] : []),
      { id: 'Finance' as const, label: t('modal.tabFinance') },
      { id: 'Bitcoin' as const, label: t('modal.tabBitcoin') },
      ...(deep ? [{ id: 'Critical' as const, label: t('modal.tabCritical') }] : []),
      { id: 'Legal' as const, label: t('modal.tabLegal') },
      ...(program.paigeFields ? [{ id: 'Paige' as const, label: t('modal.tabPaige') }] : []),
      { id: 'Sources' as const, label: t('modal.tabSources') },
    ];
    return base;
  }, [t, deep, program.paigeFields]);

  return (
    <ClassyModal
      open
      onClose={onClose}
      closeLabel={t('modal.close')}
      eyebrow={`${program.tier} · ${program.region}`}
      title={program.country}
    >
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <ProofBadge status={program.proofStatus} txHint={program.proofRef} />
        {isFlagship && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-mp-btc-text">{t('modal.flagship')}</span>
        )}
        {deep && (
          <span className="chip text-[10px] text-mp-btc-text border-mp-btc/30">Flagship depth</span>
        )}
      </div>

      <ModalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <div className="space-y-4 text-sm text-mp-ink-secondary">
          <p className="leading-relaxed">{program.summary}</p>
          {deep && program.complianceClock && (
            <ComplianceClock program={program} />
          )}
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label={t('modal.minInvestStat')} value={<BtcDualPrice usd={program.minInvestment} size="sm" />} />
            <StatCard label={t('modal.avgTimeline')} value={`${program.timelineDays}d`} />
            <StatCard label={t('modal.sovereigntyScore')} value={`${program.sovereigntyScore}/100`} />
          </div>
        </div>
      )}

      {tab === 'Pathways' && program.pathways && (
        <ul className="space-y-3">
          {program.pathways.map((pw) => (
            <li key={pw.type} className="card-muted border-l-4 border-l-mp-btc">
              <div className="font-display font-semibold text-mp-ink text-sm">{pw.label}</div>
              <div className="mt-1">
                <BtcDualPrice usd={pw.min_investment_usd} size="xs" layout="inline" />
              </div>
              <p className="text-xs text-mp-ink-secondary mt-2 leading-relaxed">{pw.notes}</p>
            </li>
          ))}
        </ul>
      )}

      {tab === 'Finance' && (
        <dl className="text-sm space-y-3">
          {[
            [t('modal.minInvestment'), program.minInvestment ?? 0],
            [t('modal.typical'), program.typicalInvestment ?? 0],
            [t('modal.govFees'), program.govFees ?? 0],
          ].map(([dt, usd]) => (
            <div key={String(dt)} className="flex justify-between items-center border-b border-mp-border-subtle pb-2">
              <dt className="text-mp-ink-muted">{dt}</dt>
              <dd><BtcDualPrice usd={usd as number} size="sm" layout="stack" className="items-end" /></dd>
            </div>
          ))}
          <div className="flex justify-between border-b border-mp-border-subtle pb-2">
            <dt className="text-mp-ink-muted">{t('modal.processing')}</dt>
            <dd className="font-mono text-mp-ink font-medium">{program.processingTimeMonths ?? '—'} {t('modal.months')}</dd>
          </div>
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
          {program.bitcoinSpecific && <p className="text-mp-btc-text font-medium">{program.bitcoinSpecific}</p>}
          {program.cryptoFriendlyScore != null && (
            <div className="flex items-center gap-2 text-mp-ink">
              <Zap size={14} className="text-mp-btc" /> {t('modal.score')}: {program.cryptoFriendlyScore}/10
            </div>
          )}
          {program.proofUrl && (
            <a href={program.proofUrl} target="_blank" rel="noopener noreferrer" className="proof-badge inline-flex items-center gap-1 hover:opacity-90">
              {t('modal.verifyBlock')} #{program.proofBlockHeight ?? '—'} <ExternalLink size={12} />
            </a>
          )}
          <BtcMapProgramPanel programName={program.country} programId={program.id} />
        </div>
      )}

      {tab === 'Critical' && program.criticalTests && (
        <div className="space-y-3">
          <div className="grid gap-2">
            <TestBadge pass={program.criticalTests.live_and_work} label={t('modal.testLiveWork')} />
            <TestBadge pass={program.criticalTests.scope_of_freedom} label={t('modal.testScope')} />
            <TestBadge pass={program.criticalTests.dual_citizenship} label={t('modal.testDual')} />
          </div>
          {program.criticalTests.notes && (
            <p className="text-xs text-mp-ink-secondary leading-relaxed card-muted">{program.criticalTests.notes}</p>
          )}
        </div>
      )}

      {tab === 'Legal' && (
        <div className="text-sm text-mp-ink-secondary space-y-3">
          <p className="card-muted leading-relaxed">
            {t('modal.legalStatus')}: <strong className="text-mp-ink">{program.status ?? '—'}</strong>. {t('modal.lastChecked')}{' '}
            {program.lastChecked ?? '—'}. {t('modal.legalDisclaimer')}
          </p>
          {program.legalCompliance && (
            <>
              <div>
                <h4 className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary mb-1">{t('modal.primaryLaws')}</h4>
                <ul className="text-xs space-y-1">{program.legalCompliance.primary_laws.map((l) => <li key={l}>• {l}</li>)}</ul>
              </div>
              <div>
                <h4 className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary mb-1">{t('modal.officialSources')}</h4>
                <ul className="text-xs space-y-1">
                  {program.legalCompliance.official_urls.map((u) => (
                    <li key={u}><a href={u} className="text-accent hover:underline break-all" target="_blank" rel="noopener noreferrer">{u}</a></li>
                  ))}
                </ul>
              </div>
              <p className="text-xs"><strong>{t('modal.property')}:</strong> {program.legalCompliance.property_foreign_ownership}</p>
              <p className="text-xs"><strong>{t('modal.recentChanges')}:</strong> {program.legalCompliance.recent_changes}</p>
            </>
          )}
        </div>
      )}

      {tab === 'Paige' && program.paigeFields && (
        <div className="text-sm space-y-4 text-mp-ink-secondary">
          <div>
            <h4 className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary mb-2">{t('modal.paigeQuestions')}</h4>
            <ul className="text-xs space-y-1">{program.paigeFields.common_questions.map((q) => <li key={q}>• {q}</li>)}</ul>
          </div>
          <div>
            <h4 className="font-chrome text-[11px] uppercase tracking-wide text-mp-wax mb-2">{t('modal.paigeRedFlags')}</h4>
            <ul className="text-xs space-y-1">{program.paigeFields.red_flags.map((q) => <li key={q}>⚠ {q}</li>)}</ul>
          </div>
          <div>
            <h4 className="font-chrome text-[11px] uppercase tracking-wide text-mp-btc-text mb-2">{t('modal.paigeTips')}</h4>
            <ul className="text-xs space-y-1">{program.paigeFields.optimization_tips.map((q) => <li key={q}>→ {q}</li>)}</ul>
          </div>
          <p className="text-xs card-muted">{t('modal.paigeEscalate')}: {program.paigeFields.escalate_when}</p>
        </div>
      )}

      {tab === 'Sources' && (
        <ul className="text-sm space-y-2">
          {(program.sources?.length ? program.sources : [t('modal.noSources')]).map((s) => (
            <li key={s} className="text-mp-ink-secondary flex gap-2"><span className="text-mp-btc">•</span> {s}</li>
          ))}
        </ul>
      )}

      {onAddToStack && (
        <div className="mt-6 flex flex-col gap-3 border-t border-mp-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-mp-ink-tertiary">{t('modal.figuresNote')}</p>
          <button
            type="button"
            onClick={() => onAddToStack(program)}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-chrome text-sm font-semibold transition-transform duration-fast ease-spring-snappy hover:-translate-y-0.5 ${
              inPortfolio
                ? 'border border-mp-border bg-mp-section text-mp-ink-secondary'
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