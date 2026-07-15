import type {
  ComplianceClock,
  CriticalTests,
  LegalCompliance,
  PaigeFields,
  ProgramPathway,
} from '../../types/program';

export type ProgramModalTab =
  | 'Overview'
  | 'Pathways'
  | 'Finance'
  | 'Bitcoin'
  | 'Critical'
  | 'Legal'
  | 'Paige'
  | 'Sources';

export interface Program {
  id: string;
  country: string;
  countryCode: string;
  tier: 'Citizenship' | 'Residency' | 'Golden Visa';
  region: string;
  minInvestment: number;
  timelineDays: number;
  sovereigntyScore: number;
  proofStatus: 'verified' | 'pending' | 'demo';
  proofRef?: string;
  summary: string;
  flag?: string;
  category?: string;
  status?: string;
  lastChecked?: string;
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
}

export function scoreWeight(score: number): 'flagship' | 'standard' {
  return score >= 85 ? 'flagship' : 'standard';
}

export function hasFlagshipDepth(program: Program): boolean {
  return !!(program.flagshipDepth && program.pathways?.length);
}