import type { Program } from '../types/program'

export function ProgramsTable({ programs, portfolio, onSelect, onToggleAcquired }: {
  programs: Program[]
  portfolio: number[]
  onSelect: (p: Program) => void
  onToggleAcquired: (id: number) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs text-sovereign-silver">
            <th className="p-3">Country</th>
            <th className="p-3">Region</th>
            <th className="p-3">Min $</th>
            <th className="p-3">BTC</th>
            <th className="p-3">⚡</th>
            <th className="p-3">Status</th>
            <th className="p-3">Portfolio</th>
          </tr>
        </thead>
        <tbody>
          {programs.map(p => (
            <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => onSelect(p)}>
              <td className="p-3 font-medium">{p.flag} {p.name}</td>
              <td className="p-3 text-sovereign-silver">{p.region}</td>
              <td className="p-3 font-mono">${(p.finance.min_investment_usd ?? 0).toLocaleString()}</td>
              <td className="p-3">{p.finance.crypto_friendly_score ?? '—'}/10</td>
              <td className="p-3">{p.lightning_ready ? '✓' : '—'}</td>
              <td className="p-3 text-xs">{p.status.split(' - ')[0]}</td>
              <td className="p-3">
                <button type="button" onClick={e => { e.stopPropagation(); onToggleAcquired(p.id) }}
                  className={`text-xs px-2 py-0.5 rounded-full border ${portfolio.includes(p.id) ? 'border-status-green text-status-green' : 'border-white/20 text-sovereign-silver'}`}>
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