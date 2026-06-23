import { useEffect, useState } from 'react'
import { AuthScreen } from './components/auth/AuthScreen'
import { AppShell } from './components/layout/AppShell'
import { getDefaultRouteForRole, getRoutesForRole, type AppRoute } from './navigation/routes'
import { createSessionStorage, readSessionStorage } from './services/sessionStorage'
import type { AuthStatusTone, PendingTwoFactorState, SessionState, TwoFactorSetupState } from './types/auth'

const defaultStatusMessage = 'Войдите в систему, чтобы открыть рабочее пространство журнала.'

function App() {
  const [session, setSession] = useState<SessionState | null>(() => readSessionStorage())
  const [pendingTwoFactor, setPendingTwoFactor] = useState<PendingTwoFactorState | null>(null)
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupState | null>(null)
  const [statusMessage, setStatusMessage] = useState(defaultStatusMessage)
  const [statusTone, setStatusTone] = useState<AuthStatusTone>('neutral')
  const [lastResponse, setLastResponse] = useState('Ожидается первое действие.')
  const [activeRoute, setActiveRoute] = useState<AppRoute>(() => {
    const storedSession = readSessionStorage()
    const fallback = getDefaultRouteForRole(storedSession?.user.role ?? 'user')
    const hash = window.location.hash.replace('#', '')
    return hash || fallback
  })

  useEffect(() => {
    const syncRoute = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setActiveRoute(hash)
      }
    }

    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    if (session) {
      createSessionStorage(session)
      if (!getRoutesForRole(session.user.role).some((route) => route.key === activeRoute)) {
        const fallback = getDefaultRouteForRole(session.user.role)
        setActiveRoute(fallback)
        window.location.hash = fallback
      }
      return
    }

    createSessionStorage(null)
    setPendingTwoFactor(null)
    setTwoFactorSetup(null)
    const fallback = getDefaultRouteForRole('user')
    setActiveRoute(fallback)
    window.location.hash = fallback
  }, [session, activeRoute])

  return session ? (
    <AppShell
      activeRoute={activeRoute}
      lastResponse={lastResponse}
      onLastResponseChange={setLastResponse}
      onRouteChange={setActiveRoute}
      onSessionChange={setSession}
      onStatusMessageChange={setStatusMessage}
      onStatusToneChange={setStatusTone}
      onTwoFactorSetupChange={setTwoFactorSetup}
      session={session}
      statusMessage={statusMessage}
      statusTone={statusTone}
      twoFactorSetup={twoFactorSetup}
    />
  ) : (
    <AuthScreen
      lastResponse={lastResponse}
      onLastResponseChange={setLastResponse}
      onPendingTwoFactorChange={setPendingTwoFactor}
      onSessionChange={setSession}
      onStatusMessageChange={setStatusMessage}
      onStatusToneChange={setStatusTone}
      pendingTwoFactor={pendingTwoFactor}
      statusMessage={statusMessage}
      statusTone={statusTone}
    />
  )
}

export default App
