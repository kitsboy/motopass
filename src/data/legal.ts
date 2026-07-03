/** EU-focused legal copy — MotoPass is not accepting applications or personal data yet */

export const LEGAL_LAST_UPDATED = '2026-07-02'
export const LEGAL_VERSION = 'BUILD-016-EU-1.0'

export const LEGAL_SECTIONS = [
  {
    id: 'status',
    title: 'Service status — no data collection',
    body: `MotoPass (motopass.giveabit.io) is an informational research and demonstration platform operated by Give A Bit. 
As of ${LEGAL_LAST_UPDATED}, we do **not** accept passport applications, residency filings, payments for government programs, or any personal identification documents through this website. 
No registration form on this site collects, stores, or processes personal data on Give A Bit servers. Nostr connection features, when used, interact with public or user-selected relays under your control — not a central MotoPass database.`,
  },
  {
    id: 'not-advice',
    title: 'Not legal, tax, or investment advice',
    body: `All program descriptions, cost figures, timelines, and Bitcoin integration notes are research summaries for educational purposes only. They do not constitute legal, tax, immigration, or investment advice in any jurisdiction, including all 27 EU Member States and the European Economic Area. 
Government rules change without notice. You must retain qualified counsel licensed in relevant jurisdictions before making residency or citizenship decisions. MotoPass and Give A Bit are not law firms, financial advisers, or licensed immigration agents.`,
  },
  {
    id: 'gdpr',
    title: 'GDPR & UK GDPR (informational posture)',
    body: `**Controller (future):** Give A Bit — contact hello@giveabit.io. 
**Current processing:** Minimal technical logs via Cloudflare Pages (EU/US data transfer safeguards per Cloudflare DPA). No account database, no KYC, no application intake. 
**Legal bases (when processing begins):** Consent (Art. 6(1)(a)), contract (Art. 6(1)(b)), legitimate interest for security logs (Art. 6(1)(f)) — each documented in an updated privacy notice before launch. 
**Rights:** When personal data is processed, data subjects in the EU/UK may request access, rectification, erasure, restriction, portability, and objection — hello@giveabit.io. 
**DPO:** Appointment prior to any large-scale personal data processing. 
**International transfers:** Standard Contractual Clauses where required. 
**Retention:** Zero personal application data retained in current build.`,
  },
  {
    id: 'eprivacy',
    title: 'ePrivacy & cookies',
    body: `Essential cookies/localStorage: theme preference (motopass-theme), language (motopass-lang), optional client-side portfolio simulation — stored only in your browser. 
No third-party advertising cookies. No cross-site tracking pixels. Analytics, if introduced, will require prior consent under Directive 2002/58/EC as transposed in EU member states.`,
  },
  {
    id: 'consumer',
    title: 'EU consumer protection',
    body: `When paid services launch, pre-contractual information per Consumer Rights Directive 2011/83/EU will be provided: total price, payment method, performance duration, and withdrawal rights where applicable. 
Digital content and distance contracts will include 14-day withdrawal where not exempt. Clear identification of the trader (Give A Bit legal entity name and address) before any charge.`,
  },
  {
    id: 'mica',
    title: 'MiCA & crypto-asset disclaimer',
    body: `MotoPass discusses Bitcoin and Lightning in the context of sovereign mobility research. We do not issue, offer, or place crypto-assets to the public under Regulation (EU) 2023/1114 (MiCA). 
Server-cost donations are voluntary tips to offset infrastructure — not token sales or investment products. Satohash verification links are third-party proof tools, not Give A Bit guarantees of government accuracy.`,
  },
  {
    id: 'liability',
    title: 'Limitation of liability (EU)',
    body: `To the fullest extent permitted by applicable law, including the Unfair Contract Terms Directive 93/13/EEC as transposed: 
(1) MotoPass is provided "as is" and "as available" without warranties of accuracy, completeness, or fitness for a particular purpose. 
(2) Give A Bit shall not be liable for indirect, consequential, or punitive damages, lost profits, or immigration outcomes arising from reliance on research data. 
(3) Aggregate liability for direct damages shall not exceed €100 or the amount you paid Give A Bit in the twelve months preceding the claim, whichever is greater — except where liability cannot be limited under mandatory national law (including death/personal injury caused by negligence, or fraud). 
(4) Nothing excludes liability for intentional misconduct or gross negligence where non-excludable.`,
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    body: `MotoPass branding, UI, research structuring, and documentation © Give A Bit. Open-source components retain their licenses. 
Country flags and government extracts remain subject to their respective sources. You may not scrape, resell, or misrepresent MotoPass data as official government publication.`,
  },
  {
    id: 'governing',
    title: 'Governing law & disputes',
    body: `These terms are governed by the laws of Ireland, without regard to conflict-of-law rules, subject to mandatory consumer protections in your country of residence. 
EU consumers may use the ODR platform: https://ec.europa.eu/consumers/odr. Courts of competent jurisdiction in Ireland for business users; consumers may bring proceedings in their member state of residence.`,
  },
  {
    id: 'contact',
    title: 'Legal contact',
    body: `Questions: hello@giveabit.io · Subject: "MotoPass legal". 
Supervisory authority (when processing personal data): Data Protection Commission, Ireland — https://www.dataprotection.ie`,
  },
] as const