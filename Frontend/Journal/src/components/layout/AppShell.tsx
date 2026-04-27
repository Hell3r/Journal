import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { checkDatabase, checkHealth } from '../../services/health'
import { logoutUser, disableTwoFactor, enableTwoFactor, verifyAndActivateTwoFactor } from '../../services/auth'
import { getUsers } from '../../services/users'
import { appRoutes, type AppRoute } from '../../navigation/routes'
import type { AuthStatusTone, SessionState, TwoFactorSetupState } from '../../types/auth'
import type { UserRecord } from '../../types/users'
import { ModulePlaceholder } from '../modules/ModulePlaceholder'
import { UsersRegistry } from '../modules/UsersRegistry'
import { Sidebar } from './Sidebar'
import { AccessWorkspace } from '../workspaces/AccessWorkspace'
import { OverviewWorkspace } from '../workspaces/OverviewWorkspace'

type AppShellProps = {
  activeRoute: AppRoute
  session: SessionState
  twoFactorSetup: TwoFactorSetupState | null
  users: UserRecord[]
  usersLoaded: boolean
  usersLoading: boolean
  statusMessage: string
  statusTone: AuthStatusTone
  lastResponse: string
  serviceState: {
    api: string
    database: string
  }
  onRouteChange: Dispatch<SetStateAction<AppRoute>>
  onSessionChange: (session: SessionState | null) => void
  onUsersChange: (users: UserRecord[]) => void
  onUsersLoadedChange: (value: boolean) => void
  onUsersLoadingChange: (value: boolean) => void
  onStatusMessageChange: (message: string) => void
  onStatusToneChange: (tone: AuthStatusTone) => void
  onLastResponseChange: (value: string) => void
  onTwoFactorSetupChange: (value: TwoFactorSetupState | null) => void
  onServiceStateChange: Dispatch<SetStateAction<{ api: string; database: string }>>
}

export function AppShell({
  activeRoute,
  session,
  twoFactorSetup,
  users,
  usersLoaded,
  usersLoading,
  statusMessage,
  statusTone,
  lastResponse,
  serviceState,
  onRouteChange,
  onSessionChange,
  onUsersChange,
  onUsersLoadedChange,
  onUsersLoadingChange,
  onStatusMessageChange,
  onStatusToneChange,
  onLastResponseChange,
  onTwoFactorSetupChange,
  onServiceStateChange,
}: AppShellProps) {
  const [enablePassword, setEnablePassword] = useState('')
  const [activationCode, setActivationCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [actionState, setActionState] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (activeRoute === 'users' && !usersLoaded && !usersLoading) {
      void loadUsers()
    }
  }, [activeRoute])

  const statusClassName =
    statusTone === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
      : statusTone === 'danger'
        ? 'border-red-500/30 bg-red-500/10 text-red-100'
        : 'border-white/10 bg-white/5 text-zinc-200'

  const setRoute = (route: AppRoute) => {
    window.location.hash = route
    onRouteChange(route)
  }

  const runAction = async (key: string, action: () => Promise<void>) => {
    setActionState((current) => ({ ...current, [key]: true }))

    try {
      await action()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить действие.'
      onStatusMessageChange(message)
      onStatusToneChange('danger')
      onLastResponseChange(message)
    } finally {
      setActionState((current) => ({ ...current, [key]: false }))
    }
  }

  const loadUsers = async () => {
    onUsersLoadingChange(true)

    try {
      const response = await getUsers(session.token)
      onUsersChange(response)
      onUsersLoadedChange(true)
      onStatusMessageChange('Реестр пользователей загружен из API.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить пользователей.'
      onStatusMessageChange(message)
      onStatusToneChange('danger')
      onLastResponseChange(message)
    } finally {
      onUsersLoadingChange(false)
    }
  }

  const handleHealthCheck = () =>
    runAction('health', async () => {
      const response = await checkHealth()
      onServiceStateChange((current) => ({ ...current, api: response.message ?? 'OK' }))
      onStatusMessageChange('API отвечает корректно.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })

  const handleDatabaseCheck = () =>
    runAction('database', async () => {
      const response = await checkDatabase()
      onServiceStateChange((current) => ({
        ...current,
        database: response.status === 'success' ? 'Подключение активно' : 'Ошибка подключения',
      }))
      onStatusMessageChange(response.message)
      onStatusToneChange(response.status === 'success' ? 'success' : 'danger')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })

  const handleLogout = () =>
    runAction('logout', async () => {
      const response = await logoutUser(session.token)
      onSessionChange(null)
      onStatusMessageChange('Сессия завершена.')
      onStatusToneChange('neutral')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })

  const handleEnableTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await runAction('enable2fa', async () => {
      const response = await enableTwoFactor(enablePassword, session.token)
      const nextSetup = {
        secret: response.secret,
        qrCode: response.qr_code,
        message: response.message,
      }
      onTwoFactorSetupChange(nextSetup)
      setBackupCodes([])
      onStatusMessageChange('Секрет 2FA создан. Отсканируйте QR-код и подтвердите кодом.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })
  }

  const handleActivateTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await runAction('activate2fa', async () => {
      const response = await verifyAndActivateTwoFactor(activationCode, session.token)
      setBackupCodes(response.backup_codes)
      onTwoFactorSetupChange(null)
      onSessionChange({
        ...session,
        twoFactorEnabled: true,
      })
      setActivationCode('')
      setEnablePassword('')
      onStatusMessageChange('Двухфакторная защита активирована.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })
  }

  const handleDisableTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await runAction('disable2fa', async () => {
      const response = await disableTwoFactor(disableCode, session.token)
      setDisableCode('')
      setBackupCodes([])
      onTwoFactorSetupChange(null)
      onSessionChange({
        ...session,
        twoFactorEnabled: false,
      })
      onStatusMessageChange('Двухфакторная защита отключена.')
      onStatusToneChange('neutral')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })
  }

  const quickActions = [
    {
      title: 'Реестр пользователей',
      text: 'Открыть рабочую таблицу и загрузить пользователей из API.',
      actionLabel: usersLoading ? 'Загрузка...' : 'Открыть реестр',
      onClick: async () => {
        setRoute('users')
      },
    },
    {
      title: 'Проверка API',
      text: 'Убедиться, что сервис приложения отвечает корректно.',
      actionLabel: actionState.health ? 'Проверка...' : 'Проверить API',
      onClick: handleHealthCheck,
    },
    {
      title: 'Проверка базы',
      text: 'Уточнить состояние подключения бэкенда к PostgreSQL.',
      actionLabel: actionState.database ? 'Проверка...' : 'Проверить БД',
      onClick: handleDatabaseCheck,
    },
    {
      title: 'Доступ и 2FA',
      text: 'Перейти к настройкам безопасности и резервным кодам.',
      actionLabel: 'Открыть раздел',
      onClick: () => setRoute('access'),
    },
  ]

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Sidebar
          actionLabel={actionState.logout ? 'Завершение...' : 'Выйти'}
          activeRoute={activeRoute}
          onLogout={handleLogout}
          onRouteChange={setRoute}
          session={session}
        />

        <main className="grid gap-4">
          <section className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Статус системы</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  {appRoutes.find((route) => route.key === activeRoute)?.label}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{statusMessage}</p>
              </div>
              <div className={`rounded-3xl border px-4 py-3 text-sm ${statusClassName}`}>{statusMessage}</div>
            </div>
          </section>

          {activeRoute === 'overview' && (
            <OverviewWorkspace
              quickActions={quickActions.map((action) => ({
                ...action,
                onClick: () => void action.onClick(),
              }))}
              serviceState={serviceState}
              twoFactorLabel={session.twoFactorEnabled ? 'Включена' : 'Выключена'}
              usersCountLabel={usersLoaded ? String(users.length) : 'Не загружено'}
            />
          )}

          {activeRoute === 'users' && (
            <UsersRegistry
              loading={usersLoading}
              onReload={() => void loadUsers()}
              users={users}
            />
          )}

          {activeRoute === 'maintenance' && (
            <ModulePlaceholder
              title="ТО"
              subtitle="Раздел для планирования, учёта и распределения технического обслуживания."
              items={[
                'Календарь ближайших выездов',
                'Сводка по подрядчикам',
                'Контроль сроков и статусов',
              ]}
            />
          )}

          {activeRoute === 'records' && (
            <ModulePlaceholder
              title="Учёты"
              subtitle="Здесь можно разместить оперативные журналы, ведомости и контрольные таблицы."
              items={[
                'Журнал действий персонала',
                'Ежедневные отметки по адресам',
                'История изменений по объектам',
              ]}
            />
          )}

          {activeRoute === 'supplies' && (
            <ModulePlaceholder
              title="Поставки"
              subtitle="Будущий модуль для контроля поставок, накладных и маршрутов снабжения."
              items={[
                'Ожидаемые поставки',
                'Складские остатки',
                'Проблемные поставщики',
              ]}
            />
          )}

          {activeRoute === 'certificates' && (
            <ModulePlaceholder
              title="Сертификаты"
              subtitle="Экран для сертификатов, сроков действия и верификации документов."
              items={[
                'Истекающие сертификаты',
                'Статусы проверки документов',
                'Закрепление сертификатов за пользователями',
              ]}
            />
          )}

          {activeRoute === 'access' && (
            <AccessWorkspace
              actionState={actionState}
              activationCode={activationCode}
              backupCodes={backupCodes}
              disableCode={disableCode}
              enablePassword={enablePassword}
              lastResponse={lastResponse}
              onActivateSubmit={handleActivateTwoFactor}
              onActivationCodeChange={setActivationCode}
              onDisableCodeChange={setDisableCode}
              onDisableSubmit={handleDisableTwoFactor}
              onEnablePasswordChange={setEnablePassword}
              onEnableSubmit={handleEnableTwoFactor}
              session={session}
              twoFactorSetup={twoFactorSetup}
            />
          )}
        </main>
      </div>
    </div>
  )
}
