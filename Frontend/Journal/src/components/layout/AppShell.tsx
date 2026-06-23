import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { Sidebar } from './Sidebar'
import { AccessWorkspace } from '../workspaces/AccessWorkspace'
import { OverviewWorkspace } from '../workspaces/OverviewWorkspace'
import { ProfileWorkspace } from '../workspaces/ProfileWorkspace'
import { UsersRegistry } from '../modules/UsersRegistry'
import { ModulePlaceholder } from '../modules/ModulePlaceholder'
import { CuratorRequestsWorkspace } from '../workspaces/CuratorRequestsWorkspace'
import { CustomersWorkspace } from '../workspaces/CustomersWorkspace'
import { AddressesWorkspace } from '../workspaces/AddressesWorkspace'
import { ContractorsWorkspace } from '../workspaces/ContractorsWorkspace'
import { checkDatabase, checkHealth } from '../../services/health'
import { disableTwoFactor, enableTwoFactor, logoutUser, verifyAndActivateTwoFactor } from '../../services/auth'
import { getUsers } from '../../services/users'
import { createAddress, getAddresses } from '../../services/addresses'
import { createContractor, getContractors } from '../../services/contractors'
import { createCuratorRequest, getCuratorRequests, activateCuratorRequest } from '../../services/curators'
import { createCustomer, getCustomers } from '../../services/customers'
import { getDefaultRouteForRole, getRoutesForRole, type AppRoute } from '../../navigation/routes'
import type { AuthStatusTone, SessionState, TwoFactorSetupState } from '../../types/auth'
import type { UserRecord } from '../../types/users'
import type { AddressRecord, ContractorRecord, CuratorRequestRecord, CustomerRecord } from '../../types/domain'

type AppShellProps = {
  activeRoute: AppRoute
  session: SessionState
  twoFactorSetup: TwoFactorSetupState | null
  statusMessage: string
  statusTone: AuthStatusTone
  lastResponse: string
  serviceState: {
    api: string
    database: string
  }
  onRouteChange: Dispatch<SetStateAction<AppRoute>>
  onSessionChange: (session: SessionState | null) => void
  onStatusMessageChange: (message: string) => void
  onStatusToneChange: (tone: AuthStatusTone) => void
  onLastResponseChange: (value: string) => void
  onTwoFactorSetupChange: (value: TwoFactorSetupState | null) => void
  onServiceStateChange: Dispatch<SetStateAction<{ api: string; database: string }>>
}

type LoadersState = Record<'users' | 'customers' | 'addresses' | 'contractors' | 'curators', boolean>

const roleMeta: Record<string, { title: string; description: string }> = {
  admin: {
    title: 'Администратор',
    description:
      'Администратор управляет пользователями, обрабатывает заявки кураторов, добавляет заказчиков, адреса и подрядные организации.',
  },
  curator: {
    title: 'Куратор',
    description:
      'Куратор ведёт свои организации и адреса, работает с подрядчиками и назначениями инженеров, а также контролирует журнал работ.',
  },
  engineer: {
    title: 'Инженер',
    description:
      'Инженер отвечает за закреплённую подрядную организацию, видит объекты, работы, техников и сопроводительную информацию по обслуживанию.',
  },
  technician: {
    title: 'Техник',
    description:
      'Техник работает с закреплёнными адресами и обслуживаемыми системами, просматривает последние работы и ведёт журнал обслуживания.',
  },
  user: {
    title: 'Пользователь',
    description:
      'Базовый кабинет позволяет пройти авторизацию, подать заявку на кураторство и включить двухфакторную защиту.',
  },
}

export function AppShell({
  activeRoute,
  session,
  twoFactorSetup,
  statusMessage,
  statusTone,
  lastResponse,
  serviceState,
  onRouteChange,
  onSessionChange,
  onStatusMessageChange,
  onStatusToneChange,
  onLastResponseChange,
  onTwoFactorSetupChange,
  onServiceStateChange,
}: AppShellProps) {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [addresses, setAddresses] = useState<AddressRecord[]>([])
  const [contractors, setContractors] = useState<ContractorRecord[]>([])
  const [curatorRequests, setCuratorRequests] = useState<CuratorRequestRecord[]>([])
  const [loaders, setLoaders] = useState<LoadersState>({
    users: false,
    customers: false,
    addresses: false,
    contractors: false,
    curators: false,
  })
  const [enablePassword, setEnablePassword] = useState('')
  const [activationCode, setActivationCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [actionState, setActionState] = useState<Record<string, boolean>>({})

  const routes = useMemo(() => getRoutesForRole(session.user.role), [session.user.role])
  const roleInfo = roleMeta[session.user.role] ?? roleMeta.user
  const engineers = useMemo(() => users.filter((user) => user.role === 'engineer'), [users])

  useEffect(() => {
    if (!routes.some((route) => route.key === activeRoute)) {
      const fallback = getDefaultRouteForRole(session.user.role)
      onRouteChange(fallback)
      window.location.hash = fallback
    }
  }, [routes, activeRoute, session.user.role])

  useEffect(() => {
    if (activeRoute === 'users' && session.user.role === 'admin' && users.length === 0) {
      void loadUsers()
    }
    if (activeRoute === 'customers' && customers.length === 0) {
      void loadCustomers()
    }
    if (activeRoute === 'curator-requests' && (session.user.role === 'user' || session.user.role === 'curator') && customers.length === 0) {
      void loadCustomers()
    }
    if (activeRoute === 'addresses' && addresses.length === 0) {
      void loadAddresses()
    }
    if (activeRoute === 'addresses' && customers.length === 0) {
      void loadCustomers()
    }
    if (activeRoute === 'contractors' && contractors.length === 0) {
      void loadContractors()
    }
    if (activeRoute === 'contractors' && users.length === 0 && (session.user.role === 'admin' || session.user.role === 'curator')) {
      void loadUsers()
    }
    if (activeRoute === 'curator-requests' && curatorRequests.length === 0) {
      void loadCuratorRequests()
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

  const withLoader = async (key: keyof LoadersState, action: () => Promise<void>) => {
    setLoaders((current) => ({ ...current, [key]: true }))
    try {
      await action()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить данные.'
      onStatusMessageChange(message)
      onStatusToneChange('danger')
      onLastResponseChange(message)
    } finally {
      setLoaders((current) => ({ ...current, [key]: false }))
    }
  }

  const loadUsers = async () =>
    withLoader('users', async () => {
      const response = await getUsers(session.token)
      setUsers(response)
      onStatusMessageChange('Реестр пользователей загружен из API.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })

  const loadCustomers = async () =>
    withLoader('customers', async () => {
      const response = await getCustomers(session.token)
      setCustomers(response)
      onStatusMessageChange('Список организаций загружен.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })

  const loadAddresses = async (customerId?: number) =>
    withLoader('addresses', async () => {
      const response = await getAddresses(session.token, customerId)
      setAddresses(response)
      onStatusMessageChange('Адреса и объекты загружены.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })

  const loadContractors = async () =>
    withLoader('contractors', async () => {
      const response = await getContractors(session.token)
      setContractors(response)
      onStatusMessageChange('Список подрядчиков загружен.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })

  const loadCuratorRequests = async () =>
    withLoader('curators', async () => {
      const response = await getCuratorRequests(session.token)
      setCuratorRequests(response)
      onStatusMessageChange(session.user.role === 'admin' ? 'Заявки кураторов загружены.' : 'Статус вашей заявки обновлён.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })

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
      onTwoFactorSetupChange({
        secret: response.secret,
        qrCode: response.qr_code,
        message: response.message,
      })
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

  const handleCreateCustomer = async (payload: { name_of_org: string; email: string }) =>
    runAction('createCustomer', async () => {
      await createCustomer(payload, session.token)
      await loadCustomers()
      onStatusMessageChange('Организация добавлена.')
      onStatusToneChange('success')
    })

  const handleCreateAddress = async (payload: { address_name: string; customer_id: number }) =>
    runAction('createAddress', async () => {
      await createAddress(payload, session.token)
      await loadAddresses()
      onStatusMessageChange('Адрес добавлен.')
      onStatusToneChange('success')
    })

  const handleCreateContractor = async (payload: { name_of_contractor: string; engineer_id?: number | null }) =>
    runAction('createContractor', async () => {
      await createContractor({ ...payload, is_active: true }, session.token)
      await loadContractors()
      onStatusMessageChange('Подрядная организация добавлена.')
      onStatusToneChange('success')
    })

  const handleCreateCuratorRequest = async (customerId: number) =>
    runAction('createCuratorRequest', async () => {
      await createCuratorRequest(customerId, session.token)
      await loadCuratorRequests()
      onStatusMessageChange('Заявка на кураторство отправлена на модерацию.')
      onStatusToneChange('success')
    })

  const handleActivateCuratorRequest = async (curatorId: number) =>
    runAction('activateCuratorRequest', async () => {
      await activateCuratorRequest(curatorId, session.token)
      await Promise.all([loadCuratorRequests(), loadUsers()])
      onStatusMessageChange('Заявка куратора одобрена.')
      onStatusToneChange('success')
    })

  const quickActions = useMemo(() => {
    const commonLast = {
      title: 'Проверка БД',
      text: 'Убедиться, что бэкенд видит подключение к PostgreSQL.',
      actionLabel: actionState.database ? 'Проверка...' : 'Проверить',
      onClick: handleDatabaseCheck,
    }

    if (session.user.role === 'admin') {
      return [
        {
          title: 'Реестр пользователей',
          text: 'Открыть список пользователей и проверить роли, статусы и 2FA.',
          actionLabel: loaders.users ? 'Загрузка...' : 'Открыть',
          onClick: async () => {
            setRoute('users')
            if (users.length === 0) {
              await loadUsers()
            }
          },
        },
        {
          title: 'Заявки кураторов',
          text: 'Просмотреть входящие заявки и одобрить новых кураторов.',
          actionLabel: loaders.curators ? 'Загрузка...' : 'Открыть',
          onClick: async () => {
            setRoute('curator-requests')
            if (curatorRequests.length === 0) {
              await loadCuratorRequests()
            }
          },
        },
        {
          title: 'Организации',
          text: 'Просмотр и добавление заказчиков, к которым будут привязаны объекты.',
          actionLabel: loaders.customers ? 'Загрузка...' : 'Открыть',
          onClick: async () => {
            setRoute('customers')
            if (customers.length === 0) {
              await loadCustomers()
            }
          },
        },
        commonLast,
      ]
    }

    if (session.user.role === 'curator') {
      return [
        {
          title: 'Организации',
          text: 'Просмотр организаций и базовых сведений по заказчикам.',
          actionLabel: loaders.customers ? 'Загрузка...' : 'Открыть',
          onClick: async () => {
            setRoute('customers')
            if (customers.length === 0) {
              await loadCustomers()
            }
          },
        },
        {
          title: 'Адреса и объекты',
          text: 'Создание адресов, карточек объектов и просмотр статистики.',
          actionLabel: loaders.addresses ? 'Загрузка...' : 'Открыть',
          onClick: async () => {
            setRoute('addresses')
            if (addresses.length === 0) {
              await loadAddresses()
            }
          },
        },
        {
          title: 'Подрядчики',
          text: 'Работа с подрядными организациями и назначением инженеров.',
          actionLabel: loaders.contractors ? 'Загрузка...' : 'Открыть',
          onClick: async () => {
            setRoute('contractors')
            if (contractors.length === 0) {
              await loadContractors()
            }
          },
        },
        commonLast,
      ]
    }

    if (session.user.role === 'engineer') {
      return [
        {
          title: 'Моя подрядная организация',
          text: 'Просмотреть закреплённую подрядную организацию и адреса.',
          actionLabel: loaders.contractors ? 'Загрузка...' : 'Открыть',
          onClick: async () => {
            setRoute('contractors')
            if (contractors.length === 0) {
              await loadContractors()
            }
          },
        },
        {
          title: 'Объекты и адреса',
          text: 'Открыть список объектов, связанных с обслуживанием.',
          actionLabel: loaders.addresses ? 'Загрузка...' : 'Открыть',
          onClick: async () => {
            setRoute('addresses')
            if (addresses.length === 0) {
              await loadAddresses()
            }
          },
        },
        {
          title: 'Техники',
          text: 'Проверить техников и ожидаемые назначения в роли инженера.',
          actionLabel: 'Открыть',
          onClick: async () => {
            setRoute('technicians')
          },
        },
        commonLast,
      ]
    }

    if (session.user.role === 'technician') {
      return [
        {
          title: 'Мой адрес',
          text: 'Просмотреть закреплённый объект и краткую статистику по работам.',
          actionLabel: loaders.addresses ? 'Загрузка...' : 'Открыть',
          onClick: async () => {
            setRoute('addresses')
            if (addresses.length === 0) {
              await loadAddresses()
            }
          },
        },
        {
          title: 'Журнал обслуживания',
          text: 'Открыть раздел работ и будущий журнал по обслуживаемым системам.',
          actionLabel: 'Открыть',
          onClick: async () => {
            setRoute('works')
          },
        },
        {
          title: 'Личный кабинет',
          text: 'Проверить свой профиль, роль и состояние доступа.',
          actionLabel: 'Открыть',
          onClick: async () => {
            setRoute('profile')
          },
        },
        commonLast,
      ]
    }

    return [
      {
        title: 'Заявка на кураторство',
        text: 'Выберите организацию и отправьте заявку на модерацию администратору.',
        actionLabel: loaders.curators ? 'Загрузка...' : 'Открыть',
        onClick: async () => {
          setRoute('curator-requests')
          if (customers.length === 0) {
            await loadCustomers()
          }
          if (curatorRequests.length === 0) {
            await loadCuratorRequests()
          }
        },
      },
      {
        title: 'Личный кабинет',
        text: 'Проверить текущую роль, статус аккаунта и параметры безопасности.',
        actionLabel: 'Открыть',
        onClick: async () => {
          setRoute('profile')
        },
      },
      {
        title: '2FA и доступ',
        text: 'Включить двухфакторную защиту и управлять кодами.',
        actionLabel: 'Открыть',
        onClick: async () => {
          setRoute('access')
        },
      },
      commonLast,
    ]
  }, [session.user.role, users.length, customers.length, addresses.length, contractors.length, curatorRequests.length, loaders, actionState.database])

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Sidebar
          actionLabel={actionState.logout ? 'Завершение...' : 'Выйти'}
          activeRoute={activeRoute}
          onLogout={handleLogout}
          onRouteChange={setRoute}
          routes={routes}
          session={session}
        />

        <main className="grid auto-rows-max content-start gap-4">
          <section className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Статус системы</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  {routes.find((route) => route.key === activeRoute)?.label}
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
              usersCountLabel={session.user.role === 'admin' ? String(users.length || 0) : roleInfo.title}
            />
          )}

          {activeRoute === 'profile' && (
            <ProfileWorkspace
              roleDescription={roleInfo.description}
              roleTitle={roleInfo.title}
              session={session}
            />
          )}

          {activeRoute === 'users' &&
            (session.user.role === 'admin' ? (
              <UsersRegistry loading={loaders.users} onReload={() => void loadUsers()} users={users} />
            ) : (
              <ModulePlaceholder
                title="Реестр пользователей"
                subtitle="Этот раздел доступен только администратору для полной работы с ролями и заявками пользователей."
                items={['Просмотр ролей', 'Статусы активации', 'Контроль включённой 2FA']}
              />
            ))}

          {activeRoute === 'curator-requests' && (
            <CuratorRequestsWorkspace
              canActivate={session.user.role === 'admin'}
              canCreate={session.user.role === 'user' || session.user.role === 'curator'}
              customers={customers}
              loading={loaders.curators}
              onActivate={handleActivateCuratorRequest}
              onCreate={handleCreateCuratorRequest}
              onReload={() => void loadCuratorRequests()}
              requests={session.user.role === 'admin' ? curatorRequests : curatorRequests.filter((item) => item.user_id === session.user.user_id)}
            />
          )}

          {activeRoute === 'customers' && (
            <CustomersWorkspace
              canCreate={session.user.role === 'admin'}
              customers={customers}
              loading={loaders.customers}
              onCreate={handleCreateCustomer}
              onReload={() => void loadCustomers()}
            />
          )}

          {activeRoute === 'addresses' && (
            <AddressesWorkspace
              addresses={addresses}
              canCreate={session.user.role === 'admin' || session.user.role === 'curator'}
              customers={customers}
              loading={loaders.addresses}
              onCreate={handleCreateAddress}
              onReload={(customerId?: number) => void loadAddresses(customerId)}
            />
          )}

          {activeRoute === 'contractors' && (
            <ContractorsWorkspace
              canCreate={session.user.role === 'admin' || session.user.role === 'curator'}
              contractors={session.user.role === 'engineer' ? contractors.filter((item) => item.engineer_id === session.user.user_id) : contractors}
              engineers={engineers}
              loading={loaders.contractors}
              onCreate={handleCreateContractor}
              onReload={() => void loadContractors()}
            />
          )}

          {activeRoute === 'works' && (
            <ModulePlaceholder
              title="Работы и журнал обслуживания"
              subtitle="Зона под журнал эксплуатации, последние работы, акты ТО и замечания по системам. Для этой части в текущем API ещё не хватает отдельных рабочих endpoint’ов."
              items={[
                'Последние работы по объектам',
                'Журнал обслуживания по системам',
                'Замечания и неисправности',
              ]}
            />
          )}

          {activeRoute === 'technicians' && (
            <ModulePlaceholder
              title="Техники"
              subtitle="Инженерский раздел для просмотра и назначения техников. На модели связи уже есть база, но отдельный API для управления техниками пока не открыт."
              items={[
                'Просмотр назначенных техников',
                'Привязка техника к подрядчику',
                'Привязка техника к объекту и системе',
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

          {!routes.some((route) => route.key === activeRoute) && (
            <ModulePlaceholder
              title="Раздел недоступен"
              subtitle="Для текущей роли этот раздел не открыт. После смены роли или появления новых endpoint’ов он сможет стать рабочим."
              items={['Проверьте навигацию', 'Смените роль', 'Вернитесь в обзор']}
            />
          )}
        </main>
      </div>
    </div>
  )
}
