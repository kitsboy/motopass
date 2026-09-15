/**
 * Compliance-clock rules, kept out of the component file.
 *
 * `ComplianceClock.tsx` renders a component; a module that exports a component
 * AND a plain function cannot be hot-replaced (`react-refresh/only-export-components`),
 * so the shared rule lives here.
 */

export type ComplianceSeverity = 'critical' | 'warning' | 'healthy'

/**
 * Renewal window -> severity. Thresholds are the product's promise, not a
 * rendering detail: <=30 days left is critical, <=90 is a warning, else healthy.
 */
export function complianceSeverity(daysToRenewal: number): ComplianceSeverity {
  if (daysToRenewal <= 30) return 'critical'
  if (daysToRenewal <= 90) return 'warning'
  return 'healthy'
}
