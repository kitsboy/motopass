import { BLOG_POSTS } from '../data/blog'
import type { LangCode } from '../i18n/languages'

export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://motopass.giveabit.io'
export const SITE_NAME = 'MotoPass'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/hero.jpg`
export const TITLE_SUFFIX = 'MotoPass • Truth You Can Verify'

export type SeoMeta = {
  title: string
  description: string
}

/** Static route SEO — 14 app routes (blog slug resolved dynamically). */
export const ROUTE_SEO: Record<string, SeoMeta> = {
  '/': {
    title: 'Bitcoin Sovereign Passports & Residency',
    description:
      'Evaluate, compare, and stack sovereign residency and citizenship programs with Bitcoin-verified data, Nostr identity, and Satohash OpenTimestamps proofs.',
  },
  '/portfolio': {
    title: 'Portfolio — Your Sovereign Stack',
    description:
      'Track saved CBI, RBI, and Bitcoin-native residency programs in your personal sovereign mobility portfolio.',
  },
  '/programs': {
    title: 'Programs — 50 Jurisdictions',
    description:
      'Browse 50 citizenship-by-investment and residency-by-investment programs with Lightning readiness, crypto scores, and Satohash verification.',
  },
  '/simulator': {
    title: 'Stack Simulator',
    description:
      'Model multi-jurisdiction passport stacks — compare combined cost, sovereignty score, and processing timelines.',
  },
  '/compare': {
    title: 'Finance Compare',
    description:
      'Side-by-side comparison of program investment thresholds, government fees, tax benefits, and Bitcoin integration.',
  },
  '/vault': {
    title: 'Vault — Timestamp Proofs',
    description:
      'Satohash-anchored program proofs with OpenTimestamps verification and optional Nostr Kind 30078 stubs.',
  },
  '/blog': {
    title: 'Insights — Sovereign Mobility Blog',
    description:
      'Multilingual articles on Bitcoin passports, Nostr applications, CBI/RBI policy, and country liaison agents.',
  },
  '/verify': {
    title: 'Verify — Satohash OpenTimestamps',
    description:
      'Generate and verify Satohash.io OpenTimestamps proofs for MotoPass application payloads and material claims.',
  },
  '/agents': {
    title: 'Country Liaison Agents',
    description:
      'Meet jurisdiction-specific AI liaison agents that connect verified Nostr applicants with passport offices.',
  },
  '/apply': {
    title: 'Apply — Passport Interest',
    description:
      'Register sovereign mobility interest with your Nostr npub — no email required. Matched with country liaison agents.',
  },
  '/register': {
    title: 'Register — Nostr Identity',
    description:
      'Create your MotoPass profile with Nostr Connect. npub-native applications and policy alerts.',
  },
  '/dashboard': {
    title: 'Dashboard',
    description:
      'Your MotoPass command center — applications, portfolio progress, and Nostr-connected sovereign mobility tools.',
  },
  '/profile': {
    title: 'Profile',
    description:
      'Manage your Nostr-linked MotoPass profile, preferences, and sovereign mobility application history.',
  },
}

export function formatPageTitle(title: string): string {
  return `${title} • ${TITLE_SUFFIX}`
}

export function resolveSeoForPath(pathname: string, lang: LangCode = 'en'): SeoMeta & { path: string } {
  const blogMatch = pathname.match(/^\/blog\/([^/]+)$/)
  if (blogMatch) {
    const slug = blogMatch[1]
    const post = BLOG_POSTS.find((p) => p.slug === slug)
    if (post) {
      return {
        path: pathname,
        title: post.title[lang] ?? post.title.en,
        description: post.excerpt[lang] ?? post.excerpt.en,
      }
    }
    return {
      path: pathname,
      title: 'Post Not Found',
      description: 'The requested MotoPass Insights article could not be found.',
    }
  }

  const meta = ROUTE_SEO[pathname]
  if (meta) return { ...meta, path: pathname }

  return {
    path: pathname,
    title: 'Page Not Found',
    description: 'The page you requested does not exist on MotoPass.',
  }
}

export function absoluteUrl(path: string): string {
  if (path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}