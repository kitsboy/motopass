import { Link } from 'react-router-dom'
import { SeoHead } from '../components/SeoHead'
import { PageHeader } from '../components/ui/PageHeader'

const QUICK_LINKS = [
  { to: '/', label: 'Pitch' },
  { to: '/programs', label: 'Programs' },
  { to: '/blog', label: 'Insights' },
  { to: '/verify', label: 'Verify' },
  { to: '/register', label: 'Register' },
]

export function NotFoundPage() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <SeoHead
        title="Page Not Found"
        description="The page you requested does not exist on MotoPass. Explore sovereign passport programs, insights, and verification tools."
        path="/404"
        noIndex
      />
      <PageHeader
        eyebrow="404"
        title="Page not found"
        subtitle="This route is not part of the MotoPass sovereign mobility platform."
      />
      <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
        The URL may be outdated or mistyped. Use the links below to continue exploring Bitcoin-verified
        passport and residency programs.
      </p>
      <nav className="flex flex-wrap gap-3" aria-label="Helpful links">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-chip border border-mp-border px-3 py-2 text-sm font-medium text-mp-ink-secondary hover:border-mp-border-strong hover:text-accent transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}