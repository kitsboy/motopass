import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, ArrowRight } from 'lucide-react'
import { connectNostr, hasNostrExtension } from '../lib/nostr'
import { useUser } from '../context/UserContext'
import type { UserProfile } from '../types/user'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { usePrograms } from '../hooks/usePrograms'
import { useI18n } from '../i18n/I18nContext'
import { isResearchProgram } from '../lib/programAdapter'

export function RegisterPage() {
  const { t } = useI18n()
  const { programs } = usePrograms()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setProfile } = useUser()
  const [step, setStep] = useState(1)
  const [nostr, setNostr] = useState<{ npub: string; pubkey: string } | null>(null)
  const [name, setName] = useState('')
  const [program, setProgram] = useState('')
  const [loading, setLoading] = useState(false)

  const eligible = useMemo(() => programs.filter(p => !isResearchProgram(p)), [programs])
  const byRegion = useMemo(() => {
    const map = new Map<string, typeof eligible>()
    for (const p of eligible) {
      const list = map.get(p.region) ?? []
      list.push(p)
      map.set(p.region, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [eligible])

  const selectedProgram = programs.find(p => p.name === program)
  const isStubSelected = selectedProgram ? isResearchProgram(selectedProgram) : false

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
    if (!nostr || !name.trim() || !program || isStubSelected) return
    setProfile({
      npub: nostr.npub, pubkey: nostr.pubkey, displayName: name.trim(), program,
      country: program.split(' ')[0], agentId: 'kimi', agentName: 'Kimi',
      status: 'registered', registeredAt: new Date().toISOString(), documents: [], payments: [],
    } satisfies UserProfile)
    const next = searchParams.get('next')
    navigate(next && next.startsWith('/') ? next : '/dashboard')
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-lg mx-auto">
      <PageHeader eyebrow="REGISTRATION" title={t('register.title')} subtitle={t('register.subtitle')} />

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
          <p className="text-sm text-ink-secondary">{t('register.connectPrompt')}</p>
          <button type="button" onClick={connect} disabled={loading} className="btn-primary w-full">
            {loading ? t('register.connecting') : t('register.connectBtn')}
          </button>
        </div>
      )}

      {step === 2 && nostr && (
        <div className="card space-y-4">
          <AnimatedBadge status="success">{t('nostr.connected')}</AnimatedBadge>
          <p className="text-xs font-mono text-nostr-violet truncate bg-nostr-violet-soft px-3 py-2 rounded-mp-md">{nostr.npub}</p>
          <div>
            <label htmlFor="register-name" className="text-xs font-medium text-ink-muted block mb-1.5">{t('register.displayName')}</label>
            <input id="register-name" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label htmlFor="register-program" className="text-xs font-medium text-ink-muted block mb-1.5">{t('register.targetProgram')}</label>
            <select
              id="register-program"
              name="organization"
              autoComplete="organization"
              value={program}
              onChange={e => setProgram(e.target.value)}
              aria-invalid={isStubSelected || undefined}
              className={`select-field ${isStubSelected ? 'input-field-error' : ''}`}
            >
              <option value="">{t('register.select')}</option>
              {byRegion.map(([region, list]) => (
                <optgroup key={region} label={region}>
                  {list.map(p => (
                    <option key={p.id} value={p.name}>{p.flag} {p.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {isStubSelected && (
              <p className="text-xs text-status-amber mt-2" role="alert">{t('register.stubWarning')}</p>
            )}
          </div>
          <button type="button" onClick={() => setStep(3)} disabled={!name.trim() || !program || isStubSelected} className="btn-primary w-full flex items-center justify-center gap-2">
            {t('register.continue')} <ArrowRight size={14} />
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-4">
          <h3 className="font-display font-semibold text-ink">{t('register.confirmTitle')}</h3>
          <dl className="text-sm space-y-3">
            {[
              [t('register.confirmName'), name],
              [t('register.confirmProgram'), program],
              [t('register.confirmAgent'), 'Kimi'],
            ].map(([dt, dd]) => (
              <div key={dt} className="flex justify-between border-b border-mp/60 pb-2">
                <dt className="text-ink-muted">{dt}</dt>
                <dd className="font-medium text-ink">{dd}</dd>
              </div>
            ))}
          </dl>
          <button type="button" onClick={submit} disabled={isStubSelected} className="btn-primary w-full">{t('register.submit')}</button>
        </div>
      )}
    </div>
  )
}