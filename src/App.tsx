import React, { useEffect, useState } from 'react'
import { Shield, Zap, Globe, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react'

interface Program {
  id: number
  name: string
  category: string
  region: string
  status: string
  bitcoin_integration: string
  finance: {
    min_investment_usd: number | null
    typical_investment_usd: number | null
    gov_fees_usd: number | null
    processing_time_months: string
    tax_benefits: string
    crypto_friendly_score: number | null
    bitcoin_specific: string
  }
  details: string
  last_checked: string
}

const App: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([])
  const [filtered, setFiltered] = useState<Program[]>([])
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sovereign design tokens (see DESIGN.md)
  const btcOrange = '#F7931A'

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Load the same research data used by the pristine demo
        const res = await fetch('/research/countries.json')
        if (!res.ok) throw new Error('Failed to load countries.json')
        const data = await res.json()
        const progs: Program[] = data.programs || []
        setPrograms(progs)
        setFiltered(progs)
      } catch (e: any) {
        setError(e.message || 'Could not load research data')
        // Fallback demo data so the dev env is always useful
        const fallback: Program[] = [
          { id: 1, name: 'El Salvador', category: 'legal_tender_bitcoin', region: 'Central America', status: 'Acquired - Pioneer', bitcoin_integration: 'Bitcoin legal tender (voluntary). Strong government support.', finance: { min_investment_usd: 0, typical_investment_usd: 30000, gov_fees_usd: 5000, processing_time_months: '1-4', tax_benefits: 'Favorable crypto treatment', crypto_friendly_score: 9, bitcoin_specific: 'Ideal for MotoPass pilots.' }, details: 'First Bitcoin legal tender nation.', last_checked: '2026-06-05' },
          { id: 3, name: 'Uruguay', category: 'rbi_cbi', region: 'South America', status: 'Acquired - Researching', bitcoin_integration: 'Growing crypto-friendly. Territorial tax attractive.', finance: { min_investment_usd: 100000, typical_investment_usd: 150000, gov_fees_usd: 15000, processing_time_months: '3-8', tax_benefits: 'Territorial tax system', crypto_friendly_score: 8, bitcoin_specific: 'Strong Latin America hub candidate.' }, details: 'Premium RBI with excellent quality of life.', last_checked: '2026-06-01' },
        ]
        setPrograms(fallback)
        setFiltered(fallback)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Simple client-side filtering (expand this massively in Phase 1)
  useEffect(() => {
    let result = [...programs]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.details.toLowerCase().includes(q) ||
        p.bitcoin_integration.toLowerCase().includes(q)
      )
    }

    if (regionFilter !== 'All') {
      result = result.filter(p => p.region === regionFilter)
    }

    setFiltered(result)
  }, [search, regionFilter, programs])

  const regions = ['All', ...Array.from(new Set(programs.map(p => p.region)))]

  const openPristineDemo = () => {
    window.open('/website/index.html', '_blank')
  }

  const openDocs = (doc: string) => {
    // In real deployment these would be proper routes or GitHub links.
    // For dev, we just alert the intent — user can open the markdown files directly.
    alert(`Open docs/${doc} in your editor or the built site when deployed.\n\nThis dev environment is the place to implement the vision from PRODUCT-SCOPE-ROADMAP.md, DESIGN.md, and next-prompt.md.`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f4f4f5] selection:bg-[#F7931A] selection:text-black">
      {/* Top Nav — sovereign style */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F7931A] to-[#c46f0f] flex items-center justify-center text-black font-bold text-xl tracking-[-1px]">₿</div>
            <div>
              <div className="font-semibold tracking-[0.5px] text-lg">MOTOPASS</div>
              <div className="text-[10px] text-[#a1a1aa] -mt-1">LIVE • BUILD-20260702-006</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={openPristineDemo}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#a1a1aa]/40 hover:border-[#F7931A] hover:text-[#F7931A] transition-colors"
            >
              <ExternalLink size={14} /> Open Pristine Demo
            </button>
            <a
              href="https://github.com/kitsboy/motopass"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a1a1aa] hover:text-white transition-colors hidden sm:block"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7931A]/10 text-[#F7931A] text-xs tracking-[2px] mb-4">
            <Shield size={12} /> TRUTH YOU CAN VERIFY
          </div>

          <h1 className="text-6xl md:text-7xl font-semibold tracking-[-2.5px] leading-[0.92] mb-6">
            The sovereign<br />command center.<br />
            <span className="text-[#F7931A]">In development.</span>
          </h1>

          <p className="text-xl text-[#a1a1aa] max-w-md">
            Modern React + TypeScript + Tailwind environment for MotoPass.
            The pristine single-file demo at <span className="text-white">/website/index.html</span> remains the clean reference.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <button onClick={() => document.getElementById('explorer')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary inline-flex items-center gap-2">
              Explore Programs <ArrowRight size={16} />
            </button>
            <button onClick={openPristineDemo} className="btn-secondary inline-flex items-center gap-2">
              View Pristine Demo <ExternalLink size={15} />
            </button>
          </div>

          <div className="mt-6 text-xs text-[#a1a1aa] flex items-center gap-2">
            <Zap size={14} className="text-[#F7931A]" /> Data loaded from <code className="font-mono text-[#F7931A]/70">/research/countries.json</code> — same source as the working demo.
          </div>
        </div>
      </div>

      {/* Quick Stats + Guidance */}
      <div className="border-y border-white/10 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="section-label mb-2">CURRENT SEED</div>
            <div className="text-4xl font-semibold tracking-tighter text-[#F7931A]">{programs.length}</div>
            <div className="text-[#a1a1aa]">programs in research data (target 50 at flagship depth)</div>
          </div>
          <div className="md:col-span-2 text-[#a1a1aa] space-y-3 text-[15px]">
            <p>
              This is the <strong className="text-white">expansion environment</strong>. Use it to build the full vision described in{' '}
              <button onClick={() => openDocs('PRODUCT-SCOPE-ROADMAP.md')} className="underline hover:text-white">PRODUCT-SCOPE-ROADMAP.md</button>,{' '}
              <button onClick={() => openDocs('DESIGN-REFERENCE.md')} className="underline hover:text-white">DESIGN.md</button>, and{' '}
              <button onClick={() => openDocs('next-prompt.md')} className="underline hover:text-white">next-prompt.md</button>.
            </p>
            <p className="text-xs">
              Next big surfaces (per next-prompt): My Portfolio • Interactive Stacking Simulator • Finance Compare • Rich “Verify on Bitcoin” flows • Advanced filters + saved views.
            </p>
          </div>
        </div>
      </div>

      {/* Explorer (early but real) */}
      <div id="explorer" className="max-w-7xl mx-auto px-6 pt-12 pb-24">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="section-label">ALL PROGRAMS — LIVE DATA</div>
            <div className="text-3xl tracking-[-1px] font-semibold">Research Explorer (Preview)</div>
          </div>
          <button
            onClick={() => { setSearch(''); setRegionFilter('All') }}
            className="text-xs flex items-center gap-1 text-[#a1a1aa] hover:text-white"
          >
            <RefreshCw size={13} /> Reset filters
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, details, or Bitcoin notes..."
            className="flex-1 bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-[#a1a1aa]/60 focus:outline-none focus:border-[#F7931A]/50"
          />
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F7931A]/50"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button onClick={openPristineDemo} className="btn-secondary whitespace-nowrap">Open full demo →</button>
        </div>

        {loading && <div className="text-[#a1a1aa]">Loading research data…</div>}
        {error && <div className="text-[#f59e0b] mb-4">Note: Using fallback data because live JSON fetch was unavailable in this context. The pristine demo always loads the real file.</div>}

        {/* Program Cards — sovereign glass style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && !loading && (
            <div className="col-span-full text-[#a1a1aa] py-12 text-center">No programs match your filters.</div>
          )}

          {filtered.map((p) => (
            <div key={p.id} className="program-card group" onClick={() => alert(`Program detail modal would open here.\n\nIn the real app this opens the rich Finance + Bitcoin + Proof modal (see PRODUCT-SCOPE-ROADMAP Phase 1 and the pristine demo modals).`)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-lg tracking-[-0.3px] group-hover:text-[#F7931A] transition-colors">{p.name}</div>
                  <div className="text-xs text-[#a1a1aa]">{p.region} • {p.category.replace(/_/g, ' ')}</div>
                </div>
                <div className={`text-[10px] px-2.5 py-0.5 rounded-full border ${p.status.includes('Acquired') ? 'border-[#22c55e] text-[#22c55e]' : 'border-[#f59e0b] text-[#f59e0b]'}`}>
                  {p.status}
                </div>
              </div>

              <div className="text-sm text-[#a1a1aa] line-clamp-3 mb-4">{p.details}</div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-px bg-white/5 rounded">Min ~${(p.finance.min_investment_usd || 0).toLocaleString()}</div>
                  {p.finance.crypto_friendly_score && (
                    <div className="px-2 py-px bg-white/5 rounded flex items-center gap-1">
                      <Zap size={11} /> {p.finance.crypto_friendly_score}/10
                    </div>
                  )}
                </div>
                <div className="proof-badge flex items-center gap-1">
                  <Globe size={11} /> VERIFY
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-[#F7931A]/80 group-hover:text-[#F7931A] transition-colors">
                {p.bitcoin_integration.slice(0, 110)}…
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-[#a1a1aa]">
          This is a minimal live preview of the data layer + sovereign styling. The full experience (Portfolio, Stacking Simulator, deep modals, real proof integration, Paige) is documented in <span className="text-white">docs/PRODUCT-SCOPE-ROADMAP.md</span> and ready to be built here.
        </div>
      </div>

      {/* Footer / Guidance */}
      <footer className="border-t border-white/10 py-12 text-xs text-[#a1a1aa]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-y-8">
          <div>
            <div className="font-mono text-[10px] tracking-[2px] mb-2 text-[#F7931A]">NEXT STEPS IN THIS ENVIRONMENT</div>
            <ul className="space-y-1.5">
              <li>• Implement My Portfolio + Stacking Simulator (see next-prompt.md)</li>
              <li>• Add rich Finance Compare + timestamp proof components</li>
              <li>• Wire real Satohash links from the research data</li>
              <li>• Add Nostr + Lightning integrations (Phase 2)</li>
              <li>• Use shadcn-ui + react-components skills for high-fidelity sections</li>
            </ul>
          </div>
          <div className="md:text-right space-y-1.5">
            <div>Pristine demo (always works): <button onClick={openPristineDemo} className="underline hover:text-white">/website/index.html</button></div>
            <div>Detailed scope: <button onClick={() => openDocs('PRODUCT-SCOPE-ROADMAP.md')} className="underline hover:text-white">docs/PRODUCT-SCOPE-ROADMAP.md</button></div>
            <div>Design rules: <button onClick={() => openDocs('DESIGN-REFERENCE.md')} className="underline hover:text-white">DESIGN.md</button></div>
            <div className="pt-2 text-[#F7931A]">npm run dev • npm run build • Truth You Can Verify.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
