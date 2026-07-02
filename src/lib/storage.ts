import type { PassportApplication } from '../types/program'

const APPS_KEY = 'motopass-applications'

export function loadApplications(): PassportApplication[] {
  try {
    const raw = localStorage.getItem(APPS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveApplications(apps: PassportApplication[]) {
  localStorage.setItem(APPS_KEY, JSON.stringify(apps))
}

export function addApplication(app: PassportApplication) {
  const apps = loadApplications()
  apps.unshift(app)
  saveApplications(apps)
  return apps
}