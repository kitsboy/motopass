import type { LangCode } from '../i18n/languages'
import { SITE_NAME, SITE_URL } from './seo'

export type FaqJsonLdEntry = { question: string; answer: string }

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Bitcoin-native sovereign passport and residency intelligence — Truth You Can Verify.',
    sameAs: ['https://github.com/kitsboy/motopass'],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Evaluate Bitcoin visa and crypto golden visa programs with Satohash-verified data.',
    publisher: { '@type': 'Organization', name: SITE_NAME },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/programs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

/** Program detail stub JSON-LD when ProgramModal is open. */
export function programDetailJsonLd(program: {
  country: string
  region: string
  tier: string
  minInvestment: number
  sovereigntyScore: number
  proofStatus: string
  proofUrl?: string
  id: string
}) {
  const url = `${SITE_URL}/programs#program-${program.id}`
  return {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    '@id': url,
    name: `${program.country} — ${program.tier}`,
    serviceType: 'Sovereign residency and citizenship program',
    areaServed: { '@type': 'Place', name: program.region },
    url,
    description: `Sovereignty score ${program.sovereigntyScore}/100 · min investment from $${program.minInvestment.toLocaleString()}.`,
    offers: {
      '@type': 'Offer',
      price: program.minInvestment,
      priceCurrency: 'USD',
      availability: 'https://schema.org/OnlineOnly',
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'proofStatus', value: program.proofStatus },
      ...(program.proofUrl
        ? [{ '@type': 'PropertyValue', name: 'satohashProof', value: program.proofUrl }]
        : []),
    ],
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  }
}

/** Kimi liaison agent — Person schema on /agents (BUILD 859). */
export function kimiPersonJsonLd() {
  const url = `${SITE_URL}/agents#kimi`
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': url,
    name: 'Kimi',
    jobTitle: 'MotoPass Liaison Agent',
    description:
      'Bitcoin-native sovereign mobility liaison — Nostr DM handoff, office hours, and escalation from Paige AI.',
    url,
    image: `${SITE_URL}/images/kimi.jpg`,
    worksFor: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    knowsAbout: ['Bitcoin residency', 'CBI/RBI programs', 'Nostr identity', 'Satohash verification'],
    sameAs: ['https://nostr.com'],
  }
}

/** FAQPage JSON-LD enriched from live i18n FAQ copy (pitch home). */
export function pitchFaqJsonLd(entries: FaqJsonLdEntry[], lang: LangCode = 'en') {
  const pageUrl = `${SITE_URL}/`
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    url: pageUrl,
    inLanguage: lang,
    isPartOf: {
      '@type': 'WebPage',
      '@id': pageUrl,
      name: 'MotoPass — Bitcoin Sovereign Passports',
      url: pageUrl,
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    },
    about: {
      '@type': 'Thing',
      name: 'Bitcoin-native sovereign passport intelligence',
      description: 'Satohash-verified residency and citizenship program research.',
    },
    mainEntity: entries.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#pitch-faq'],
        },
      },
    })),
  }
}