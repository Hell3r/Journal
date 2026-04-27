import type { SessionState } from '../types/auth'

const sessionStorageKey = 'journal-session'

export function createSessionStorage(session: SessionState | null) {
  if (!session) {
    window.localStorage.removeItem(sessionStorageKey)
    return
  }

  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session))
}

export function readSessionStorage() {
  const raw = window.localStorage.getItem(sessionStorageKey)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SessionState
  } catch {
    window.localStorage.removeItem(sessionStorageKey)
    return null
  }
}
