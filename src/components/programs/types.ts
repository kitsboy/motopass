import type {
  AuditEntry,
  ComplianceClock,
  CriticalTests,
  IntelClaim,
  LegalCompliance,
  PaigeFields,
  ProgramFreshness,
  ProgramPathway,
  ProgramScorecard,
  WatchUrl,
} from '../../types/program';

export type ProgramModalTab =
  | 'Overview'
  | 'Pathways'
  | 'Finance'
  | 'Bitcoin'
  | 'Critical'
  | 'Legal'
  | 'Intel'
  | 'Paige'
  | 'Evidence'
  | 'Sources';

export interface Program {
  id: string;
  country: string;
  countryCode: string;
  tier: 'Citizenship' | 'Residency' | 'Golden Visa';
  region: string;
  minInvestment: number;
  /** False when the record carries no minimum: callers must print "not on file". */
  /** Claim records copied from the corpus: which figures have a page behind them. */
  claimSources?: Record<string, { url?: string; quote?: string; fetched?: string }>
  minClaim?: { url?: string; quote?: string; fetched?: string } | null
  minOnFile?: boolean;
  timelineDays: number;
  sovereigntyScore: number;
  proofStatus: 'verified' | 'recorded' | 'pending' | 'demo';
  /** Money/time figures on this record with no official page behind them. */
  unverifiedFigures?: number;
  /** open | closed | changed | unknown — traced in the corpus, or not stated. */
  routeStatus?: 'open' | 'closed' | 'changed' | 'unknown';
  proofRef?: string;
  summary: string;
  flag?: string;
  category?: string;
  status?: string;
  lastChecked?: string;
  /** Weekly source probe (`watch.last_probe_at`). Not the research `lastChecked` date. */
  lastProbed?: string | null;
  proofStampedAt?: string;
  bitcoinIntegration?: string;
  bitcoinSpecific?: string;
  cryptoFriendlyScore?: number | null;
  typicalInvestment?: number | null;
  govFees?: number | null;
  processingTimeMonths?: string | null;
  taxBenefits?: string;
  stackingSynergy?: string;
  riskLevel?: string;
  lightningReady?: boolean;
  /** BTC/crypto mentioned in official policy/law (research highlight). */
  policyMentionsBtc?: boolean;
  /** Genuinely BTC/crypto-friendly jurisdiction (research highlight). */
  highlightBtcFriendly?: boolean;
  sources?: string[];
  proofUrl?: string;
  proofBlockHeight?: number;
  flagshipDepth?: boolean;
  flagshipTier?: 'template' | 'deep';
  pathways?: ProgramPathway[];
  criticalTests?: CriticalTests;
  legalCompliance?: LegalCompliance;
  complianceClock?: ComplianceClock;
  paigeFields?: PaigeFields;
  /** Schema v3 intel — surfaced from the daily Country Intel pipeline. */
  freshness?: ProgramFreshness;
  watchChanged?: boolean;
  /** Veritas v1 — per-source probe results from the watchdog pipeline. */
  watchUrls?: WatchUrl[];
  watchProbedAt?: string | null;
  pros?: IntelClaim[];
  cons?: IntelClaim[];
  scorecard?: ProgramScorecard;
  auditTrail?: AuditEntry[];
}

export function scoreWeight(score: number): 'flagship' | 'standard' {
  return score >= 85 ? 'flagship' : 'standard';
}

export function hasFlagshipDepth(program: Program): boolean {
  return !!(program.flagshipDepth && program.pathways?.length);
}