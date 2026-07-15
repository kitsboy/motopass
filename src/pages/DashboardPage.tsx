import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useUser } from '../context/UserContext'
import { ProgressTracker } from '../components/ProgressTracker'
import { PaymentMethods } from '../components/PaymentMethods'
import { AgentCardKimi } from '../components/AgentCardKimi'
import { PaigeChat } from '../components/PaigeChat'
import { PaigeEnforcementCard } from '../components/dashboard/PaigeEnforcementCard'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { ClassyModal } from '../components/ui/ClassyModal'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import type { PaymentRail } from '../types/user'
import type { PaymentInvoice } from '../lib/payments'

export function DashboardPage() {
  const { t } = useI18n()
  const { profile, isLoggedIn, setProfile, logout } = useUser()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn || !profile) return
    const next = searchParams.get('next')
    if (next && next.startsWith('/') && next !== '/dashboard') {
      navigate(next, { replace: true })
    }
  }, [isLoggedIn, profile, searchParams, navigate])

  if (!isLoggedIn || !profile) {
    const next = searchParams.get('next') || '/dashboard'
    return <Navigate to={`/register?next=${encodeURIComponent(next)}`} replace />
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
    <div className="page-container px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <PageHeader
        title={formatT(t, 'dashboard.welcome', { name: profile.displayName })}
        eyebrow={t('dashboard.eyebrow')}
        subtitle={profile.npub}
        actions={
          <button type="button" onClick={() => setLogoutOpen(true)} className="chip text-xs hover:!border-status-red/40 hover:!text-status-red">
            {t('dashboard.logout')}
          </button>
        }
      />

      <div className="mb-8">
        <PaigeEnforcementCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card-elevated">
          <h2 className="font-display font-semibold text-ink mb-4">{t('dashboard.progress')}</h2>
          <AnimatedBadge status="info" className="mb-4">{profile.program}</AnimatedBadge>
          <ProgressTracker status={profile.status} />
          <Link to="/profile" className="btn-secondary w-full mt-5 text-center block">{t('dashboard.uploadDocs')}</Link>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-display font-semibold text-ink mb-2">{t('dashboard.liaison')}</h2>
            <p className="text-sm text-ink-secondary mb-3">
              {t('dashboard.liaisonFor')} <strong className="text-ink">{profile.country}</strong>: {profile.agentName}
            </p>
            <AnimatedBadge status="success">{formatT(t, 'dashboard.assigned', { name: profile.agentName })}</AnimatedBadge>
          </div>
          <AgentCardKimi />
          <PaigeChat />
        </div>
      </div>

      <div className="card">
        <PaymentMethods onPay={handlePay} payments={profile.payments} />
      </div>

      <ClassyModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        closeLabel={t('modal.close')}
        title={t('dashboard.logoutTitle')}
        subtitle={t('dashboard.logoutSubtitle')}
        maxWidth="md"
      >
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setLogoutOpen(false)} className="btn-secondary text-sm">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={confirmLogout} className="btn-primary text-sm !bg-status-red hover:!bg-status-red/90">
            {t('dashboard.logout')}
          </button>
        </div>
      </ClassyModal>
    </div>
  )
}