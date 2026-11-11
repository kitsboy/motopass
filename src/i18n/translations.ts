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
  | 'nav.sources'
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
  | 'programs.all'
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
  | 'simulator.presetsLabel'
  | 'simulator.preset.budget'
  | 'simulator.preset.budgetTip'
  | 'simulator.preset.speed'
  | 'simulator.preset.speedTip'
  | 'simulator.preset.sovereign'
  | 'simulator.preset.sovereignTip'
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
  | 'verify.chainVerify'
  | 'verify.chainChecking'
  | 'verify.chainRecheck'
  | 'verify.chainAnchored'
  | 'verify.chainPending'
  | 'verify.chainOffline'
  | 'verify.proofPanelHint'
  | 'verify.proofPanelEmpty'
  | 'verify.proofPanelNoHash'
  | 'verify.proofPanel'
  | 'verify.statusBadge'
  | 'verify.provenThen'
  | 'verify.validNow'
  | 'verify.otsDownload'
  | 'verify.notProven'
  | 'verify.validityUnknown'
  | 'verify.validityUnconfirmed'
  | 'verify.validityCurrent'
  | 'verify.validityRevoked'
  | 'verify.provenConfirmed'
  | 'verify.splitNote'
  | 'agents.title'
  | 'agents.sub'
  | 'apply.title'
  | 'apply.sub'
  | 'apply.submit'
  | 'thankYou.title'
  | 'thankYou.metaDescription'
  | 'thankYou.sub'
  | 'thankYou.done'
  | 'thankYou.doneSub'
  | 'thankYou.nextHeading'
  | 'thankYou.stepFee'
  | 'thankYou.stepVault'
  | 'thankYou.stepStamp'
  | 'thankYou.backToApply'
  | 'thankYou.openVault'
  | 'thankYou.meetAgents'
  | 'thankYou.privacyNote'
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
  | 'programs.goldStandardTitle'
  | 'programs.goldStandardSub'
  | 'programs.openResearch'
  | 'programs.pathwaysCount'
  | 'programs.residencyClocks'
  | 'programs.trackInPortfolio'
  | 'programs.complianceEyebrow'
  | 'programs.loadingAria'
  | 'pack.title'
  | 'pack.process'
  | 'pack.processLong'
  | 'pack.inCountry'
  | 'pack.inCountryLong'
  | 'pack.citizenship'
  | 'pack.citizenshipLong'
  | 'pack.renewal'
  | 'pack.notOnFile'
  | 'pack.none'
  | 'pack.atGrant'
  | 'pack.mo'
  | 'pack.day'
  | 'pack.year'
  | 'pack.announced'
  | 'pack.announcedHint'
  | 'pack.routes'
  | 'pack.family'
  | 'pack.fee'
  | 'pack.feeYes'
  | 'pack.feeNo'
  | 'pack.feePartial'
  | 'pack.crypto'
  | 'pack.filing'
  | 'pack.fileInCountry'
  | 'pack.fileRemote'
  | 'pack.mobility'
  | 'pack.banking'
  | 'pack.holding'
  | 'pack.refundable'
  | 'pack.refundYes'
  | 'pack.refundNo'
  | 'pack.refundPartial'
  | 'pack.live'
  | 'pack.reformed'
  | 'pack.closed'
  | 'pack.included'
  | 'pack.scoreOnFile'
  | 'pack.cap'
  | 'bell.eyebrow'
  | 'bell.title'
  | 'bell.quiet'
  | 'bell.changed'
  | 'bell.changedRest'
  | 'bell.country'
  | 'bell.allCountries'
  | 'bell.deliverUrl'
  | 'bell.deliverKey'
  | 'bell.unknownDate'
  | 'bell.copyNote'
  | 'bell.copyPayload'
  | 'bell.copied'
  | 'bell.cardLine'
  | 'bell.hint'
  | 'gazette.eyebrow'
  | 'gazette.title'
  | 'gazette.summary'
  | 'gazette.noneListed'
  | 'gazette.watched'
  | 'gazette.changed'
  | 'gazette.cited'
  | 'mixer.eyebrow'
  | 'mixer.title'
  | 'mixer.lead'
  | 'mixer.includeAnnounced'
  | 'mixer.countries'
  | 'mixer.total'
  | 'mixer.empty'
  | 'mixer.family'
  | 'mixer.remove'
  | 'advice.eyebrow'
  | 'advice.title'
  | 'advice.lead'
  | 'advice.fetched'
  | 'advice.unknownDate'
  | 'advice.country'
  | 'advice.usAudience'
  | 'advice.ukAudience'
  | 'advice.arAudience'
  | 'advice.levelWord'
  | 'advice.noUkCode'
  | 'advice.ukAvoidAll'
  | 'advice.ukAvoidEssential'
  | 'advice.ukAvoidAllParts'
  | 'advice.ukAvoidEssentialParts'
  | 'advice.noArAlert'
  | 'advice.otherAr'
  | 'advice.notOnFile'
  | 'advice.copying'
  | 'advice.hold'
  | 'advice.holdAll'
  | 'advice.holdUs'
  | 'advice.holdUk'
  | 'advice.holdAr'
  | 'advice.otherPassports'
  | 'advice.read'
  | 'advice.hide'
  | 'sentence.eyebrow'
  | 'sentence.title'
  | 'sentence.lead'
  | 'sentence.none'
  | 'sentence.marked'
  | 'sentence.notMarked'
  | 'sentence.quiet'
  | 'days.eyebrow'
  | 'days.title'
  | 'days.lead'
  | 'days.none'
  | 'days.notOnFile'
  | 'days.yearMark'
  | 'days.receipt'
  | 'days.noSentence'
  | 'fee.eyebrow'
  | 'fee.title'
  | 'fee.lead'
  | 'fee.bitcoin'
  | 'fee.dollars'
  | 'fee.unpriced'
  | 'fee.fiat'
  | 'fee.spot'
  | 'fee.noAmount'
  | 'fee.quiet'
  | 'veritas.notHumanRead'
  | 'compare.daysInCountry'
  | 'compare.yearsToCitizenship'
  | 'compare.feeBitcoin'
  | 'compare.filing'
  | 'compare.fileInCountry'
  | 'compare.fileRemote'
  | 'portfolio.nostrIdentity'
  | 'portfolio.nostrHint'
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
  | 'source.ok'
  | 'source.changed'
  | 'source.walled'
  | 'source.tooltip'
  | 'source.readable'
  | 'source.checked'
  | 'source.gap'
  | 'source.watchTitle'
  | 'source.watchSub'
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
  | 'nav.languageSystem'
  | 'nav.languageShortcut'
  | 'nav.languageRecent'
  | 'nav.backToTop'
  | 'nav.pageSections'
  | 'dashboard.alertsTitle'
  | 'dashboard.alertsSub'
  | 'dashboard.alertsPortfolio'
  | 'dashboard.alertsEmpty'
  | 'dashboard.alertsShowMore'
  | 'dashboard.alertsShowLess'
  | 'dashboard.alertsSource'
  | 'dashboard.alertsBrowse'
  | 'block.retry'
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
  | 'pitch.hero.jurisdictionsChip'
  | 'pitch.hero.advisorySavingsChip'
  | 'pitch.hero.lightningChip'
  | 'pitch.hero.corpusBadge'
  | 'pitch.hero.flagshipChip'
  | 'pitch.hero.watchdogChip'
  | 'pitch.hero.scrollCta'
  | 'pitch.hero.statLabel.corpus'
  | 'pitch.hero.statLabel.flagship'
  | 'pitch.hero.statLabel.lightning'
  | 'pitch.hero.statLabel.watchdog'
  | 'pitch.hero.statLabel.anchor'
  | 'pitch.explorer'
  | 'pitch.metric.jurisdictions'
  | 'pitch.metric.avgSavings'
  | 'pitch.metric.avgDays'
  | 'pitch.metric.flagshipDepth'
  | 'pitch.savings.title'
  | 'pitch.savings.headerCopy'
  | 'pitch.savings.headerTip'
  | 'pitch.savings.membersEyebrow'
  | 'pitch.savings.traditional'
  | 'pitch.savings.motopass'
  | 'pitch.savings.footnote'
  | 'pitch.savings.unitDays'
  | 'pitch.savings.savingsBrand'
  | 'pitch.savings.modeledLegalDelta'
  | 'pitch.savings.barMeaningDefault'
  | 'pitch.savings.ctaPresentation'
  | 'pitch.savings.moreJurisdictions'
  | 'pitch.savings.moreJurisdictionsMeaning'
  | 'pitch.savings.daysFasterMeaning'
  | 'pitch.savings.legalDeltaMeaning'
  // NOTE: 'pitch.savings.legal', 'pitch.savings.legalDelta', 'pitch.savings.methodology'
  // are dead keys (no component usage) — removed from the union; sw-only copies pruned.
  | 'pitch.savings.metric.legal'
  | 'pitch.savings.metric.time'
  | 'pitch.savings.metric.jurisdictions'
  | 'pitch.savings.metric.legalMeaning'
  | 'pitch.savings.metric.timeMeaning'
  | 'pitch.savings.metric.jurisdictionsMeaning'
  | 'pitch.savings.delta.legal'
  | 'pitch.savings.delta.jurisdictions'
  | 'pitch.products.applicationsOpen'
  | 'pitch.explainer.badge'
  | 'pitch.explainer.filmStatusReady'
  | 'pitch.explainer.filmStatusPending'
  | 'pitch.live.thisWeek'
  | 'pitch.live.lastAnchored'
  | 'pitch.explainer.eyebrow'
  | 'pitch.explainer.title'
  | 'pitch.explainer.body'
  | 'pitch.explainer.videoTitle'
  | 'pitch.explainer.unsupported'
  | 'pitch.explainer.pendingTitle'
  | 'pitch.explainer.pendingBody'
  | 'proofBadge.verified'
  | 'proofBadge.recorded'
  | 'proofBadge.demo'
  | 'proofBadge.pending'
  // ——— CORE Swahili lane (t_d198053c): keys recovered from hardcoded English on
  // /vault + /simulator + shared chrome. Declared inline (not as PageKeys) so the
  // per-locale PageKey parity tests stay owned by their own lanes.
  | 'simulator.forksSub'
  | 'simulator.forksEmpty'
  | 'simulator.tip.forkSavings'
  | 'simulator.tip.avgSovereignty'
  | 'simulator.tip.synergy'
  | 'vault.how.step3.link'
  | 'vault.how.step4.link'
  | 'layout.loadingAria'
  // ——— Stage 1: plain-language home, merged Proof hub, one settings menu.
  // Every key here exists because the old copy said something the site could
  // not back up, used an internal codename, or described a surface as "trusted".
  | 'pitch.h1'
  | 'pitch.subPending'
  | 'pitch.ctaPending'
  | 'pitch.browse.titlePending'
  | 'pitch.browse.ctaPending'
  | 'pitch.verifyCta'
  | 'pitch.researchDate'
  | 'pitch.metric.daysToResidency'
  | 'pitch.trust.eyebrow'
  | 'pitch.trust.title'
  | 'pitch.trust.sub'
  | 'pitch.trust.sources.title'
  | 'pitch.trust.sources.body'
  | 'pitch.trust.sources.cta'
  | 'pitch.trust.stamps.title'
  | 'pitch.trust.stamps.body'
  | 'pitch.trust.stamps.cta'
  | 'pitch.trust.stale.title'
  | 'pitch.trust.stale.body'
  | 'pitch.trust.stale.cta'
  | 'pitch.steps.eyebrow'
  | 'pitch.steps.title'
  | 'pitch.steps.compare.title'
  | 'pitch.steps.compare.body'
  | 'pitch.steps.compare.cta'
  | 'pitch.steps.model.title'
  | 'pitch.steps.model.body'
  | 'pitch.steps.model.cta'
  | 'pitch.steps.apply.title'
  | 'pitch.steps.apply.body'
  | 'pitch.steps.apply.cta'
  | 'pitch.browse.eyebrow'
  | 'pitch.browse.title'
  | 'pitch.browse.cta'
  | 'pitch.start.title'
  | 'pitch.start.body'
  | 'pitch.start.open'
  | 'pitch.start.closed'
  | 'pitch.start.applyCta'
  | 'nav.proof'
  | 'nav.settings'
  | 'nav.currency'
  | 'nav.theme'
  | 'nav.account'
  | 'proof.eyebrow'
  | 'proof.title'
  | 'proof.sub'
  | 'proof.tabsAria'
  | 'proof.loading'
  | 'proof.tab.trust'
  | 'proof.tab.sources'
  | 'proof.tab.vault'
  | 'proof.tab.tools'
  | 'liaison.eyebrow'
  | 'liaison.title'
  | 'liaison.sub'
  | 'liaison.automatedLabel'
  | 'liaison.automatedBody'
  | 'liaison.humanLabel'
  | 'liaison.humanBody'
  | 'liaison.status'
  | 'liaison.cta'
  | 'apply.eyebrow'
  | 'apply.closed.title'
  | 'apply.closed.body'
  | 'apply.closed.step1'
  | 'apply.closed.step2'
  | 'apply.closed.step3'
  | 'apply.closed.ctaPrograms'
  | 'apply.closed.ctaProof'
  | PageKey

export type Dict = Record<TranslationKey, string>
/** A locale dict that may omit keys — `t` falls back to English for missing ones. */
export type PartialDict = Partial<Dict>

const en: Dict = {
  'nav.pitch': 'Home',
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
  'nav.sources': 'Sources',
  'nav.blog': 'Insights',
  'nav.verify': 'Verify',
  // Official-source watchdog (Source Monitor)
  'source.ok': 'Source live',
  'source.changed': 'Source changed',
  'source.walled': 'Source walled',
  'source.tooltip': 'Official source, re-checked every 24h',
  'source.readable': 'readable',
  'source.checked': 'checked',
  'source.gap': 'gap',
  'source.watchTitle': 'Official source changes',
  'source.watchSub': 'Confirmed rule changes on the official sources of the countries you watch.',
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
  'programs.goldStandardTitle': 'Gold standard jurisdictions',
  'programs.goldStandardSub':
    'Uruguay and El Salvador anchor the flagship packs — three clocks, route status, and the notes the other programs inherit.',
  'programs.openResearch': 'Open research',
  'programs.pathwaysCount': '{count} pathways',
  'programs.residencyClocks': 'Residency clocks',
  'programs.trackInPortfolio': 'Track in portfolio →',
  'programs.complianceEyebrow': 'COMPLIANCE',
  'programs.loadingAria': 'Loading programs',
  'pack.title': 'Decision pack',
  'pack.process': 'Process',
  'pack.processLong': 'Processing',
  'pack.inCountry': 'In country',
  'pack.inCountryLong': 'Days in country',
  'pack.citizenship': 'Citizenship',
  'pack.citizenshipLong': 'Years to citizenship',
  'pack.renewal': 'Renewal',
  'pack.notOnFile': 'Not on file',
  'pack.none': 'None',
  'pack.atGrant': 'At grant',
  'pack.mo': 'mo',
  'pack.day': 'd',
  'pack.year': 'y',
  'pack.announced': 'Announced',
  'pack.announcedHint': 'Not yet in force. The card minimum stays the live route.',
  'pack.routes': 'Routes',
  'pack.family': 'Family',
  'pack.fee': 'Fee in Bitcoin',
  'pack.feeYes': 'Yes',
  'pack.feeNo': 'No',
  'pack.feePartial': 'Partially',
  'pack.crypto': 'Crypto tax',
  'pack.filing': 'How you file',
  'pack.fileInCountry': 'File in the country. See the pathway notes.',
  'pack.fileRemote': 'Marketed as remote. Confirm before you rely on it.',
  'pack.mobility': 'Mobility',
  'pack.banking': 'Banking',
  'pack.holding': 'Holding',
  'pack.refundable': 'Refundable',
  'pack.refundYes': 'Yes',
  'pack.refundNo': 'No',
  'pack.refundPartial': 'Partly',
  'pack.live': 'Live',
  'pack.reformed': 'Reformed',
  'pack.closed': 'Closed',
  'pack.included': 'Included',
  'pack.scoreOnFile': '{score}/10 on file',
  'pack.cap': 'Cap on file: {count} main applicants a year',
  'bell.eyebrow': 'CHANGE BELL',
  'bell.title': 'When an official page changes',
  'bell.quiet': '{count} countries are steady. Last probe {date}. No watched page is marked changed.',
  'bell.changed': '{count} watched pages changed: {names}.',
  'bell.changedRest': 'watched pages changed: {names}.',
  'bell.country': 'One country',
  'bell.allCountries': 'All countries',
  'bell.deliverUrl': 'https address',
  'bell.deliverKey': 'Nostr pubkey',
  'bell.unknownDate': 'not on file',
  'bell.copyNote': 'Copy Nostr note',
  'bell.copyPayload': 'Copy webhook',
  'bell.copied': 'Copied',
  'bell.cardLine': 'A watched official page changed',
  'bell.hint': 'This page copies the note. It does not send the address and it does not publish the key. The daily script posts only when MOTOPASS_CHANGE_WEBHOOK_URL is a public https address. MOTOPASS_CHANGE_COUNTRY limits that post to one country name.',
  'gazette.eyebrow': 'GAZETTE',
  'gazette.title': 'Law newspapers on the watch list',
  'gazette.summary': 'On the daily watch: {watched}. Cited, and not watched yet: {cited}. {missing} countries have no gazette URL on file.',
  'gazette.noneListed': 'none',
  'gazette.watched': 'Gazette watched',
  'gazette.changed': 'Gazette page changed',
  'gazette.cited': 'Gazette cited, not on the daily watch',
  'mixer.eyebrow': 'ROUTE MIXER',
  'mixer.title': 'One route per country',
  'mixer.lead': 'Pick a route and add it. Each country keeps one route in the total. Family prices appear only where the note already states them. Announced routes stay out until you include them.',
  'mixer.includeAnnounced': 'Include announced routes',
  'mixer.countries': 'Countries',
  'mixer.total': 'Mix total',
  'mixer.empty': 'Pick a route to start a total.',
  'mixer.family': 'Family prices on file',
  'mixer.remove': 'Remove',
  'advice.eyebrow': 'ADVICE',
  'advice.title': 'What each government tells its own citizens',
  'advice.lead': 'The United States line is for United States citizens. The British line is for British nationals. The Argentine line is what Cancillería published for Argentine citizens. A quiet line means that page did not name this country.',
  'advice.fetched': 'Copied {date}.',
  'advice.unknownDate': 'not on file',
  'advice.country': 'Country',
  'advice.usAudience': 'United States citizens',
  'advice.ukAudience': 'British nationals',
  'advice.arAudience': 'Argentine citizens',
  'advice.levelWord': 'Level',
  'advice.noUkCode': 'No warning code on the page',
  'advice.ukAvoidAll': 'Advise against all travel',
  'advice.ukAvoidEssential': 'Advise against all but essential travel',
  'advice.ukAvoidAllParts': 'Advise against all travel to parts',
  'advice.ukAvoidEssentialParts': 'Advise against all but essential travel to parts',
  'advice.noArAlert': 'No consular alert on file',
  'advice.otherAr': 'Argentine alerts that do not name one of these programs',
  'advice.notOnFile': 'Not on file',
  'advice.copying': 'Copying the three public pages.',
  'advice.hold': 'Passport I hold',
  'advice.holdAll': 'All three',
  'advice.holdUs': 'United States',
  'advice.holdUk': 'United Kingdom',
  'advice.holdAr': 'Argentina',
  'advice.otherPassports': 'The other two passports',
  'advice.read': 'Read the sentence',
  'advice.hide': 'Hide the sentence',
  'sentence.eyebrow': 'STORED SENTENCE',
  'sentence.title': 'The last before-and-after on file',
  'sentence.lead': 'These are the two texts the probe stored. The date is the day it stored them. A country is marked changed only when the catalog says so.',
  'sentence.none': 'No before-and-after sentence is on file.',
  'sentence.marked': 'Marked changed',
  'sentence.notMarked': 'Not marked changed today',
  'sentence.quiet': '{count} countries have no before-and-after on file.',
  'days.eyebrow': 'DAYS ON FILE',
  'days.title': 'Days the program asks you to be there',
  'days.lead': 'Each bar is the day count already on file for the whole path. A longer bar is a longer ask. It is not a plan for one calendar year.',
  'days.none': 'None',
  'days.notOnFile': 'Not on file',
  'days.yearMark': '{years}y',
  'days.receipt': 'Receipt',
  'days.noSentence': 'The sentence is not on file.',
  'fee.eyebrow': 'FEE INVOICE',
  'fee.title': 'What the note says you can pay in Bitcoin',
  'fee.lead': 'A sats figure is a payment rail only on the line that says so. Every other sats figure is a spot conversion of a dollar amount already on file.',
  'fee.bitcoin': 'Payable in Bitcoin',
  'fee.dollars': 'Dollars only',
  'fee.unpriced': 'Partial, and no amount is on file',
  'fee.fiat': 'Not payable in Bitcoin',
  'fee.spot': 'Spot conversion. Not a payment rail.',
  'fee.noAmount': 'No amount is on file.',
  'fee.quiet': '{count} notes say the government fee is not payable in Bitcoin.',
  'veritas.notHumanRead': 'Probe status only. The 8 Nov re-read could not open this page.',
  'compare.daysInCountry': 'Days in country',
  'compare.yearsToCitizenship': 'Years to citizenship',
  'compare.feeBitcoin': 'Fee in Bitcoin',
  'compare.filing': 'How you file',
  'compare.fileInCountry': 'In the country',
  'compare.fileRemote': 'Remote',
  'portfolio.nostrIdentity': 'Nostr identity',
  'portfolio.nostrHint': 'Connect npub before Apply — agents route deal rooms and proof updates through your sovereign key.',
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
  'pitch.feature.jurisdictions.title': '21 jurisdictions',
  'pitch.feature.jurisdictions.sub': 'CBI, RBI & Bitcoin-native pathways',
  'pitch.feature.satohash.title': 'Satohash proofs',
  'pitch.feature.satohash.sub': 'OpenTimestamps on every material claim',
  'pitch.feature.nostr.title': 'Nostr identity',
  'pitch.feature.nostr.sub': 'npub-native applications, no email',
  'pitch.feature.agents.title': 'Liaison agents',
  'pitch.feature.agents.sub': 'Country AI agents for real applicants',
  'pitch.feature.live.title': 'Live Data Engine',
  'pitch.feature.live.sub':
    '21-country trust cards — freshness rings, Bitcoin proof badges, honest staleness. Verify before you trust.',
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
  'pitch.roadmap.uruguay': 'Uruguay flagship depth across all 21 countries',
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
  'programs.all': 'All',
  'programs.inStack': 'in your stack',
  'portfolio.empty': 'No programs in your portfolio yet.',
  'portfolio.explore': 'Explore programs',
  'compare.empty': 'Choose programs above—or start with Uruguay vs Portugal—to compare investment, fees, processing time, Bitcoin score, sovereignty, and risk side by side. Your selection is saved in this browser and can be shared by URL.',
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
  'verify.chainVerify': 'Check this hash on Bitcoin',
  'verify.chainChecking': 'Checking against Bitcoin…',
  'verify.chainRecheck': 'Check again',
  'verify.chainAnchored': 'Anchored to Bitcoin · block {block}',
  'verify.chainPending': 'Recorded — Bitcoin has not confirmed it yet',
  'verify.chainOffline': 'Could not reach the Bitcoin verifier — nothing was proven or disproven.',
  'verify.proofPanelHint':
    'Ask the family verifier whether this hash is anchored to a real Bitcoin block. It tells you HOW it checked — our own node (bitcoind) or a public explorer (esplora) — and always offers the .ots proof so you can audit without trusting us.',
  'verify.proofPanelEmpty': 'Hash is ready — run the check to see the verdict.',
  'verify.proofPanelNoHash': 'Generate or paste a hash above, then check it here.',
  'verify.proofPanel': 'Proof & status',
  'verify.statusBadge': 'Status',
  // The two halves of the honesty split need DIFFERENT headings — labelling both
  // rows "Status" reads as "Status X ≠ Status Y" and hides the whole point
  // (proven then is permanent, valid now is revocable).
  'verify.provenThen': 'Proven then',
  'verify.validNow': 'Valid now',
  'verify.otsDownload': 'Download proof (.ots)',
  'verify.notProven': 'Not proven',
  'verify.validityUnknown': 'Live validity not checked yet',
  'verify.validityUnconfirmed': 'Unconfirmed as of {checked} — check the live registry',
  'verify.validityCurrent': 'Current as of {checked}',
  'verify.validityRevoked': 'Revoked / expired',
  'verify.provenConfirmed': 'Anchored to Bitcoin · block {block}',
  'verify.splitNote':
    'The proof never expires — it only ever says when this existed. Whether it is still valid today is a separate, live check, and MotoPass never merges the two.',
  'agents.title': 'Country liaison agents',
  'agents.sub': 'AI-assisted passport office liaisons — reachable on Nostr for verified applicants',
  'apply.title': 'Passport application tracker',
  'apply.sub': 'Read the catalogue, model a plan, then apply with a Nostr key instead of an email and password.',
  'apply.submit': 'Register & timestamp',
  'thankYou.title': 'Thank you.',
  'thankYou.metaDescription':
    'Your MotoPass application is submitted. Here is what happens next — complete the fee, meet the agents, and your application is on the table.',
  'thankYou.sub': 'Your application has been recorded and stamped. Here is exactly what happens next.',
  'thankYou.done': 'Application submitted',
  'thankYou.doneSub':
    'Your details are recorded and a cryptographic fingerprint was created so nothing can be altered after the fact.',
  'thankYou.nextHeading': 'What happens next',
  'thankYou.stepFee': 'Complete the application fee — one real Lightning payment (or your chosen rail) opens the door.',
  'thankYou.stepVault': 'Your application hash and stamped documents stay in your Vault — self-custody, no middleman.',
  'thankYou.stepStamp': 'Stamp your application on Bitcoin via Satohash for permanent, independent proof.',
  'thankYou.backToApply': 'Continue your application',
  'thankYou.openVault': 'Open your vault',
  'thankYou.meetAgents': 'Meet the agents',
  'thankYou.privacyNote': 'Bitcoin-only · self-custody · no KYC · no tracking pixels',
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
  // ——— Keys recovered from orphaned sw-only copy + component usage (2026-09-10) ———
  'programs.jurisdiction': 'Jurisdiction',
  'programs.tier': 'Tier',
  'programs.proof': 'Proof',
  'programs.intel': 'Intel',
  'portfolio.complianceClock': 'Compliance clock',
  'portfolio.citizenshipTrack': 'Citizenship track',
  'compliance.critical': 'Critical',
  'compliance.warning': 'Watch',
  'compliance.healthy': 'Healthy',
  'compliance.criticalTip': 'Action needed soon — a requirement in this stack is close to expiring or failing.',
  'compliance.warningTip': 'Watch item — one or more requirements need attention within weeks, not months.',
  'compliance.healthyTip': 'On track — no stack requirement is close to a deadline.',
  'simulator.synergy': 'Stack synergy',
  'simulator.vsTypical': 'vs. typical',
  'simulator.sideBySide': 'Open in',
  'trust.researchPending': 'Research pending',
  'pitch.hero.jurisdictionsChip': '{count} jurisdictions',
  'pitch.hero.advisorySavingsChip': '~{amount} avg advisory savings',
  'pitch.hero.lightningChip': '{count} Lightning ready',
  'pitch.hero.corpusBadge': 'Live research corpus',
  'pitch.hero.flagshipChip': 'Flagship depth {count}',
  'pitch.hero.watchdogChip': '{count} official sources watched',
  'pitch.hero.scrollCta': 'Scroll to explore',
  'pitch.hero.statLabel.corpus': 'Countries tracked',
  'pitch.hero.statLabel.flagship': 'Flagship depth',
  'pitch.hero.statLabel.lightning': 'Lightning ready',
  'pitch.hero.statLabel.watchdog': 'Official sources watched',
  'pitch.hero.statLabel.anchor': 'Bitcoin-stamped',
  'pitch.explorer': 'Explore',
  'pitch.metric.jurisdictions': 'Jurisdictions tracked',
  'pitch.metric.avgSavings': 'Avg. stack savings',
  'pitch.metric.avgDays': 'Avg. days to residency',
  'pitch.metric.flagshipDepth': 'Flagship depth',
  'pitch.savings.title': 'Cost & time, modeled — not promised',
  'pitch.savings.headerCopy': 'Modeled comparison of a sovereignty stack — boutique-advisory creation, not a guarantee. Real USD figures and day math, shown transparently.',
  'pitch.savings.headerTip': 'Modeled for member evaluation only — modeled stack economics, not a guarantee. Real USD figures and day math, shown transparently.',
  'pitch.savings.membersEyebrow': 'Members · Modeled economics',
  'pitch.savings.traditional': 'Traditional',
  'pitch.savings.motopass': 'MotoPass',
  'pitch.savings.footnote': 'Modeled for member evaluation only. Traditional assumes boutique advisors in three jurisdictions; MotoPass reflects modeled stack economics via the platform at current program depth.',
  'pitch.savings.unitDays': 'days',
  'pitch.savings.savingsBrand': 'Savings',
  'pitch.savings.modeledLegalDelta': 'modeled legal delta',
  'pitch.savings.barMeaningDefault': 'Modeled estimates shown for member evaluation.',
  'pitch.savings.ctaPresentation': 'Modeled savings presentation',
  'pitch.savings.moreJurisdictions': 'More jurisdictions',
  'pitch.savings.moreJurisdictionsMeaning': 'Additional sovereignty options from stacking programs, vs. a single traditional engagement.',
  'pitch.savings.daysFasterMeaning': 'Modeled time advantage of the platform route vs. boutique advisory.',
  'pitch.savings.legalDeltaMeaning': 'Modeled savings vs. a traditional advisory baseline — modeled, not guaranteed.',
  'pitch.savings.metric.legal': 'Legal & advisory',
  'pitch.savings.metric.time': 'Time to approval',
  'pitch.savings.metric.jurisdictions': 'Jurisdictions',
  'pitch.savings.metric.legalMeaning': 'Total modeled for the same citizenship goals via international boutique advisors — the comparison baseline.',
  'pitch.savings.metric.timeMeaning': 'Modeled months from first engagement to passport in hand for each route.',
  'pitch.savings.metric.jurisdictionsMeaning': 'How many sovereignty options each route opens — MotoPass stacks programs where traditional advisory typically restricts to one.',
  'pitch.savings.delta.legal': '−$77,100 modeled',
  'pitch.savings.delta.jurisdictions': '+18 jurisdictions modeled',
  'pitch.savings.phase.opening': 'Opening',
  'pitch.savings.phase.cost': 'Cost',
  'pitch.savings.phase.time': 'Time',
  'pitch.savings.phase.jurisdictions': 'Jurisdictions',
  'pitch.savings.phase.savings': 'Savings',
  'pitch.savings.phase.summary': 'Summary',
  'pitch.products.applicationsOpen': 'Applications open · {gates} gates',
  'pitch.explainer.badge': 'Truth You Can Verify',
  'pitch.explainer.filmStatusReady': 'MOTOPASS · 60s · 16:9',
  'pitch.explainer.filmStatusPending': 'MOTOPASS · GUIDE',
  'pitch.live.thisWeek': 'Live · This week',
  'pitch.live.lastAnchored': 'Last anchored {proof} · OpenTimestamps',
  'pitch.explainer.eyebrow': 'Watch · 60-second guide',
  'pitch.explainer.title': 'MotoPass in 60 seconds',
  'pitch.explainer.body': 'Truth you can verify, on Bitcoin — how MotoPass turns sovereign residency into a verifiable, self-custody passport.',
  'pitch.explainer.videoTitle': 'MotoPass — 60-second guide',
  'pitch.explainer.unsupported': 'Your browser does not support HTML5 video.',
  'pitch.explainer.pendingTitle': 'The 60-second guide is in production',
  'pitch.explainer.pendingBody': 'Our film is being cut right now. Check back soon — it will play right here. Meanwhile, explore the platform below.',
  'proofBadge.verified': 'Bitcoin-verified',
  'proofBadge.recorded': 'Proof on file',
  'proofBadge.demo': 'Demo anchor',
  'proofBadge.pending': 'Anchor pending',
  'error.somethingWrong': 'Something went wrong — please try again.',
  'apply.feeRailUnreachable': 'Fee rail unreachable — try again shortly.',
  'dashboard.paigePolicy': 'Paige stays grounded: answers come from the verified corpus only — no speculation, no outside claims.',
  'vault.educationPlayerTitle': 'MotoPass — 60-second guide',
  'vault.educationPlayerAria': 'Educational video player',
  // ——— CORE Swahili lane (t_d198053c) — English source for keys that were
  // hardcoded on /vault, /simulator and shared chrome before this change.
  'simulator.forksSub': 'Pathway-level capital forks — minimums, proof status, and stacking synergy across your sovereign stack.',
  'simulator.forksEmpty': 'Add flagship jurisdictions (Uruguay, Bolivia) for pathway fork analysis.',
  'simulator.tip.forkSavings': 'Pathway-level capital savings — the difference between the lowest pathway minimum and the typical investment across your stack. Modeled for member evaluation.',
  'simulator.tip.avgSovereignty': 'Average sovereignty score (0–10) across the programs in your stack — a higher score means more control over your path. Modeled for member evaluation.',
  'simulator.tip.synergy': 'How well the programs in your stack reinforce each other — High / Medium / Low stacking synergy. Modeled for member evaluation.',
  'vault.how.step3.link': 'Stamp your own hash',
  'vault.how.step4.link': 'Open applications',
  'layout.loadingAria': 'Loading',
  'intel.statusChanged': 'Watch changed',
  'intel.statusReanchoring': 'Re-anchoring',
  'paige.conciergeAria': 'Open the Paige concierge chat',
  ...pageKeysEn,
  // ——— Stage 1 copy: plain language, no invented comparators, no codenames.
  'pitch.h1': 'Compare residency and citizenship programs',
  'pitch.subPending':
    'Data you can verify: every program side by side, each figure traced to an official source. Built for Bitcoiners.',
  'pitch.ctaPending': 'Compare the programs',
  'pitch.browse.titlePending': 'Every program, one record each',
  'pitch.browse.ctaPending': 'See all programs',
  'pitch.sub':
    'Data you can verify: {count} programs side by side, each figure traced to an official source. Built for Bitcoiners.',
  'pitch.cta': 'Compare {count} programs',
  'pitch.verifyCta': 'How verification works',
  'pitch.researchDate': 'Research checked {date}',
  'pitch.metric.daysToResidency': 'Avg. days to residency',
  'pitch.trust.eyebrow': 'Why trust it',
  'pitch.trust.title': 'Every figure traces back to an official source',
  'pitch.trust.sub':
    "We are not asking you to believe a brochure. Each program's cost, timeline and requirements come from the government's own pages, and every record is stamped so you can check it years from now.",
  'pitch.trust.sources.title': 'Official pages, re-checked',
  'pitch.trust.sources.body':
    'We watch the government pages behind each program and flag anything that changed since the last check.',
  'pitch.trust.sources.cta': 'See the source log',
  'pitch.trust.stamps.title': 'Stamped on Bitcoin',
  'pitch.trust.stamps.body':
    'Each research record is hashed and timestamped with OpenTimestamps, so the version you read is provably the version we published.',
  'pitch.trust.stamps.cta': 'Open the timestamp vault',
  'pitch.trust.stale.title': 'Stale is shown as stale',
  'pitch.trust.stale.body':
    'If a record has not been re-checked recently, the card says so. Nothing is dressed up as fresher than it is.',
  'pitch.trust.stale.cta': 'Check the freshness of every record',
  'pitch.steps.eyebrow': 'How it works',
  'pitch.steps.title': 'Three steps, and nothing to sign up for to start',
  'pitch.steps.compare.title': 'Compare',
  'pitch.steps.compare.body':
    'Filter the {count} programs by cost, timeline, region and how well they work with Bitcoin. Same fields, side by side.',
  'pitch.steps.compare.cta': 'Open the program list',
  'pitch.steps.model.title': 'Model your plan',
  'pitch.steps.model.body':
    'Stack two or three programs into one timeline and see the total cost, in sats and in your own currency.',
  'pitch.steps.model.cta': 'Open the simulator',
  'pitch.steps.apply.title': 'Register interest',
  'pitch.steps.apply.body':
    'You apply with a Nostr key — a login no company owns — instead of an email and a password. You keep the key.',
  'pitch.steps.apply.cta': 'See what applying involves',
  'pitch.browse.eyebrow': "What's inside",
  'pitch.browse.title': '{count} programs, one record each',
  'pitch.browse.cta': 'See all {count}',
  'pitch.start.title': 'Start with the data',
  'pitch.start.body':
    'The catalogue is free to read and needs no account. You only create one if you want to register interest.',
  'pitch.start.open': 'Applications are open.',
  'pitch.start.closed':
    'Applications are closed. Nothing is being accepted right now — the catalogue and the timestamps stay open.',
  'pitch.start.applyCta': 'What applying involves',
  'nav.proof': 'Proof',
  'nav.settings': 'Settings',
  'nav.currency': 'Currency',
  'nav.theme': 'Theme',
  'nav.account': 'Account',
  'proof.eyebrow': 'Proof',
  'proof.title': 'Check the data yourself',
  'proof.sub':
    'Four ways to test what this site claims: how fresh each record is, which official pages we watch, the Bitcoin timestamps, and tools that run in your browser.',
  'proof.tabsAria': 'Proof sections',
  'proof.loading': 'Loading…',
  'proof.tab.trust': 'Freshness',
  'proof.tab.sources': 'Sources',
  'proof.tab.vault': 'Timestamps',
  'proof.tab.tools': 'Tools',
  'liaison.eyebrow': 'Liaison desk',
  'liaison.title': 'One desk — and it says who does what',
  'liaison.sub':
    'Program questions go to one place. Here is exactly what is automated and what a person handles.',
  'liaison.automatedLabel': 'Automated',
  'liaison.automatedBody':
    'The queue, the checklist and the record of what you sent. Reminders and status updates are generated.',
  'liaison.humanLabel': 'A person',
  'liaison.humanBody':
    "Choosing a program, reading a government's requirements and speaking to an office are human work. No model decides an application.",
  'liaison.status': 'The desk opens when applications open. Until then it is a queue, not an inbox.',
  'liaison.cta': 'See what applying involves',
  'apply.eyebrow': 'Applications',
  'apply.closed.title': 'Applications are closed',
  'apply.closed.body':
    'Nothing is being accepted right now. This page is honest about that rather than showing a form that goes nowhere.',
  'apply.closed.step1': 'Read the catalogue — every program, its cost and its official source.',
  'apply.closed.step2': 'Model a plan in the simulator and note which programs you would want.',
  'apply.closed.step3': 'When applications open, you will apply with a Nostr key, not an email address.',
  'apply.closed.ctaPrograms': 'Browse the programs',
  'apply.closed.ctaProof': 'See what is verified',
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
