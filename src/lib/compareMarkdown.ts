import type { Program } from '../types/program'

type DiffRow = {
  label: string
  valueKey: (p: Program) => string
  render: (p: Program) => string
  /** Claim path behind a figure (e.g. 'finance.min_investment_usd') — enables the sourced flag in exports. */
  figurePath?: (p: Program) => string | undefined
}

export function compareDiffMarkdown(
  programs: Program[],
  rows: DiffRow[],
  rowValuesDiffer: (row: DiffRow, programs: Program[]) => boolean,
): string {
  if (programs.length < 2) return ''
  const diffRows = rows.filter(r => rowValuesDiffer(r, programs))
  const header = `## Program compare — ${programs.map(p => p.name).join(' vs ')}\n`
  const disclaimer =
    `_Note: a figure only has a source when it is backed by the page that states it. ` +
    `Figures without one are estimates. See https://motopass.giveabit.io for each figure's source._\n`
  if (!diffRows.length) {
    return `${header}\n${disclaimer}\n_No differing metrics._\n`
  }
  const tableHeader = `| Metric | ${programs.map(p => p.name).join(' | ')} |\n| --- | ${programs.map(() => '---').join(' | ')} |`
  const body = diffRows
    .map(r => {
      const value = `| ${r.label} | ${programs.map(p => r.render(p)).join(' | ')} |`
      // Per-figure sourced flag where the row exposes a claim path.
      if (!r.figurePath) return value
      const has = programs.map(p => {
        const path = r.figurePath(p)
        if (!path) return '—'
        return p.claim_sources?.[path]?.url ? 'sourced' : 'estimate'
      })
      return `${value}\n| ${r.label} — has a source | ${has.join(' | ')} |`
    })
    .join('\n')
  return `${header}\n${disclaimer}\n${tableHeader}\n${body}\n`
}