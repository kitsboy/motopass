import type { Program } from '../types/program'

type DiffRow = {
  label: string
  valueKey: (p: Program) => string
  render: (p: Program) => string
}

export function compareDiffMarkdown(
  programs: Program[],
  rows: DiffRow[],
  rowValuesDiffer: (row: DiffRow, programs: Program[]) => boolean,
): string {
  if (programs.length < 2) return ''
  const diffRows = rows.filter(r => rowValuesDiffer(r, programs))
  const header = `## Program compare — ${programs.map(p => p.name).join(' vs ')}\n`
  if (!diffRows.length) {
    return `${header}\n_No differing metrics._\n`
  }
  const tableHeader = `| Metric | ${programs.map(p => p.name).join(' | ')} |\n| --- | ${programs.map(() => '---').join(' | ')} |`
  const body = diffRows
    .map(r => `| ${r.label} | ${programs.map(p => r.render(p)).join(' | ')} |`)
    .join('\n')
  return `${header}\n${tableHeader}\n${body}\n`
}