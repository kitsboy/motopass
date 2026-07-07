export type ProgramModalTab = 'Overview' | 'Finance' | 'Bitcoin' | 'Legal' | 'Sources';

export interface Program {
  id: string;
  country: string;
  countryCode: string; // ISO-2, for flag rendering
  tier: 'Citizenship' | 'Residency' | 'Golden Visa';
  region: string;
  minInvestment: number;
  timelineDays: number;
  sovereigntyScore: number; // 0–100, drives visual weight
  proofStatus: 'verified' | 'pending' | 'demo';
  proofRef?: string;
  summary: string;
  /** Extended fields for modal tabs — populated by programAdapter */
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
}

/** Visual weight tier derived from sovereigntyScore — used by ProgramCard & table rows */
export function scoreWeight(score: number): 'flagship' | 'standard' {
  return score >= 85 ? 'flagship' : 'standard';
}
