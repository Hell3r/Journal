import { useEffect, useState } from 'react'
import { AuthScreen } from './components/auth/AuthScreen'
import { AppShell } from './components/layout/AppShell'
import { appRoutes, type AppRoute } from './navigation/routes'
import { createSessionStorage, readSessionStorage } from './services/sessionStorage'
import type { AuthStatusTone, PendingTwoFactorState, SessionState, TwoFactorSetupState } from './types/auth'
import type { UserRecord } from './types/users'

const defaultStatusMessage = 'Войдите в систему, чтобы открыть рабочее пространство журнала.'

function App() {
  const [session, setSession] = useState<SessionState | null>(() => readSessionStorage())
  const [pendingTwoFactor, setPendingTwoFactor] = useState<PendingTwoFactorState | null>(null)
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupState | null>(null)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState(defaultStatusMessage)
  const [statusTone, setStatusTone] = useState<AuthStatusTone>('neutral')
  const [lastResponse, setLastResponse] = useState('Ожидается первое действие.')
  const [serviceState, setServiceState] = useState({
    api: 'Не проверено',
    database: 'Не проверено',
  })
  const [activeRoute, setActiveRoute] = useState<AppRoute>(() => {
    const hash = window.location.hash.replace('#', '')
    return appRoutes.some((route) => route.key === hash) ? (hash as AppRoute) : 'overview'
  })

  useEffect(() => {
    const syncRoute = () => {
      const hash = window.location.hash.replace('#', '')
      if (appRoutes.some((route) => route.key === hash)) {
        setActiveRoute(hash as AppRoute)
      }
    }

    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = activeRoute
    }
  }, [activeRoute])

  useEffect(() => {
    if (session) {
      createSessionStorage(session)
      return
    }

    createSessionStorage(null)
    setUsers([])
    setUsersLoaded(false)
    setUsersLoading(false)
    setPendingTwoFactor(null)
    setTwoFactorSetup(null)
    setServiceState({
      api: 'Не проверено',
      database: 'Не проверено',
    })
    setActiveRoute('overview')
    window.location.hash = 'overview'
  }, [session])

  return session ? (
    <AppShell
      activeRoute={activeRoute}
      lastResponse={lastResponse}
      onRouteChange={setActiveRoute}
      onSessionChange={setSession}
      onStatusMessageChange={setStatusMessage}
      onStatusToneChange={setStatusTone}
      onTwoFactorSetupChange={setTwoFactorSetup}
      onUsersChange={setUsers}
      onUsersLoadedChange={setUsersLoaded}
      onUsersLoadingChange={setUsersLoading}
      onLastResponseChange={setLastResponse}
      onServiceStateChange={setServiceState}
      serviceState={serviceState}
      session={session}
      statusMessage={statusMessage}
      statusTone={statusTone}
      twoFactorSetup={twoFactorSetup}
      users={users}
      usersLoaded={usersLoaded}
      usersLoading={usersLoading}
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
