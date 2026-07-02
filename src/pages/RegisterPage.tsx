import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ArrowRight } from 'lucide-react'
import { connectNostr, hasNostrExtension } from '../lib/nostr'
import { useUser } from '../context/UserContext'
import type { UserProfile } from '../types/user'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'

const PROGRAMS = ['Uruguay RBI', 'El Salvador', 'UAE Golden Visa', 'Singapore', 'Portugal D7', 'Georgia', 'Panama', 'Paraguay']

export function RegisterPage() {
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
    if (s) setNostr(s)
    setLoading(false)
    if (s) setStep(2)
  }

  const submit = () => {
    if (!nostr || !name.trim() || !program) return
    const country = program.split(' ')[0]
    const profile: UserProfile = {
      npub: nostr.npub,
      pubkey: nostr.pubkey,
      displayName: name.trim(),
      program,
      country,
      agentId: 'kimi',
      agentName: 'Kimi',
      status: 'registered',
      registeredAt: new Date().toISOString(),
      documents: [],
      payments: [],
    }
    setProfile(profile)
    navigate('/dashboard')
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-lg mx-auto">
      <div className="section-label mb-1">REGISTRATION</div>
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-2">Register with Nostr</h1>
      <p className="text-sm text-sovereign-silver mb-8">No email. Your npub is your account. Documents stamped via Satohash.io.</p>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <AnimatedBadge key={s} status={step >= s ? 'success' : 'neutral'}>Step {s}</AnimatedBadge>
        ))}
      </div>

      {step === 1 && (
        <div className="card space-y-4 text-center">
          <Zap size={32} className="mx-auto text-purple-400" />
          <p className="text-sm text-sovereign-silver">Connect your Nostr browser extension to create your MotoPass identity.</p>
          <button type="button" onClick={connect} disabled={loading} className="btn-primary w-full">
            {loading ? 'Connecting…' : 'Connect Nostr extension'}
          </button>
        </div>
      )}

      {step === 2 && nostr && (
        <div className="card space-y-4">
          <AnimatedBadge status="success">Nostr connected</AnimatedBadge>
          <p className="text-xs font-mono text-purple-300 truncate">{nostr.npub}</p>
          <div>
            <label className="text-xs text-sovereign-silver block mb-1">Display name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-sovereign-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-btc-orange/50" />
          </div>
          <div>
            <label className="text-xs text-sovereign-silver block mb-1">Target program / country</label>
            <select value={program} onChange={e => setProgram(e.target.value)} className="w-full bg-sovereign-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-btc-orange/50">
              <option value="">Select…</option>
              {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => setStep(3)} disabled={!name.trim() || !program} className="btn-primary w-full flex items-center justify-center gap-2">
            Continue <ArrowRight size={14} />
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Confirm registration</h3>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-sovereign-silver">Name</dt><dd>{name}</dd></div>
            <div className="flex justify-between"><dt className="text-sovereign-silver">Program</dt><dd>{program}</dd></div>
            <div className="flex justify-between"><dt className="text-sovereign-silver">Agent</dt><dd>Kimi</dd></div>
          </dl>
          <button type="button" onClick={submit} className="btn-primary w-full">Create account & go to dashboard</button>
        </div>
      )}
    </div>
  )
}