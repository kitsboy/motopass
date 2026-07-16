export type MetricUnit = 'usd' | 'days' | 'count'

export interface DashboardMetric {
  id: string
  label: string
  traditional: number
  motopass: number
  unit: MetricUnit
  deltaLabel: string
}

export const DASHBOARD_METRICS: DashboardMetric[] = [
  {
    id: 'legal',
    label: 'Legal & advisory',
    traditional: 81_000,
    motopass: 3_900,
    unit: 'usd',
    deltaLabel: '−$77,100 modeled',
  },
  {
    id: 'time',
    label: 'Time to approval',
    traditional: 177,
    motopass: 135,
    unit: 'days',
    deltaLabel: '−42 days modeled',
  },
  {
    id: 'jurisdictions',
    label: 'Jurisdictions',
    traditional: 3,
    motopass: 50,
    unit: 'count',
    deltaLabel: '+47 jurisdictions modeled',
  },
]

export function formatMetricValue(value: number, unit: MetricUnit): string {
  if (unit === 'usd') return `$${value.toLocaleString()}`
  if (unit === 'days') return value.toLocaleString()
  return value.toLocaleString()
}

export function metricSuffix(unit: MetricUnit): string {
  if (unit === 'days') return 'days'
  if (unit === 'count') return ''
  return ''
}