export type JobPosting = {
  id: string
  title: string
  department: string
  location: string
  type: string
  summary: string
  responsibilities: string[]
  requirements: string[]
  niceToHave?: string[]
}

const MAIL = 'hello@giveabit.io'

export function jobMailto(job: JobPosting): string {
  const subject = encodeURIComponent(`Motopass job - ${job.title}`)
  const body = encodeURIComponent(
    `Hi Give A Bit team,\n\nI am applying for: ${job.title}\nDepartment: ${job.department}\n\n[Your intro, portfolio, and relevant experience]\n`
  )
  return `mailto:${MAIL}?subject=${subject}&body=${body}`
}

export const CAREERS_EMAIL = MAIL

export const JOB_POSTINGS: JobPosting[] = [
  {
    id: 'research-lead',
    title: 'Sovereign Research Lead',
    department: 'Research & Verification',
    location: 'Remote · EU / Americas time zones',
    type: 'Full-time · Senior',
    summary:
      'Own flagship-depth CBI/RBI program research across 50 jurisdictions. Every field you publish must be Satohash-verifiable and Bitcoin-relevant.',
    responsibilities: [
      'Expand and maintain research/countries.json to Uruguay flagship template depth',
      'Source official government extracts; coordinate OpenTimestamps proofs',
      'Score sovereignty, stacking synergy, Lightning readiness, and tax posture',
      'Publish weekly delta reports for policy changes across jurisdictions',
      'Train liaison agents and Paige AI on verified program snapshots',
    ],
    requirements: [
      '5+ years in immigration, private wealth, or jurisdictional advisory research',
      'Demonstrated ability to read primary legal sources (not marketing brochures)',
      'Comfort with structured JSON data models and citation discipline',
      'Bitcoin-native mindset — legal tender, territorial tax, Lightning corridors',
    ],
    niceToHave: ['OpenTimestamps or Satohash familiarity', 'Spanish or Portuguese fluency'],
  },
  {
    id: 'btc-verify-eng',
    title: 'Bitcoin Verification Engineer',
    department: 'Engineering · Satohash',
    location: 'Remote · Global',
    type: 'Full-time',
    summary:
      'Build the “Truth You Can Verify” pipeline — hash program snapshots, stamp via OpenTimestamps, surface proofs in MotoPass UI.',
    responsibilities: [
      'Integrate Satohash.io stamping into MotoPass data publish workflow',
      'Display block height, OTS receipts, and one-click verify flows',
      'Automate re-stamp on material JSON changes with CI gates',
      'Harden verify page for offline OTS file validation',
      'Document verification architecture for auditors and users',
    ],
    requirements: [
      'Strong TypeScript; experience with crypto.subtle / SHA-256 pipelines',
      'Understanding of Bitcoin block structure and OpenTimestamps',
      'Security mindset for proof integrity and tamper evidence',
    ],
    niceToHave: ['Rust or Go for stamping microservices', 'Prior work on notarization products'],
  },
  {
    id: 'lightning-eng',
    title: 'Lightning & Payments Engineer',
    department: 'Engineering · Rails',
    location: 'Remote · EU preferred',
    type: 'Full-time',
    summary:
      'Ship Layer 1 and Layer 2 payment rails for MotoPass server costs, premium stamping, and future marketplace fees.',
    responsibilities: [
      'Implement LND/Core Lightning invoice generation for platform fees',
      'Support BOLT11, BOLT12 offers, and on-chain fallback in PaymentMethods',
      'Build server-cost donation UX (footer modal) with live node health',
      'Design escrow patterns for future application fee holds',
      'Monitor channel liquidity and publish transparency reports',
    ],
    requirements: [
      'Hands-on Lightning Network development (LND, CLN, or LDK)',
      'Bitcoin on-chain address handling (bech32, silent payments awareness)',
      'Production API design; never custody user funds without clear UX',
    ],
    niceToHave: ['Liquid or RGB experience', 'BOLT12 offer implementation'],
  },
  {
    id: 'nostr-architect',
    title: 'Nostr Identity Architect',
    department: 'Engineering · Identity',
    location: 'Remote',
    type: 'Full-time · Senior',
    summary:
      'Make npub the primary identity layer — connect, apply, alerts, and liaison matching without email or central KYC.',
    responsibilities: [
      'Deploy and operate relay.motopass.giveabit.io with sensible retention',
      'Implement NIP-04/NIP-44 DM flows for applicant ↔ agent chat',
      'Event kinds for program updates, policy alerts, proof notifications',
      'Nostr Connect UX hardening on mobile and desktop',
      'Dual-proof binding: Nostr events anchored to Bitcoin block hashes',
    ],
    requirements: [
      'Deep nostr-tools or rust-nostr experience',
      'Privacy-by-design; minimal metadata collection',
      'Understanding of relay moderation and abuse resistance',
    ],
  },
  {
    id: 'eu-legal',
    title: 'EU Legal & Compliance Counsel',
    department: 'Legal · Safe Harbour',
    location: 'Remote · EU resident required',
    type: 'Contract → Full-time',
    summary:
      'Frame MotoPass for EU operations: GDPR, consumer protection, MiCA-adjacent disclosures, and zero-collection launch posture.',
    responsibilities: [
      'Maintain Terms of Service, liability limits, and jurisdiction notices',
      'GDPR DPIA for future data processing; cookie/consent strategy',
      'MiCA and AML framing for Bitcoin payment rails (non-custodial posture)',
      'Review country program copy — no unlicensed legal or investment advice',
      'Vendor and liaison agent agreements under EU consumer law',
    ],
    requirements: [
      'Qualified in an EU member state; English fluent',
      'Experience with fintech, regtech, or information society services',
      'Comfort with Bitcoin-native products and non-custodial models',
    ],
    niceToHave: ['Irish or Estonian corporate law familiarity', 'eIDAS awareness'],
  },
  {
    id: 'liaison-pm',
    title: 'Country Liaison Program Manager',
    department: 'Operations · Agents',
    location: 'Remote · Multi-region',
    type: 'Full-time',
    summary:
      'Recruit and onboard jurisdiction liaison agents — npub-native, Satohash-verified, applicant-trusted.',
    responsibilities: [
      'Define agent onboarding playbook per country (Uruguay template first)',
      'Verify agent credentials; publish agent cards with proof badges',
      'Match applicants to agents via Nostr + program filters',
      'SLA for response times; escalation to Paige AI and human review',
      'Coordinate with research lead on agent-sourced program updates',
    ],
    requirements: [
      'Program or partnership management in immigration, legal, or concierge services',
      'Excellent written communication; multilingual a plus',
      'Bitcoin and Nostr literacy — you will use the product daily',
    ],
  },
  {
    id: 'frontend-senior',
    title: 'Senior Frontend Engineer',
    department: 'Engineering · Product',
    location: 'Remote',
    type: 'Full-time · Senior',
    summary:
      'Own the Luminous Sovereign design system — light/dark, motion, mobile-first, self-evolving pitch and finance UX.',
    responsibilities: [
      'Extend Vite/React/Tailwind component library (ClassyModal, charts, forms)',
      'Ship accessible, mobile-first flows for 14 routes',
      'Performance budgets; code-split heavy pitch and simulator views',
      'Storybook or visual regression for design tokens',
      'Collaborate with Stitch/design skills on new sovereign UI patterns',
    ],
    requirements: [
      '5+ years React + TypeScript; Tailwind design systems',
      'Motion/animation taste without hurting performance',
      'Accessibility (WCAG 2.1 AA) on modals, forms, and data tables',
    ],
    niceToHave: ['motion/react', 'Playwright E2E', 'i18n/RTL experience'],
  },
]