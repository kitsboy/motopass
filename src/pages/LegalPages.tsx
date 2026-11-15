import type { ReactNode } from 'react'
import { SeoHead } from '../components/SeoHead'
import { PageHeader } from '../components/ui/PageHeader'

function LegalShell({ path, eyebrow, title, updated, children }: { path: string; eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SeoHead title={title} description={eyebrow} path={path} />
      <PageHeader eyebrow={eyebrow} title={title} subtitle={updated} />
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-mp-ink-secondary">{children}</div>
    </div>
  )
}

function Section({ h, children }: { h: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-mp-ink text-base font-semibold tracking-tight">{h}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}

/**
 * PrivacyPage — plain, honest privacy statement. No cookies, no tracking.
 * The operating-entity line is intentionally omitted until one is confirmed
 * (see Terms — the same note applies): we do not invent an EU operator.
 */
export function PrivacyPage() {
  return (
    <LegalShell path="/privacy" eyebrow="Privacy" title="Privacy" updated="Updated 15 Nov 2026">
      <Section h="Browsing is anonymous">
        <p className="text-xs">
          You do not need an account to browse MotoPass, and nothing about your visit is tied to you.
          There are no cookies. We use self-hosted, cookie-less, privacy-respecting analytics that count
          aggregate page views only — no personal data, no cross-site tracking, no advertising.
        </p>
      </Section>
      <Section h="What we store when you apply">
        <p className="text-xs">
          If applications are open, the only records we keep are what you choose to send through the desk:
          the documents and details you provide. It stays on your device where we say so (for stamped
          documents). We do not resell or share your information.
        </p>
      </Section>
      <Section h="Data sources">
        <p className="text-xs">
          The program figures on this site come from public government and official sources. Each figure is
          either shown with its source and a timestamp, or honestly listed as &apos;not on file&apos;. See /proof
          for how each result is timestamped.
        </p>
      </Section>
      <Section h="Operator">
        <p className="text-xs">
          MotoPass is in final pre-launch. The legal operating entity will be named here once confirmed;
          we do not publish an invented company or an &apos;EU legal&apos; address before that exists. If you have a
          data or privacy question, raise it through the application desk.
        </p>
      </Section>
    </LegalShell>
  )
}

/**
 * TermsPage — honest terms & liability. Explicitly not financial, legal or
 * immigration advice. No operator entity is named until one is confirmed.
 */
export function TermsPage() {
  return (
    <LegalShell path="/terms" eyebrow="Terms &amp; Liability" title="Terms &amp; Liability" updated="Updated 15 Nov 2026">
      <Section h="Information, not advice">
        <p className="text-xs">
          MotoPass is a research and comparison tool. Nothing on this site is financial, legal, tax or
          immigration advice. Buying citizenship or a residency-by-investment route, or sending money, is a
          serious decision — confirm current requirements with the government or a licensed professional
          before relying on anything you read here.
        </p>
      </Section>
      <Section h="Programs change">
        <p className="text-xs">
          Rules, minimums and availability change. Every figure states whether it is traced to an official
          page and when it was checked; anything we cannot source is shown as &apos;not on file&apos; rather than made
          up. Statuses are dated and expire — a program that looks open may have closed since publication.
        </p>
      </Section>
      <Section h="No custody, no guarantees">
        <p className="text-xs">
          MotoPass is not an authorized advisor and never holds your funds. Payment rails we describe are
          shown for information; you pay a government or its licensed agent directly. We make no guarantee
          that any program will accept an application or that figures are current.
        </p>
      </Section>
      <Section h="Liability">
        <p className="text-xs">
          The service is provided &apos;as is&apos;. To the extent permitted by law, MotoPass accepts no liability for
          decisions made after reading this site, or for losses from acting on figures that later prove out
          of date.
        </p>
      </Section>
      <Section h="Operator">
        <p className="text-xs">
          The legal operating entity behind MotoPass will be named here once confirmed. Until then we state
          plainly that no named operator is published — we do not present a placeholder as a real company.
        </p>
      </Section>
    </LegalShell>
  )
}
