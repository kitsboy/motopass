import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card } from './Card'

export type HowItWorksStep = {
  n: string
  title: string
  body: string
  icon?: LucideIcon
  link?: { to: string; label: string; external?: boolean }
}

export type HowItWorksSectionProps = {
  eyebrow: string
  title: string
  intro?: string
  steps: HowItWorksStep[]
  footerNote?: string
  className?: string
}

export function HowItWorksSection({
  eyebrow,
  title,
  intro,
  steps,
  footerNote,
  className = '',
}: HowItWorksSectionProps) {
  return (
    <section className={`mb-8 ${className}`.trim()} aria-labelledby="how-it-works-heading">
      <div className="mb-6 max-w-2xl">
        <span className="club-eyebrow block mb-2">{eyebrow}</span>
        <h2 id="how-it-works-heading" className="font-display text-h3 font-semibold text-ink tracking-tight">
          {title}
        </h2>
        {intro && (
          <p className="mt-3 font-body text-sm text-ink-secondary leading-relaxed">{intro}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <Card key={step.n} animate delay={0.04 + i * 0.03} className="!p-5 relative overflow-hidden">
              <span className="absolute top-4 right-5 font-display text-4xl font-bold text-btc-orange/8 select-none">
                {step.n}
              </span>
              <div className="relative">
                {Icon && (
                  <div className="w-9 h-9 rounded-xl bg-btc-orange-soft border border-btc-orange/20 flex items-center justify-center mb-3">
                    <Icon size={16} className="text-btc-orange" aria-hidden />
                  </div>
                )}
                <h3 className="font-display font-semibold text-ink mb-2 pr-10">{step.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{step.body}</p>
                {step.link && (
                  step.link.external ? (
                    <a
                      href={step.link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-chrome font-medium text-mp-btc-text hover:underline underline-offset-2"
                    >
                      {step.link.label} <ArrowRight size={12} />
                    </a>
                  ) : (
                    <Link
                      to={step.link.to}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-chrome font-medium text-mp-btc-text hover:underline underline-offset-2"
                    >
                      {step.link.label} <ArrowRight size={12} />
                    </Link>
                  )
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {footerNote && (
        <p className="mt-4 text-xs text-ink-muted font-body leading-relaxed max-w-3xl">{footerNote}</p>
      )}
    </section>
  )
}