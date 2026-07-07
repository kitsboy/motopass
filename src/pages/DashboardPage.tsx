import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { ProgressTracker } from '../components/ProgressTracker'
import { PaymentMethods } from '../components/PaymentMethods'
import { AgentCardKimi } from '../components/AgentCardKimi'
import { PaigeStub } from '../components/PaigeStub'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { ClassyModal } from '../components/ui/ClassyModal'
import type { PaymentRail } from '../types/user'
import type { PaymentInvoice } from '../lib/payments'

export function DashboardPage() {
  const { profile, isLoggedIn, setProfile, logout } = useUser()
  const [logoutOpen, setLogoutOpen] = useState(false)

  if (!isLoggedIn || !profile) {
    return (
      <div className="px-4 py-20 text-center max-w-md mx-auto">
        <div className="card-elevated py-12">
          <p className="text-ink-secondary mb-6">Connect your Nostr account to view progress.</p>
          <Link to="/register" className="btn-primary">Register with Nostr</Link>
        </div>
      </div>
    )
  }

  const handlePay = (rail: PaymentRail, amountSats: number, _invoice: PaymentInvoice) => {
    setProfile({
      ...profile,
      payments: [{
        id: `pay-${Date.now()}`, rail, amountSats, status: 'confirmed',
        createdAt: new Date().toISOString(), label: `${profile.program} application fee`,
        txId: `demo-${rail}-${Date.now().toString(36)}`,
      }, ...profile.payments],
      status: 'payment_pending',
    })
  }

  const confirmLogout = () => {
    logout()
    setLogoutOpen(false)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <PageHeader
        title={`Welcome, ${profile.displayName}`}
        eyebrow="DASHBOARD"
        subtitle={profile.npub}
        actions={
          <button type="button" onClick={() => setLogoutOpen(true)} className="chip text-xs hover:!border-status-red/40 hover:!text-status-red">
            Log out
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card-elevated">
          <h2 className="font-display font-semibold text-ink mb-4">Application progress</h2>
          <AnimatedBadge status="info" className="mb-4">{profile.program}</AnimatedBadge>
          <ProgressTracker status={profile.status} />
          <Link to="/profile" className="btn-secondary w-full mt-5 text-center block">Upload documents →</Link>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-display font-semibold text-ink mb-2">Country liaison</h2>
            <p className="text-sm text-ink-secondary mb-3">
              Agent for <strong className="text-ink">{profile.country}</strong>: {profile.agentName}
            </p>
            <AnimatedBadge status="success">{profile.agentName} assigned</AnimatedBadge>
          </div>
          <AgentCardKimi />
          <PaigeStub />
        </div>
      </div>

      <div className="card">
        <PaymentMethods onPay={handlePay} payments={profile.payments} />
      </div>

      <ClassyModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Log out?"
        subtitle="This will clear your local profile and application progress from this device."
        maxWidth="md"
      >
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setLogoutOpen(false)} className="btn-secondary text-sm">
            Cancel
          </button>
          <button type="button" onClick={confirmLogout} className="btn-primary text-sm !bg-status-red hover:!bg-status-red/90">
            Log out
          </button>
        </div>
      </ClassyModal>
    </div>
  )
}