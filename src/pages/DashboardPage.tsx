import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { ProgressTracker } from '../components/ProgressTracker'
import { PaymentMethods } from '../components/PaymentMethods'
import { AgentCardKimi } from '../components/AgentCardKimi'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'
import type { PaymentRail, UserPayment } from '../types/user'
import type { PaymentInvoice } from '../lib/payments'
export function DashboardPage() {
  const { profile, isLoggedIn, setProfile, logout } = useUser()

  if (!isLoggedIn || !profile) {
    return (
      <div className="px-4 py-16 text-center max-w-md mx-auto">
        <p className="text-sovereign-silver mb-4">Connect your Nostr account to view progress.</p>
        <Link to="/register" className="btn-primary inline-block">Register with Nostr</Link>
      </div>
    )
  }

  const handlePay = (rail: PaymentRail, amountSats: number, _invoice: PaymentInvoice) => {
    const payment: UserPayment = {
      id: `pay-${Date.now()}`,
      rail,
      amountSats,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      label: `${profile.program} application fee`,
      txId: `demo-${rail}-${Date.now().toString(36)}`,
    }
    const next = {
      ...profile,
      payments: [payment, ...profile.payments],
      status: 'payment_pending' as const,
    }
    setProfile(next)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <div className="section-label mb-1">DASHBOARD</div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold">Welcome, {profile.displayName}</h1>
          <p className="text-sm text-sovereign-silver mt-1 font-mono truncate max-w-xs">{profile.npub}</p>
        </div>
        <button type="button" onClick={logout} className="text-xs text-sovereign-silver hover:text-white border border-white/15 rounded-full px-3 py-1.5">
          Log out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="font-semibold mb-4">Application progress</h2>
          <AnimatedBadge status="info" className="mb-4">{profile.program}</AnimatedBadge>
          <ProgressTracker status={profile.status} />
          <Link to="/profile" className="btn-secondary w-full mt-4 text-center block">Upload documents →</Link>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold mb-2">Country liaison</h2>
            <p className="text-sm text-sovereign-silver mb-3">
              Agent for <strong className="text-white">{profile.country}</strong>: {profile.agentName}
            </p>
            <AnimatedBadge status="success">{profile.agentName} assigned</AnimatedBadge>
          </div>
          <AgentCardKimi />
        </div>
      </div>

      <div className="card">
        <PaymentMethods onPay={handlePay} payments={profile.payments} />
      </div>
    </div>
  )
}