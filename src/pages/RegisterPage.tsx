import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ArrowRight } from 'lucide-react'
import { connectNostr, hasNostrExtension } from '../lib/nostr'
import { useUser } from '../context/UserContext'
import type { UserProfile } from '../types/user'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { usePrograms } from '../hooks/usePrograms'
import { useI18n } from '../i18n/I18nContext'

export function RegisterPage() {
  const { t } = useI18n()
  const { programs } = usePrograms()
  const navigate = useNavigate()
  const { setProfile } = useUser()
  const [step, setStep] = useState(1)
  const [nostr, setNostr] = useState<{ npub: string; pubkey: string } | null>(null)
  const [name, setName] = useState('')
  const [program, setProgram] = useState('')
  const [loading, setLoading] = useState(false)

  const connect = async () => {
    if (!hasNostrExtension()) {
      window.open('https://nostr.com/get-started', '_blank')
      return
    }
    setLoading(true)
    const s = await connectNostr()
    setLoading(false)
    if (s) { setNostr(s); setStep(2) }
  }

  const submit = () => {
    if (!nostr || !name.trim() || !program) return
    setProfile({
      npub: nostr.npub, pubkey: nostr.pubkey, displayName: name.trim(), program,
      country: program.split(' ')[0], agentId: 'kimi', agentName: 'Kimi',
      status: 'registered', registeredAt: new Date().toISOString(), documents: [], payments: [],
    } satisfies UserProfile)
    navigate('/dashboard')
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-lg mx-auto">
      <PageHeader eyebrow="REGISTRATION" title="Register with Nostr" subtitle="No email. Your npub is your account. Documents stamped via Satohash.io." />

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <AnimatedBadge key={s} status={step >= s ? 'success' : 'neutral'}>{t('register.step')} {s}</AnimatedBadge>
        ))}
      </div>

      {step === 1 && (
        <div className="card-elevated space-y-5 text-center py-8">
          <div className="w-14 h-14 mx-auto rounded-full bg-nostr-violet-soft flex items-center justify-center">
            <Zap size={28} className="text-nostr-violet" />
          </div>
          <p className="text-sm text-ink-secondary">Connect your Nostr browser extension to create your MotoPass identity.</p>
          <button type="button" onClick={connect} disabled={loading} className="btn-primary w-full">
            {loading ? 'Connecting…' : 'Connect Nostr extension'}
          </button>
        </div>
      )}

      {step === 2 && nostr && (
        <div className="card space-y-4">
          <AnimatedBadge status="success">Nostr connected</AnimatedBadge>
          <p className="text-xs font-mono text-nostr-violet truncate bg-nostr-violet-soft px-3 py-2 rounded-mp-md">{nostr.npub}</p>
          <div>
            <label className="text-xs font-medium text-ink-muted block mb-1.5">Display name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted block mb-1.5">Target program / country</label>
            <select value={program} onChange={e => setProgram(e.target.value)} className="select-field">
              <option value="">Select…</option>
              {programs.map(p => <option key={p.id} value={p.name}>{p.flag} {p.name}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => setStep(3)} disabled={!name.trim() || !program} className="btn-primary w-full flex items-center justify-center gap-2">
            Continue <ArrowRight size={14} />
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-4">
          <h3 className="font-display font-semibold text-ink">Confirm registration</h3>
          <dl className="text-sm space-y-3">
            {[['Name', name], ['Program', program], ['Agent', 'Kimi']].map(([dt, dd]) => (
              <div key={dt} className="flex justify-between border-b border-mp/60 pb-2">
                <dt className="text-ink-muted">{dt}</dt>
                <dd className="font-medium text-ink">{dd}</dd>
              </div>
            ))}
          </dl>
          <button type="button" onClick={submit} className="btn-primary w-full">Create account & go to dashboard</button>
        </div>
      )}
    </div>
  )
}