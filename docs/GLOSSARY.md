# MotoPass Glossary

**BUILD-2026.07.14-28**

Precise, shared language is part of the product. This glossary defines key terms as used across MotoPass documentation, UI, Paige responses, marketing, and handoffs.

## Core Concepts

**CBI (Citizenship by Investment)**  
Formal government programs that grant citizenship (and usually a passport) in exchange for a qualifying investment (donation, real estate, government bonds, business, etc.). Also called “golden passports.” Only ~22 countries have operated formal programs in recent years. Distinguished from RBI by the grant of citizenship rather than (or in addition to) residency.

**RBI (Residency by Investment) / Golden Visa**  
Programs that grant legal residency (right to live, and often work) in exchange for investment. More than 100 countries have some form. Residency is often a pathway to citizenship after a number of years. Examples: Portugal Golden Visa, UAE Golden Visa, Uruguay investor residency, Georgia fast-track options.

**Jurisdictional Stacking**  
The deliberate combination of multiple residencies, citizenships, or legal presences across countries to optimize for tax, mobility, risk diversification, lifestyle, banking access, and Bitcoin rails. The core strategic activity MotoPass is designed to support. A “stack” is a named, modeled combination of programs.

**Sovereignty Score (MotoPass internal)**  
A composite metric (0–100) that estimates the practical freedom and optionality delivered by a program or stack. Factors include: passport strength (visa-free count), treaty access (Mercosur, EU, CARICOM, etc.), dual-citizenship permissiveness, live/work rights, banking/fintech access, and Bitcoin-native friendliness. Not an official government score.

**Stacking Synergy**  
The additional benefit (or friction) created by combining specific programs. Examples: Uruguay + El Salvador (Mercosur mobility + strong Bitcoin legal tender signal + territorial tax), Switzerland + Singapore (Crypto Valley infrastructure + Asian hub with no capital gains tax). The simulator is designed to surface and quantify these.

**Territorial Tax System**  
A tax regime in which a jurisdiction taxes only income sourced within its borders (or, in some cases, only income remitted). Foreign-sourced income — including, in favorable structures, crypto gains — is often not taxed. Highly attractive for Bitcoin holders. Uruguay, Panama, Malaysia, and others are classic examples. Always verify current rules and structuring requirements.

**Bitcoin Legal Tender**  
A jurisdiction where Bitcoin is (or was) granted official legal tender status, meaning it can be used to pay debts, taxes, or must be accepted by merchants (with varying degrees of compulsion). As of 2026, only El Salvador (now voluntary acceptance after 2025 reforms) and the Central African Republic have adopted such frameworks. Strong signaling and practical infrastructure effects even when not mandatory.

**Lightning Ready / Lightning Acceptance**  
Indicates meaningful real-world ability to pay or be paid in Bitcoin via the Lightning Network (BOLT12 offers preferred for static, reusable invoices). Includes merchants, law firms, real estate agents, government-adjacent services, or program fees that can be settled over Lightning. [btcmap.org](https://btcmap.org) is the primary merchant reference.

**BTC Map / Merchant Layer**  
The open community map of Bitcoin-accepting merchants maintained by [teambtcmap](https://github.com/teambtcmap). MotoPass integrates via [btcmap-api](https://github.com/teambtcmap/btcmap-api) v4: nearby search per jurisdiction, area chips, Leaflet pins on `/btcmap`, and density badges on program cards. Data can be refreshed with `npm run btcmap:density` and `npm run btcmap:sync`.

**Merchant Density (MotoPass)**  
A pre-computed count of BTC Map merchants within each program's search radius. Displayed as a badge on program cards with tiers: sparse (&lt;5), moderate (5–19), dense (20+). Stored in `public/data/btcmap-density.json`.

**btcmap-cli**  
Command-line tool for power users to sign up and tag venues on BTC Map. MotoPass links to the [btcmap-cli repo](https://github.com/teambtcmap/btcmap-cli) from the report-venue CTA alongside the web flow at btcmap.org/add-location.

**“Truth You Can Verify” (Prime Directive)**  
The non-negotiable MotoPass principle: every material data point, legal extract, cost, requirement, user action, and platform update that matters must be independently verifiable on the Bitcoin blockchain via OpenTimestamps + Satohash (or equivalent). This is the trust model, the marketing through-line, the UI treatment requirement, and the filter for feature decisions.

## Technical & Protocol Terms

**Satohash / Satohash.io (or giveabit.io instance)**  
The friendly explorer and proof presentation layer for OpenTimestamps proofs on Bitcoin. Provides human-readable links, block height context, and verification flows. The primary way users and third parties will “click to verify” inside MotoPass.

**OpenTimestamps (OTS)**  
The open protocol and tools for creating and verifying Bitcoin timestamps on arbitrary data without trusted intermediaries. Calendars aggregate hashes and commit them periodically to Bitcoin. Anyone with the original data + the OTS proof file can independently verify.

**Nostr**  
The open, decentralized protocol for signed events and relays. MotoPass uses Nostr as the primary identity layer (pubkeys instead of emails where possible), notification and alert bus, private messaging channel for Paige, and publication mechanism for program updates and community research. Private relays protect sensitive user context.

**BOLT12**  
A Lightning Network improvement for reusable, static invoices/offers. Preferred payment primitive for MotoPass program fees and subscriptions because it is privacy-friendly and UX-simple (“pay this offer” rather than a new invoice every time).

**Silent Payments (BIP352)**  
A Bitcoin protocol for generating one-time addresses from a static “silent payment address.” Enables maximum-privacy one-time or donation-style payments without address reuse. Supported as a first-class option alongside BOLT12 and on-chain.

**Liquid Network**  
A Bitcoin sidechain (federated) offering faster, more private, and asset-issuance-capable transactions. Useful for larger settlements, confidential transactions, and certain smart-contract-like escrow patterns in the marketplace phase.

**Proof / Stamp / Satohash Proof**  
A cryptographic receipt that a specific piece of data (JSON blob, legal text, stack report, user decision) existed at or before a particular Bitcoin block height. Displayed in UI as a block number + link; downloadable as OTS file where appropriate.

## Product & Experience Terms

**Paige**  
MotoPass’s AI concierge. Grounded exclusively in the verified corpus. Proactive via Nostr. Escalates cleanly. Named and positioned as a calm, precise, empowering research partner — not a lawyer or tax advisor.

**My Portfolio**  
The section of the app where a user maintains their acquired programs, personal notes, capital deployed, and target dates. Local-first, exportable, optionally Nostr-publishable (sanitized).

**Stack Simulator / Jurisdictional Stacking Simulator**  
The interactive tool for selecting multiple programs and seeing live combined metrics: total capital, timelines (parallel/serial), tax synergy, sovereignty score uplift, Bitcoin/Lightning readiness of the combined stack, and visual funding-flow style representations. The heart of the “planning” experience.

**Finance Deep Dive / Finance Compare**  
Rich modal or view showing full cost breakdown, ROI projections, tax scenario modeling, Bitcoin integration details, legal/risk notes, sources with proofs, and side-by-side comparison against other programs.

**Pristine Demo / Reference Implementation**  
The self-contained single-file `website/index.html` (plus `research/countries.json`). Zero-build, zero-dependency, fully functional dashboard that serves as the living specification of current scope and aesthetic. It is intentionally kept clean and impressive for sharing and as a stable artifact while the modern Vite/React app evolves.

**Sovereign Black / Bitcoin Orange / DESIGN.md System**  
The official visual language: #0a0a0a (background), #111111 (surfaces), #F7931A (primary accent), glassmorphic borders, Space Grotesk display, Inter body, generous rounding, custom imagery. The modern frontend must converge on this system.

**Verified Advisor / Marketplace Provider (Future)**  
A law firm, relocation specialist, tax strategist, or real-estate professional who has opted into the MotoPass network, completed basic reputation bootstrapping (stamped reviews or transactions), and appears in the directory. Reputation is portable and auditable via Nostr pubkey + stamps.

## Other

**Mercosur, CARICOM, EU, etc.**  
Regional treaty/access groupings that materially affect live/work rights and mobility for holders of residency or citizenship in member states. Critical inputs to the 3 Critical Tests and stacking synergy calculations.

**Apostille**  
The certification (under the Hague Convention) that makes foreign documents (birth certificates, police records, etc.) legally recognized in the destination country. Almost always required for CBI/RBI applications. Time and cost are frequently underestimated.

**Due Diligence (DD)**  
The background, source-of-funds, and health checks performed by programs. Crypto-sourced wealth requires extra care in documentation and structuring. Paige and the risk fields are designed to surface common friction points.

**Safe Harbour (templates, future)**  
Open-source legal and structuring templates, disclaimers, and best-practice checklists that users and advisors can adapt. Timestamped and versioned. Not legal advice; a starting point that reduces reinvention and improves baseline quality.

---

This glossary is living. When new concepts are introduced in PRODUCT-SCOPE, MARKETING, or code, they must be added here with crisp definitions before widespread use.

Use these terms consistently in UI labels, Paige responses, docs, and external communication.

**Truth You Can Verify.**

— Documentation Layer, MotoPass  
BUILD-2026.07.14-28