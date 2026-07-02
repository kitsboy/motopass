import type { UserProfile } from '../types/user'

const PROFILE_KEY = 'motopass-user-profile'

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY)
}

export function updateProfile(patch: Partial<UserProfile>): UserProfile | null {
  const current = loadProfile()
  if (!current) return null
  const next = { ...current, ...patch }
  saveProfile(next)
  return next
}