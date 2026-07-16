export const PAIGE_ENFORCEMENT_DISMISS_KEY = 'motopass-paige-enforcement-dismissed'

export function isPaigeEnforcementDismissed(): boolean {
  try {
    return localStorage.getItem(PAIGE_ENFORCEMENT_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissPaigeEnforcement(): void {
  localStorage.setItem(PAIGE_ENFORCEMENT_DISMISS_KEY, '1')
}

export function resetPaigeEnforcementDismiss(): void {
  localStorage.removeItem(PAIGE_ENFORCEMENT_DISMISS_KEY)
}