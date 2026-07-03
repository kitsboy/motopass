import type { Program } from '../types/program'

export function ProgramsTable({ programs, portfolio, onSelect, onToggleAcquired }: {
  programs: Program[]
  portfolio: number[]
  onSelect: (p: Program) => void
  onToggleAcquired: (id: number) => void
}) {
  return (
    <div className="overflow-x-auto rounded-mp-lg border border-mp bg-card shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-mp bg-section/60 text-left text-xs text-ink-muted uppercase tracking-wide">
            <th className="p-3 font-medium">Country</th>
            <th className="p-3 font-medium">Region</th>
            <th className="p-3 font-medium">Min $</th>
            <th className="p-3 font-medium">BTC</th>
            <th className="p-3 font-medium">⚡</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Portfolio</th>
          </tr>
        </thead>
        <tbody>
          {programs.map(p => (
            <tr key={p.id} className="border-b border-mp/60 hover:bg-btc-orange-soft/30 cursor-pointer transition-colors" onClick={() => onSelect(p)}>
              <td className="p-3 font-medium text-ink">{p.flag} {p.name}</td>
              <td className="p-3 text-ink-secondary">{p.region}</td>
              <td className="p-3 font-mono text-ink">${(p.finance.min_investment_usd ?? 0).toLocaleString()}</td>
              <td className="p-3 text-btc-orange-deep font-medium">{p.finance.crypto_friendly_score ?? '—'}/10</td>
              <td className="p-3">{p.lightning_ready ? '✓' : '—'}</td>
              <td className="p-3 text-xs text-ink-secondary">{p.status.split(' - ')[0]}</td>
              <td className="p-3">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onToggleAcquired(p.id) }}
                  className={portfolio.includes(p.id) ? 'chip-active text-[10px] !py-0.5' : 'chip text-[10px] !py-0.5'}
                >
                  {portfolio.includes(p.id) ? 'Acquired' : 'Mark'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}