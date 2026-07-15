export type CompareDiffKind = 'added' | 'removed' | 'changed' | 'same'

export function compareDiffKind(
  valueKey: string,
  baselineKey: string,
  isBest: boolean,
  differs: boolean,
): CompareDiffKind {
  if (!differs) return 'same'
  if (isBest) return 'added'
  if (valueKey === '' || valueKey === '—') return 'removed'
  if (baselineKey === '' || baselineKey === '—') return 'added'
  return 'changed'
}

export function compareDiffClass(kind: CompareDiffKind): string {
  switch (kind) {
    case 'added':
      return 'compare-diff-added'
    case 'removed':
      return 'compare-diff-removed'
    case 'changed':
      return 'compare-diff-changed'
    default:
      return ''
  }
}