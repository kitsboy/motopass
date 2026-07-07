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
}

/** Visual weight tier derived from sovereigntyScore — used by ProgramCard & table rows */
export function scoreWeight(score: number): 'flagship' | 'standard' {
  return score >= 85 ? 'flagship' : 'standard';
}
