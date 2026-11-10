import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { ReceiptInspector } from '../components/lightning/ReceiptInspector'
import { AddressPsbtTool, SilentPaymentsTool } from '../components/tools/BitcoinCards'
import { Bolt11SignatureTool, Bolt11Tool } from '../components/tools/Bolt11Cards'
import { Bolt12RequestTool, Bolt12Tool } from '../components/tools/Bolt12Cards'
import { LnurlTool, PreimageTool, ZapReceiptTool } from '../components/tools/LightningCards'
import { Nip05Tool, Nip17Tool } from '../components/tools/NostrCards'
import { MessageSignatureTool } from '../components/tools/MessageCards'
import { VerificationHistoryPanel } from '../components/tools/VerificationHistoryPanel'

const BITCOIN_TOOLS = [
  { id: 'bolt11', href: '#bolt11', label: 'BOLT11 invoice', network: false, group: 'invoice' },
  { id: 'bolt11-signature', href: '#bolt11-signature', label: 'BOLT11 signature', network: false, group: 'invoice' },
  { id: 'bolt12', href: '#bolt12', label: 'BOLT12 message', network: false, group: 'offer' },
  { id: 'bolt12-request', href: '#bolt12-request', label: 'BOLT12 request', network: false, group: 'offer' },
  { id: 'preimage', href: '#preimage', label: 'Preimage check', network: false, group: 'lightning' },
  { id: 'receipt', href: '#receipt', label: 'Receipt verify', network: false, group: 'lightning' },
  { id: 'lnurl', href: '#lnurl', label: 'LNURL inspect', network: true, group: 'lightning' },
  { id: 'zap', href: '#zap', label: 'Zap receipt', network: false, group: 'nostr' },
  { id: 'nip05', href: '#nip05', label: 'NIP-05 lookup', network: true, group: 'nostr' },
  { id: 'nip17', href: '#nip17', label: 'NIP-17 DM', network: false, group: 'nostr' },
  { id: 'address-psbt', href: '#address-psbt', label: 'Address / PSBT', network: false, group: 'bitcoin' },
  { id: 'message-signature', href: '#message-signature', label: 'Signed message', network: false, group: 'bitcoin' },
  { id: 'silent-payments', href: '#silent-payments', label: 'Silent Payments', network: false, group: 'bitcoin' },
] as const

const GUIDE: Array<{
  id: (typeof BITCOIN_TOOLS)[number]['id']
  label: string
  hint: string
  keywords: string
}> = [
  { id: 'bolt11', label: 'An invoice', hint: 'BOLT11 amount, expiry, payee key', keywords: 'bolt11 invoice lightning lnbc payment' },
  { id: 'bolt12', label: 'An offer or request', hint: 'BOLT12 TLV and signatures', keywords: 'bolt12 offer invoice request lno lnr lni' },
  { id: 'address-psbt', label: 'A PSBT or address', hint: 'Scripts, coin control, signatures', keywords: 'psbt address bitcoin base58 bech32 multisig taproot' },
  { id: 'message-signature', label: 'A signed message', hint: 'BIP-137 proof of key control', keywords: 'bip137 bip-137 signed message signature proof address' },
  { id: 'silent-payments', label: 'A Silent Payment', hint: 'sp1 address and one output', keywords: 'silent payment bip352 sp1 tsp1' },
  { id: 'nip17', label: 'A Nostr DM', hint: 'Gift wrap, seal and rumor', keywords: 'nip17 nip-17 nip59 gift wrap dm nostr message' },
  { id: 'nip05', label: 'A NIP-05 name', hint: 'Domain mapping and continuity', keywords: 'nip05 nip-05 name domain nostr identity' },
]

export function ToolsPage() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const id = window.location.hash.replace('#', '')
    return BITCOIN_TOOLS.some(tool => tool.id === id) ? id : null
  })

  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.replace('#', '')
      setActive(BITCOIN_TOOLS.some(tool => tool.id === id) ? id : null)
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const select = (id: string) => {
    setActive(id)
    history.replaceState(null, '', `#${id}`)
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const showAll = () => {
    setActive(null)
    history.replaceState(null, '', window.location.pathname)
  }

  const visibility = (id: string) => `scroll-mt-28 ${active && active !== id ? 'hidden lg:block' : ''}`
  const needle = query.trim().toLowerCase()
  const filteredGuide = needle
    ? GUIDE.filter(item => `${item.label} ${item.hint} ${item.keywords}`.toLowerCase().includes(needle))
    : GUIDE
  const activeIndex = active ? BITCOIN_TOOLS.findIndex(tool => tool.id === active) : -1
  const move = (delta: number) => {
    if (activeIndex < 0) return
    const next = (activeIndex + delta + BITCOIN_TOOLS.length) % BITCOIN_TOOLS.length
    select(BITCOIN_TOOLS[next].id)
  }

  return (
    <div className="page-container px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="BITCOIN TOOLS"
        title="Read it yourself"
        subtitle="Start with what you have, then read it in this tab. LNURL and NIP-05 are the only network calls, and only when you press Inspect. Each result carries a verification trail and says what it cannot prove."
        actions={
          <Link to="/verify" className="chip text-xs">
            Verify a stamped hash →
          </Link>
        }
      />

      <section aria-label="Choose a tool by what you have" className="mb-5 rounded-mp-lg border border-mp-border-subtle bg-mp-card/40 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">What do you have?</p>
          {active && (
            <button type="button" onClick={showAll} className="font-chrome text-[9px] uppercase tracking-wide text-mp-ink-tertiary underline underline-offset-2 hover:text-mp-ink">
              Show all tools
            </button>
          )}
        </div>
        <label htmlFor="tool-filter" className="mt-2 block font-chrome text-[9px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">
          Filter tools
        </label>
        <input
          id="tool-filter"
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Filter tools by artifact or format"
          className="mt-1 w-full rounded-mp-md border border-mp-border-subtle bg-mp-canvas/50 px-2.5 py-1.5 text-[11px] text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/30"
        />
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGuide.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => select(item.id)}
              aria-pressed={active === item.id}
              className={`rounded-mp-md border px-2.5 py-2 text-left transition-colors ${active === item.id ? 'border-mp-proof-border bg-mp-proof/10' : 'border-mp-border-subtle bg-mp-canvas/40 hover:border-mp-border-strong'}`}
            >
              <span className="block text-[11px] font-semibold text-mp-ink">{item.label}</span>
              <span className="mt-0.5 block text-[9px] leading-snug text-mp-ink-tertiary">{item.hint}</span>
            </button>
          ))}
          {filteredGuide.length === 0 && (
            <p className="text-[10px] leading-relaxed text-mp-ink-tertiary sm:col-span-2 lg:col-span-3">No guide match. Clear the filter or use the full list below.</p>
          )}
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-mp-ink-tertiary lg:hidden">
          On a small screen, choosing one card shows only that card. The guide stays here so you can switch without scrolling.
        </p>
      </section>

      <VerificationHistoryPanel />

      <nav
        aria-label="Bitcoin tools on this page"
        className="sticky top-16 z-20 -mx-1 mb-5 rounded-mp-lg border border-mp-border-subtle bg-mp-canvas/95 p-2 shadow-sm backdrop-blur"
      >
        <p className="mb-1.5 px-1 font-chrome text-[9px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
          13 tools · 11 local · 2 network
        </p>
        {active && (
          <div aria-label="Tool switcher" className="mb-1.5 flex items-center gap-1 rounded-full border border-mp-border-subtle bg-mp-canvas/80 p-0.5 lg:hidden">
            <button type="button" onClick={() => move(-1)} className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-mp-ink-secondary">
              Previous
            </button>
            <span className="min-w-0 flex-1 truncate text-center font-chrome text-[9px] uppercase tracking-wide text-mp-ink-tertiary">
              {BITCOIN_TOOLS[activeIndex]?.label ?? active}
            </span>
            <button type="button" onClick={() => move(1)} className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-mp-ink-secondary">
              Next
            </button>
            <button type="button" onClick={showAll} className="rounded-full border border-mp-border-subtle px-2 py-0.5 text-[10px] font-semibold text-mp-ink-tertiary">
              Guide
            </button>
          </div>
        )}
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          {BITCOIN_TOOLS.map(tool => (
            <a
              key={tool.href}
              href={tool.href}
              onClick={event => {
                event.preventDefault()
                select(tool.id)
              }}
              aria-current={active === tool.id ? 'true' : undefined}
              className={`chip shrink-0 gap-1 whitespace-nowrap text-[10px] ${active === tool.id ? 'border-mp-proof-border text-mp-proof' : ''}`}
              title={tool.network ? 'Makes one https request' : 'Runs entirely in this tab'}
            >
              {tool.label}
              <span className={tool.network ? 'text-mp-wax' : 'text-mp-proof'} aria-hidden="true">
                {tool.network ? 'net' : 'local'}
              </span>
            </a>
          ))}
        </div>
      </nav>

      <div className="grid gap-4 lg:grid-cols-2">
        <div id="bolt11" className={visibility('bolt11')}>
          <Bolt11Tool />
        </div>
        <div id="bolt11-signature" className={visibility('bolt11-signature')}>
          <Bolt11SignatureTool />
        </div>
        <div id="bolt12" className={visibility('bolt12')}>
          <Bolt12Tool />
        </div>
        <div id="bolt12-request" className={visibility('bolt12-request')}>
          <Bolt12RequestTool />
        </div>
        <div id="preimage" className={visibility('preimage')}>
          <PreimageTool />
        </div>
        <div id="receipt" className={visibility('receipt')}>
          <Card className="flex min-w-0 flex-col p-4 sm:p-5">
            <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
              <Receipt size={11} aria-hidden="true" />
              NOSTR RECEIPT
              <span className="ml-auto rounded-full border border-mp-proof-border px-1.5 py-0.5 text-[8px] tracking-wide text-mp-proof">
                LOCAL
              </span>
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-mp-ink">Check a gap-tip receipt</h2>
            <div className="mt-3 flex-1">
              <ReceiptInspector />
            </div>
          </Card>
        </div>
        <div id="lnurl" className={visibility('lnurl')}>
          <LnurlTool />
        </div>
        <div id="zap" className={visibility('zap')}>
          <ZapReceiptTool />
        </div>
        <div id="nip05" className={visibility('nip05')}>
          <Nip05Tool />
        </div>
        <div id="nip17" className={visibility('nip17')}>
          <Nip17Tool />
        </div>
        <div id="address-psbt" className={`${visibility('address-psbt')} lg:col-span-2`}>
          <AddressPsbtTool />
        </div>
        <div id="message-signature" className={visibility('message-signature')}>
          <MessageSignatureTool />
        </div>
        <div id="silent-payments" className={visibility('silent-payments')}>
          <SilentPaymentsTool />
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-mp-ink-tertiary">
        Eleven tools run entirely offline. LNURL and NIP-05 are the exceptions: pressing Inspect makes one https request
        to the endpoint or domain you named. A valid BOLT11 checksum and matching payee key mean the invoice is well formed
        and signed by its stated key, not that it is payable; a valid BOLT12 request signature means the message was
        signed by its payer key; a matching preimage means the hash relation holds. None of these proves a payment
        occurred.
      </p>
    </div>
  )
}
