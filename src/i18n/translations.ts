import type { LangCode } from './languages'
import { pageKeysEn, type PageKey } from './pageKeys/en'

export type TranslationKey =
  | 'nav.pitch'
  | 'nav.portfolio'
  | 'nav.programs'
  | 'nav.simulator'
  | 'nav.compare'
  | 'nav.vault'
  | 'nav.distressed'
  | 'nav.blog'
  | 'nav.verify'
  | 'nav.trust'
  | 'nav.agents'
  | 'nav.apply'
  | 'nav.dashboard'
  | 'nav.register'
  | 'nav.dashboardShort'
  | 'nav.profile'
  | 'nav.btcmap'
  | 'nav.demo'
  | 'nav.more'
  | 'nav.language'
  | 'nav.languageSystem'
  | 'nav.languageShortcut'
  | 'nav.backToTop'
  | 'nav.pageSections'
  | 'nav.menu'
  | 'nav.close'
  | 'nav.explore'
  | 'nav.tools'
  | 'nav.skip'
  | 'tagline'
  | 'pitch.hero'
  | 'pitch.sub'
  | 'pitch.cta'
  | 'pitch.evolve'
  | 'pitch.stackSimulator'
  | 'pitch.feature.jurisdictions.title'
  | 'pitch.feature.jurisdictions.sub'
  | 'pitch.feature.satohash.title'
  | 'pitch.feature.satohash.sub'
  | 'pitch.feature.nostr.title'
  | 'pitch.feature.nostr.sub'
  | 'pitch.feature.agents.title'
  | 'pitch.feature.agents.sub'
  | 'pitch.feature.live.title'
  | 'pitch.feature.live.sub'
  | 'pitch.stack.eyebrow'
  | 'pitch.stack.title'
  | 'pitch.stack.satohash.title'
  | 'pitch.stack.satohash.body'
  | 'pitch.stack.satohash.cta'
  | 'pitch.stack.nostr.title'
  | 'pitch.stack.nostr.body'
  | 'pitch.stack.nostr.cta'
  | 'pitch.stack.distressed.title'
  | 'pitch.stack.distressed.body'
  | 'pitch.stack.distressed.cta'
  | 'pitch.evolve.eyebrow'
  | 'pitch.evolve.title'
  | 'pitch.evolve.body'
  | 'pitch.roadmap.next'
  | 'pitch.roadmap.btcmap'
  | 'pitch.roadmap.lightning'
  | 'pitch.roadmap.relay'
  | 'pitch.roadmap.uruguay'
  | 'pitch.roadmap.agents'
  | 'blog.title'
  | 'blog.filter'
  | 'blog.read'
  | 'blog.empty'
  | 'blog.all'
  | 'programs.title'
  | 'programs.search'
  | 'programs.showAdvanced'
  | 'programs.hideAdvanced'
  | 'programs.lightningOnly'
  | 'programs.minInvestment'
  | 'programs.maxInvestment'
  | 'programs.minCryptoScore'
  | 'programs.region'
  | 'programs.noMatch'
  | 'programs.inStack'
  | 'portfolio.empty'
  | 'portfolio.explore'
  | 'compare.empty'
  | 'vault.empty'
  | 'dashboard.connectPrompt'
  | 'dashboard.registerCta'
  | 'dashboard.alertsTitle'
  | 'dashboard.alertsSub'
  | 'dashboard.alertsPortfolio'
  | 'dashboard.alertsEmpty'
  | 'dashboard.alertsShowMore'
  | 'dashboard.alertsShowLess'
  | 'dashboard.alertsSource'
  | 'dashboard.alertsBrowse'
  | 'register.step'
  | 'simulator.eyebrow'
  | 'simulator.title'
  | 'simulator.subtitle'
  | 'simulator.selectPrograms'
  | 'simulator.filterPrograms'
  | 'simulator.noSearchMatch'
  | 'simulator.metrics'
  | 'simulator.stat.programs'
  | 'simulator.stat.cost'
  | 'simulator.stat.sovereignty'
  | 'simulator.stat.timeline'
  | 'simulator.tip.programs'
  | 'simulator.tip.cost'
  | 'simulator.tip.sovereignty'
  | 'simulator.tip.timeline'
  | 'simulator.modeled'
  | 'simulator.modeledShort'
  | 'compare.modeled'
  | 'simulator.stackName'
  | 'simulator.saveStack'
  | 'simulator.savedStacks'
  | 'simulator.savedCount'
  | 'payments.accept'
  | 'payments.history'
  | 'payments.demoNote'
  | 'payments.liveNote'
  | 'payments.liveLightning'
  | 'payments.liveBadge'
  | 'payments.demoBadge'
  | 'layout.skipToContent'
  | 'layout.registerNostr'
  | 'layout.demo'
  | 'footer.descriptionBefore'
  | 'footer.descriptionAfter'
  | 'footer.github'
  | 'footer.pristineDemo'
  | 'verify.title'
  | 'verify.sub'
  | 'verify.stamp'
  | 'agents.title'
  | 'agents.sub'
  | 'apply.title'
  | 'apply.sub'
  | 'apply.submit'
  | 'nostr.connect'
  | 'nostr.connected'
  | 'block.live'
  | 'block.retry'
  | 'btcPrice.label'
  | 'btcPrice.fallback'
  | 'btcPrice.copyHint'
  | 'btcPrice.copied'
  | 'pitch.btcmapCta'
  | 'footer.truth'
  | 'currency.label'
  | 'currency.btcFirstDefault'
  | 'currency.wholeBtc'
  | 'currency.suggested'
  | 'currency.liveRate'
  | 'currency.staleTag'
  | 'currency.fxUnavailable'
  | 'currency.degradedTitle'
  | 'trust.eyebrow'
  | 'trust.title'
  | 'trust.sub'
  | 'trust.promise'
  | 'trust.promiseBody'
  | 'trust.sweepFresh'
  | 'trust.compare'
  | 'trust.compareTitle'
  | 'trust.compareHint'
  | 'trust.compareMax'
  | 'trust.compareEmpty'
  | 'trust.addToCompare'
  | 'trust.clearCompare'
  | 'trust.removeCountry'
  | 'trust.filterAll'
  | 'trust.filterFresh'
  | 'trust.filterStale'
  | 'trust.error'
  | 'trust.loading'
  | 'trust.riskSuffix'
  | 'trust.freshnessLabel'
  | 'trust.sovScoreTitle'
  | 'trust.sovereignty'
  | 'trust.cardFresh'
  | 'trust.cardWatch'
  | 'trust.cardStale'
  | 'trust.details'
  | 'trust.trustLabel'
  | 'trust.fresh'
  | 'trust.watch'
  | 'trust.stale'
  | 'trust.ringAria'
  | 'trust.noDate'
  | 'trust.lastChecked'
  | 'trust.freshExplain'
  | 'trust.watchExplain'
  | 'trust.staleExplain'
  | 'trust.bitcoinAnchored'
  | 'trust.verifySatohash'
  | 'trust.proofOnFile'
  | 'trust.proofPending'
  | 'trust.proofPendingTitle'
  | 'trust.block'
  | 'trust.sha256'
  | 'trust.entryThreshold'
  | 'trust.thresholdAria'
  | 'trust.asOf'
  | 'trust.thresholdChanges'
  | 'trust.noHistory'
  | 'trust.tierOfficial'
  | 'trust.tierLegal'
  | 'trust.tierSecondary'
  | 'trust.tierOfficialDesc'
  | 'trust.tierLegalDesc'
  | 'trust.tierSecondaryDesc'
  | 'trust.tierNone'
  | 'trust.officialUrlTitle'
  | 'trust.officialSource'
  | 'trust.radarAria'
  | 'trust.pending'
  | 'trust.pendingVerify'
  | 'trust.hoverHint'
  | 'trust.axis.cryptoFriendly'
  | 'trust.axis.freedom'
  | 'trust.axis.stability'
  | 'trust.axis.tax'
  | 'trust.axis.cost'
  | 'trust.axis.mobility'
  | 'trust.axis.banking'
  | 'trust.auditTrail'
  | 'trust.minInvest'
  | 'nav.languageRecent'
  | 'menu.live'
  | 'menu.liveBTC'
  | 'menu.liveBlock'
  | 'menu.liveFresh'
  | 'menu.quickActions'
  | 'menu.stamp'
  | 'menu.verify'
  | 'menu.apply'
  | 'menu.searchNoResults'
  | 'menu.searchAll'
  | 'menu.featured'
  | 'menu.trustSummary'
  | 'menu.trustPending'
  | 'menu.viewTrust'
  | 'pitch.savings.costComparison'
  | 'pitch.savings.timeComparison'
  | 'pitch.savings.modeledDelta'
  | 'pitch.savings.daysFaster'
  | 'pitch.savings.closeAria'
  | 'pitch.savings.summaryAria'
  | 'pitch.explainerAria'
  | 'pitch.heroTaglineAria'
  | 'pitch.heroTagline.line1'
  | 'pitch.heroTagline.line2prefix'
  | 'pitch.heroTagline.line2accent'
  | 'pitch.heroTagline.line3neg'
  | 'pitch.heroTagline.line3struck'
  | 'pitch.liveMetricsAria'
  | 'pitch.loadingMetricsAria'
  | 'pitch.faq.copyLink'
  | 'programs.minInvest'
  | 'programs.timeline'
  | 'programs.score'
  | 'programs.tableSubtitle'
  | 'programs.tableAria'
  | 'programs.inPortfolio'
  | 'programs.flagshipDepth'
  | 'programs.loadingAria'
  | 'portfolio.nostrIdentity'
  | 'portfolio.loadingAria'
  | 'portfolio.renewalWindow'
  | 'portfolio.residencyTarget'
  | 'vault.hashPlaceholder'
  | 'verify.hashPlaceholder'
  | 'compare.loadingAria'
  | 'trust.loadingAria'
  | 'simulator.valueForks'
  | 'simulator.forkSavings'
  | 'simulator.avgSovereignty'
  | 'nav.mainNavigation'
  | 'nav.moreNavigation'
  | 'nav.mobileTabBar'
  | 'nav.bitcoinSpotPrice'
  | 'nav.siteTools'
  | 'nav.helpfulLinks'
  | 'nostr.copyNpub'
  | 'nostr.verifyNpub'
  | 'nostr.verifyOn'
  | 'nostr.disconnectAria'
  | 'nostr.disconnect'
  | 'paige.askAria'
  | 'paige.comingPhase2'
  | 'paige.notAvailable'
  | 'distressed.redFlags'
  | 'distressed.playsTitle'
  | 'blog.postNotFound'
  | 'apply.invoiceUnavailable'
  | 'fileUpload.tapToBrowse'
  | 'toast.dismissAria'
  | 'careers.join'
  | 'careers.niceToHave'
  | 'legal.termsTitle'
  | 'serverCosts.title'
  | 'serverCosts.subtitle'
  | 'intel.watchAria'
  | 'dashboard.verifyProof'
  | 'dashboard.alertFilters'
  | 'dashboard.paigeDismiss'
  | 'programs.jurisdiction'
  | 'programs.tier'
  | 'programs.proof'
  | 'programs.intel'
  | 'portfolio.complianceClock'
  | 'portfolio.citizenshipTrack'
  | 'compliance.critical'
  | 'compliance.warning'
  | 'compliance.healthy'
  | 'compliance.criticalTip'
  | 'compliance.warningTip'
  | 'compliance.healthyTip'
  | 'simulator.synergy'
  | 'simulator.vsTypical'
  | 'simulator.sideBySide'
  | 'trust.researchPending'
  | 'pitch.savings.legalDelta'
  | 'pitch.savings.legal'
  | 'pitch.savings.methodology'
  | 'pitch.savings.phase.opening'
  | 'pitch.savings.phase.cost'
  | 'pitch.savings.phase.time'
  | 'pitch.savings.phase.jurisdictions'
  | 'pitch.savings.phase.savings'
  | 'pitch.savings.phase.summary'
  | 'error.somethingWrong'
  | 'apply.feeRailUnreachable'
  | 'dashboard.paigePolicy'
  | 'vault.educationPlayerTitle'
  | 'vault.educationPlayerAria'
  | 'intel.statusChanged'
  | 'intel.statusReanchoring'
  | 'paige.conciergeAria'
  | PageKey

export type Dict = Record<TranslationKey, string>
/** A locale dict that may omit keys — `t` falls back to English for missing ones. */
export type PartialDict = Partial<Dict>

const en: Dict = {
  'nav.pitch': 'Pitch',
  'nav.portfolio': 'Portfolio',
  'nav.programs': 'Programs',
  'nav.simulator': 'Simulator',
  'nav.compare': 'Compare',
  'nav.vault': 'Vault',
  'nav.distressed': 'Distressed',
  'nav.dashboard': 'Dashboard',
  'nav.register': 'Register',
  'nav.dashboardShort': 'Dash',
  'nav.profile': 'Profile',
  'nav.btcmap': 'BTC Map',
  'nav.blog': 'Insights',
  'nav.verify': 'Verify',
  'nav.trust': 'Trust',
  'nav.agents': 'Agents',
  'nav.apply': 'Apply',
  'nav.demo': 'Demo',
  'nav.more': 'More',
  'nav.language': 'Language',
  'nav.menu': 'Menu',
  'nav.close': 'Close',
  'nav.explore': 'Explore',
  'nav.tools': 'Tools',
  'nav.skip': 'Skip to content',
  'menu.live': 'Live',
  'menu.liveBTC': 'BTC',
  'menu.liveBlock': 'Block',
  'menu.liveFresh': 'Fresh',
  'menu.quickActions': 'Quick actions',
  'menu.stamp': 'Stamp',
  'menu.verify': 'Verify',
  'menu.apply': 'Apply',
  'menu.searchNoResults': 'No programs match "{q}"',
  'menu.searchAll': 'All programs',
  'menu.featured': 'Featured',
  'menu.trustSummary': '{fresh} fresh · {watch} watch · {stale} stale',
  'menu.trustPending': 'Trust data pending…',
  'menu.viewTrust': 'Live trust',
  'pitch.savings.costComparison': 'Cost Comparison',
  'pitch.savings.timeComparison': 'Time Comparison',
  'pitch.savings.modeledDelta': 'Modeled delta',
  'pitch.savings.daysFaster': 'Days faster',
  'pitch.savings.closeAria': 'Close presentation',
  'pitch.savings.summaryAria': 'Modeled savings summary',
  'pitch.explainerAria': 'MotoPass 60 second explainer film',
  'pitch.heroTaglineAria': 'True citizenship Stamped in time Not bureaucracy',
  'pitch.heroTagline.line1': 'True citizenship',
  'pitch.heroTagline.line2prefix': 'Stamped in ',
  'pitch.heroTagline.line2accent': 'time',
  'pitch.heroTagline.line3neg': 'Not',
  'pitch.heroTagline.line3struck': 'bureaucracy',
  'pitch.liveMetricsAria': 'Live sovereignty metrics',
  'pitch.loadingMetricsAria': 'Loading live sovereignty metrics',
  'pitch.faq.copyLink': 'Copy link to this question',
  'programs.minInvest': 'Min. invest',
  'programs.timeline': 'Timeline',
  'programs.score': 'Score',
  'programs.tableSubtitle': 'Residency and citizenship programs by jurisdiction',
  'programs.tableAria': 'Residency and citizenship programs',
  'programs.inPortfolio': 'In portfolio',
  'programs.flagshipDepth': 'FLAGSHIP DEPTH',
  'programs.loadingAria': 'Loading programs',
  'portfolio.nostrIdentity': 'Nostr identity',
  'portfolio.loadingAria': 'Loading portfolio',
  'portfolio.renewalWindow': 'Renewal window',
  'portfolio.residencyTarget': 'Residency target',
  'vault.hashPlaceholder': 'SHA-256 content hash (64 hex)',
  'verify.hashPlaceholder': 'SHA-256 content hash (optional)',
  'compare.loadingAria': 'Loading comparison',
  'trust.loadingAria': 'Loading trust page',
  'simulator.valueForks': 'Value forks',
  'simulator.forkSavings': 'Fork savings',
  'simulator.avgSovereignty': 'Avg sovereignty',
  'nav.mainNavigation': 'Main navigation',
  'nav.moreNavigation': 'More navigation',
  'nav.mobileTabBar': 'Mobile tab bar',
  'nav.bitcoinSpotPrice': 'Bitcoin spot price',
  'nav.siteTools': 'Site tools',
  'nav.helpfulLinks': 'Helpful links',
  'nostr.copyNpub': 'Copy npub',
  'nostr.verifyNpub': 'Verify npub in a Nostr client',
  'nostr.verifyOn': 'Verify on Nostr (iris.to)',
  'nostr.disconnectAria': 'Disconnect Nostr',
  'nostr.disconnect': 'Disconnect',
  'paige.askAria': 'Ask Paige',
  'paige.comingPhase2': 'Coming Phase 2',
  'paige.notAvailable':
    'Paige AI is not available yet. See docs for the Phase 2 spec.',
  'distressed.redFlags': 'Red flags',
  'distressed.playsTitle': 'Distressed sovereign plays',
  'blog.postNotFound': 'Post not found',
  'apply.invoiceUnavailable': 'Invoice unavailable',
  'fileUpload.tapToBrowse': 'Tap to browse or scan with camera',
  'toast.dismissAria': 'Dismiss notification',
  'careers.join': 'Join MotoPass',
  'careers.niceToHave': 'Nice to have',
  'legal.termsTitle': 'Terms & EU Liability',
  'serverCosts.title': 'Server Costs',
  'serverCosts.subtitle':
    'Voluntary tips offset hosting, research CDN, and stamping infra',
  'intel.watchAria': 'Country intel watch',
  'dashboard.verifyProof': 'Verify proof',
  'dashboard.alertFilters': 'Alert filters',
  'dashboard.paigeDismiss': 'Dismiss Paige proof policy notice',
  tagline: 'Truth You Can Verify',
  'pitch.hero': 'The private OS for sovereign operators',
  'pitch.sub':
    'Live Data Engine — 50-country trust cards, Bitcoin-anchored and freshness-checked. Research jurisdictions, model stacks in ₿, verify every claim on-chain, apply with Nostr — no email, no brochure trust.',
  'pitch.cta': 'Explore programs',
  'pitch.evolve': 'Living pitch — updated with every BUILD',
  'pitch.stackSimulator': 'Stack simulator',
  'pitch.btcmapCta': 'BTC Map merchants',
  'btcPrice.label': 'Spot',
  'btcPrice.fallback': 'Using pitch-anchor reference rate',
  'btcPrice.copyHint': 'Click to copy spot price',
  'btcPrice.copied': 'Copied',
  'currency.label': 'Display currency',
  'currency.btcFirstDefault': 'BTC-first default',
  'currency.wholeBtc': 'Whole bitcoin',
  'currency.suggested': 'Suggested for your language',
  'currency.liveRate': 'Live rate',
  'currency.staleTag': 'Stale rate',
  'currency.fxUnavailable': 'FX unavailable',
  'currency.degradedTitle':
    'Live FX feed unreachable — showing last known good rates (stale) or BTC-only.',
  'pitch.feature.jurisdictions.title': '50 jurisdictions',
  'pitch.feature.jurisdictions.sub': 'CBI, RBI & Bitcoin-native pathways',
  'pitch.feature.satohash.title': 'Satohash proofs',
  'pitch.feature.satohash.sub': 'OpenTimestamps on every material claim',
  'pitch.feature.nostr.title': 'Nostr identity',
  'pitch.feature.nostr.sub': 'npub-native applications, no email',
  'pitch.feature.agents.title': 'Liaison agents',
  'pitch.feature.agents.sub': 'Country AI agents for real applicants',
  'pitch.feature.live.title': 'Live Data Engine',
  'pitch.feature.live.sub':
    '50-country trust cards — freshness rings, Bitcoin proof badges, honest staleness. Verify before you trust.',
  'pitch.stack.eyebrow': 'THE STACK',
  'pitch.stack.title': 'Bitcoin rails for sovereign mobility',
  'pitch.stack.satohash.title': 'Satohash.io — Truth You Can Verify',
  'pitch.stack.satohash.body':
    'Every program cost, legal extract, and passport milestone anchors to Bitcoin via OpenTimestamps. One click to verify — speed without sacrificing sovereignty.',
  'pitch.stack.satohash.cta': 'Verify now',
  'pitch.stack.nostr.title': 'Nostr-native',
  'pitch.stack.nostr.body':
    'Connect your npub. Policy alerts. Liaison agents. Dual-proof with Bitcoin block hashes.',
  'pitch.stack.nostr.cta': 'Meet agents',
  'pitch.stack.distressed.title': 'Distressed — proof-gated value plays',
  'pitch.stack.distressed.body':
    'Capital-efficient sovereign routes with ₿ asks, Satohash proof required, curated or permissionless lanes, and template escrow — MotoPass coordinates intelligence, never custody.',
  'pitch.stack.distressed.cta': 'Browse distressed',
  'pitch.evolve.eyebrow': 'EVOLVING PITCH',
  'pitch.evolve.title': 'Charts update with every BUILD',
  'pitch.evolve.body':
    'Cost and time savings are computed from live countries.json data — not static investor deck numbers. As jurisdictions, Lightning readiness, and Satohash proofs grow, this page evolves automatically.',
  'pitch.roadmap.next': 'Next',
  'pitch.roadmap.btcmap': 'BTC Map merchant layer per jurisdiction',
  'pitch.roadmap.lightning': 'Lightning fee rails for premium stamping',
  'pitch.roadmap.relay': 'Live Nostr relay at relay.motopass.giveabit.io',
  'pitch.roadmap.uruguay': 'Uruguay flagship depth across all 50 countries',
  'pitch.roadmap.agents': 'Official liaison agent onboarding per jurisdiction',
  'blog.title': 'Sovereign insights',
  'blog.filter': 'Filter by topic',
  'blog.read': 'Read',
  'blog.empty': 'No posts for this language/filter yet.',
  'blog.all': 'All',
  'programs.title': 'Residency & citizenship programs',
  'programs.search': 'Search programs…',
  'programs.showAdvanced': 'Show advanced filters',
  'programs.hideAdvanced': 'Hide advanced filters',
  'programs.lightningOnly': 'Lightning ready only',
  'programs.minInvestment': 'Min investment',
  'programs.maxInvestment': 'Max investment',
  'programs.minCryptoScore': 'Min crypto score',
  'programs.region': 'Region',
  'programs.noMatch': 'No programs match your filters.',
  'programs.inStack': 'in your stack',
  'portfolio.empty': 'No programs in your portfolio yet.',
  'portfolio.explore': 'Explore programs',
  'compare.empty': 'Select programs to compare',
  'vault.empty': 'No stamped proofs yet.',
  'dashboard.connectPrompt': 'Connect your Nostr account to view progress.',
  'dashboard.registerCta': 'Register with Nostr',
  'register.step': 'Step',
  'simulator.eyebrow': 'STACK SIMULATOR',
  'simulator.title': 'Jurisdictional stacking',
  'simulator.subtitle': 'Combine programs and model cost, sovereignty, and timeline.',
  'simulator.selectPrograms': 'Select programs',
  'simulator.filterPrograms': 'Filter programs…',
  'simulator.noSearchMatch': 'No programs match your search.',
  'simulator.metrics': 'Combined stack metrics',
  'simulator.stat.programs': 'Programs',
  'simulator.stat.cost': 'Total cost',
  'simulator.stat.sovereignty': 'Sovereignty',
  'simulator.stat.timeline': 'Max timeline',
  'simulator.tip.programs': 'How many citizenship programs are in your combined stack.',
  'simulator.tip.cost': 'Combined typical investment across your stack. Hover to see the modeled total.',
  'simulator.tip.sovereignty': 'Average sovereignty score (0–10) of the programs in your stack.',
  'simulator.tip.timeline': 'Longest estimated processing time in your stack, in months.',
  'simulator.modeled': 'Modeled for member evaluation only — illustrative sovereign-stacking economics, not a guarantee. Figures shown as exact USD and month counts for clarity.',
  'simulator.modeledShort': 'Modeled for member evaluation',
  'compare.modeled': 'These comparison figures are modeled for member evaluation only — indicative, not a guarantee of cost, timeline, or outcome.',
  'simulator.stackName': 'Stack name…',
  'simulator.saveStack': 'Save stack',
  'simulator.savedStacks': 'Saved stacks',
  'simulator.savedCount': 'programs',
  'payments.accept': 'Accept payment',
  'payments.history': 'Payment history',
  'payments.demoNote': 'Demo: {btc} BTC equivalent · BOLT12 offers & Silent Payments supported',
  'payments.liveNote':
    'Lightning Address live · suggested amount {btc} BTC · scan QR with any LNURL wallet',
  'payments.liveLightning': 'Live Lightning Address',
  'payments.liveBadge': 'LIVE',
  'payments.demoBadge': 'DEMO',
  'layout.skipToContent': 'Skip to content',
  'layout.registerNostr': 'Register with Nostr',
  'layout.demo': 'Demo',
  'footer.descriptionBefore':
    'Bitcoin-native sovereign passports and residency. Every claim verifiable on-chain via ',
  'footer.descriptionAfter': '. Nostr identity. Not accepting applications yet.',
  'footer.github': 'GitHub',
  'footer.pristineDemo': 'Pristine Demo',
  'verify.title': 'Verify on Bitcoin',
  'verify.sub': 'Every MotoPass data point anchors to OpenTimestamps via Satohash.io',
  'verify.stamp': 'Stamp application',
  'agents.title': 'Country liaison agents',
  'agents.sub': 'AI-assisted passport office liaisons — reachable on Nostr for verified applicants',
  'apply.title': 'Passport application tracker',
  'apply.sub': 'Register interest, timestamp your application hash, connect your npub',
  'apply.submit': 'Register & timestamp',
  'nostr.connect': 'Connect Nostr',
  'nostr.connected': 'Connected',
  'block.live': 'Bitcoin block',
  'footer.truth': 'Truth You Can Verify — Satohash + OpenTimestamps + Nostr',
  'trust.eyebrow': 'Trust · honesty by design',
  'trust.title': 'Live Trust Cards',
  'trust.sub':
    "We would rather show you old truth than new lies. Every number below traces to a real source and is sealed into Bitcoin — and when a fact gets old, we show it as old, not pretend it's fresh.",
  'trust.promise': 'The honesty promise:',
  'trust.promiseBody':
    'a red ring means “we haven’t re-confirmed in over 45 days” — it doesn’t mean the fact is wrong. We never paint a stale fact green. Every “✓ Bitcoin-anchored” badge opens the real Satohash verification for that country’s proof. Nothing here is invented at render time.',
  'trust.sweepFresh': '{fresh} fresh · {stale} stale',
  'trust.compare': 'Compare',
  'trust.compareTitle': 'Compare trust',
  'trust.compareHint':
    "Pick up to 4 countries from the grid to overlay their scorecards. Tap a card's ✓-proof row or “Add to compare” from a country's detail.",
  'trust.compareMax': 'Compare holds up to 4 countries — remove one first.',
  'trust.compareEmpty': 'Nothing selected yet — open a country and choose “Add to compare”.',
  'trust.addToCompare': 'Add to compare',
  'trust.clearCompare': 'Clear compare',
  'trust.removeCountry': 'Remove {name}',
  'trust.filterAll': 'All ({total})',
  'trust.filterFresh': 'Fresh ({count})',
  'trust.filterStale': 'Stale ({count})',
  'trust.error': 'Trust envelopes unavailable right now.',
  'trust.loading': 'Loading trust envelopes…',
  'trust.riskSuffix': '{level} risk',
  'trust.freshnessLabel': '{name} freshness',
  'trust.sovScoreTitle': 'Sovereignty score {score}/10',
  'trust.sovereignty': 'sovereignty {score}/10',
  'trust.cardFresh': 'Verified recently and sealed into Bitcoin.',
  'trust.cardWatch': 'Getting old — flagged before it goes stale.',
  'trust.cardStale': 'Over 45 days unconfirmed — shown honestly, never hidden.',
  'trust.details': 'details',
  'trust.trustLabel': 'trust',
  'trust.fresh': 'Fresh',
  'trust.watch': 'Watch',
  'trust.stale': 'Stale',
  'trust.ringAria': 'Freshness: {label}, {days} since last check',
  'trust.noDate':
    'No verification date on record — treated as stale, never assumed fresh.',
  'trust.lastChecked': 'Last checked {date} ({days}d ago).',
  'trust.freshExplain':
    'Checked recently and sealed into Bitcoin. This is the only state that shows green.',
  'trust.watchExplain':
    'Getting old — 31-45 days since check. We flag it before it goes stale.',
  'trust.staleExplain':
    'Probably still true, but unconfirmed for over 45 days. Honest stale beats confident wrong.',
  'trust.bitcoinAnchored': 'Bitcoin-anchored',
  'trust.verifySatohash': 'Verify on Satohash — sha256 {hash}',
  'trust.proofOnFile': 'Proof on file',
  'trust.proofPending': 'Proof pending',
  'trust.proofPendingTitle': 'Proof not yet stamped into a Bitcoin block.',
  'trust.block': 'block {block}',
  'trust.sha256': 'sha256 {hash}',
  'trust.entryThreshold': 'Entry threshold',
  'trust.thresholdAria': 'Minimum investment threshold history',
  'trust.asOf': 'as of {date}',
  'trust.thresholdChanges': '{count} verified threshold changes · BTC shown at live rate',
  'trust.noHistory':
    'No tracked change history yet — single verified point. First pipeline change seeds the trend.',
  'trust.tierOfficial': 'Official',
  'trust.tierLegal': 'Legal',
  'trust.tierSecondary': 'Trusted Secondary',
  'trust.tierOfficialDesc': 'Government / regulator / official source',
  'trust.tierLegalDesc': 'Legislation, law, decree, or legal text',
  'trust.tierSecondaryDesc': 'Verified secondary reporting / research',
  'trust.tierNone': '{desc} — none on record yet',
  'trust.officialUrlTitle': 'Primary official source URL',
  'trust.officialSource': 'official source ↗',
  'trust.radarAria': '7-axis scorecard radar',
  'trust.pending': 'pending',
  'trust.pendingVerify': 'pending verification — never guessed',
  'trust.hoverHint':
    'Hover an axis · {verified}/{total} verified · missing axes stay honest-pending',
  'trust.axis.cryptoFriendly': 'Crypto friendly',
  'trust.axis.freedom': 'Freedom',
  'trust.axis.stability': 'Stability',
  'trust.axis.tax': 'Tax',
  'trust.axis.cost': 'Cost',
  'trust.axis.mobility': 'Mobility',
  'trust.axis.banking': 'Banking',
  'trust.auditTrail': 'Last audit trail',
  'trust.minInvest': 'Min. invest',
  ...pageKeysEn,
}

// ── Lazy locale loading ────────────────────────────────────────────────────────
// Only `en` ships in the critical-path bundle. The other 9 locales are code-split
// into per-language chunks (src/i18n/locales/<lang>.ts) and registered here on
// demand by I18nProvider, so first paint no longer downloads ~755KB of translation
// data. `t` stays synchronous: it reads the registered dict for the active lang,
// falling back to English for any missing key.

const extraDicts: Partial<Record<LangCode, Partial<Dict>>> = {}

/** Register a lazily-loaded locale dictionary (called by I18nProvider). */
export function registerDict(lang: LangCode, dict: Partial<Dict>): void {
  extraDicts[lang] = dict
}

export function t(lang: LangCode, key: TranslationKey): string {
  const localized = (extraDicts[lang] ?? en)[key]
  if (localized !== undefined) return localized
  const fallback = en[key]
  if (fallback !== undefined) return fallback
  return key
}
