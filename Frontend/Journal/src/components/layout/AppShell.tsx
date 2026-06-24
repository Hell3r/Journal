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
import { SystemsWorkspace } from '../workspaces/SystemsWorkspace'
import { WorksWorkspace } from '../workspaces/WorksWorkspace'
import { TechniciansWorkspace } from '../workspaces/TechniciansWorkspace'
import { disableTwoFactor, enableTwoFactor, logoutUser, verifyAndActivateTwoFactor } from '../../services/auth'
import { deleteUser, getUsers, activateUser, updateUser, getAssignableUsers } from '../../services/users'
import { createAddress, deleteAddress, getAddresses, updateAddress } from '../../services/addresses'
import {
  addAddressToContractor,
  createContractor,
  deleteContractor,
  getContractors,
  removeAddressFromContractor,
  updateContractor,
} from '../../services/contractors'
import { createCuratorRequest, getCuratorRequests, activateCuratorRequest } from '../../services/curators'
import { activateCustomer, createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../../services/customers'
import { getDefaultRouteForRole, getRoutesForRole, type AppRoute } from '../../navigation/routes'
import {
  addSystemToAddress,
  createSystem,
  createTypeOfWork,
  deleteSystem,
  deleteTypeOfWork,
  getSystems,
  getTypesOfWorks,
  removeSystemFromAddress,
  updateSystem,
  updateTypeOfWork,
} from '../../services/systems'
import { createWork, deleteWork, getWorks } from '../../services/works'
import { createTechnicianAssignment, deleteTechnicianAssignment, getTechnicianAssignments } from '../../services/technicianContractors'
import type { AuthStatusTone, SessionState, TwoFactorSetupState } from '../../types/auth'
import type { UserRecord } from '../../types/users'
import type {
  AddressRecord,
  ContractorRecord,
  CuratorRequestRecord,
  CustomerRecord,
  SystemRecord,
  TypeOfWorkRecord,
  WorkRecord,
  TechnicianAssignmentRecord,
} from '../../types/domain'

type AppShellProps = {
  activeRoute: AppRoute
  session: SessionState
  twoFactorSetup: TwoFactorSetupState | null
  statusMessage: string
  statusTone: AuthStatusTone
  lastResponse: string
  onRouteChange: Dispatch<SetStateAction<AppRoute>>
  onSessionChange: (session: SessionState | null) => void
  onStatusMessageChange: (message: string) => void
  onStatusToneChange: (tone: AuthStatusTone) => void
  onLastResponseChange: (value: string) => void
  onTwoFactorSetupChange: (value: TwoFactorSetupState | null) => void
}

type LoadersState = Record<'users' | 'staff' | 'customers' | 'addresses' | 'contractors' | 'curators' | 'systems' | 'works' | 'technicians', boolean>

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
  onRouteChange,
  onSessionChange,
  onStatusMessageChange,
  onStatusToneChange,
  onLastResponseChange,
  onTwoFactorSetupChange,
}: AppShellProps) {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [staffUsers, setStaffUsers] = useState<UserRecord[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [addresses, setAddresses] = useState<AddressRecord[]>([])
  const [contractors, setContractors] = useState<ContractorRecord[]>([])
  const [curatorRequests, setCuratorRequests] = useState<CuratorRequestRecord[]>([])
  const [systems, setSystems] = useState<SystemRecord[]>([])
  const [typesOfWorks, setTypesOfWorks] = useState<TypeOfWorkRecord[]>([])
  const [works, setWorks] = useState<WorkRecord[]>([])
  const [technicianAssignments, setTechnicianAssignments] = useState<TechnicianAssignmentRecord[]>([])
  const [loaders, setLoaders] = useState<LoadersState>({
    users: false,
    staff: false,
    customers: false,
    addresses: false,
    contractors: false,
    curators: false,
    systems: false,
    works: false,
    technicians: false,
  })
  const [enablePassword, setEnablePassword] = useState('')
  const [activationCode, setActivationCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [actionState, setActionState] = useState<Record<string, boolean>>({})

  const routes = useMemo(() => getRoutesForRole(session.user.role), [session.user.role])
  const roleInfo = roleMeta[session.user.role] ?? roleMeta.user
  const visibleCustomerIds = useMemo(() => {
    if (session.user.role === 'admin') {
      return null
    }

    if (session.user.role === 'curator') {
      return new Set(
        customers
          .filter((customer) => customer.curators.some((curator) => curator.user_id === session.user.user_id))
          .map((customer) => customer.id)
      )
    }

    return null
  }, [customers, session.user.role, session.user.user_id])
  const visibleCustomers = useMemo(() => {
    if (session.user.role === 'admin') {
      return customers
    }

    if (visibleCustomerIds) {
      return customers.filter((customer) => visibleCustomerIds.has(customer.id))
    }

    return customers
  }, [customers, session.user.role, visibleCustomerIds])
  const visibleAddresses = useMemo(() => {
    if (session.user.role === 'technician') {
      const addressIds = new Set(
        technicianAssignments
          .filter((assignment) => assignment.user.id === session.user.user_id)
          .map((assignment) => assignment.address_id)
      )
      return addresses.filter((address) => addressIds.has(address.id))
    }

    if (session.user.role === 'engineer') {
      const addressIds = new Set(
        contractors
          .filter((contractor) => contractor.engineer_id === session.user.user_id)
          .flatMap((contractor) => contractor.addresses.map((address) => address.id))
      )
      return addresses.filter((address) => addressIds.has(address.id))
    }

    if (visibleCustomerIds) {
      return addresses.filter((address) => visibleCustomerIds.has(address.customer_id))
    }

    return addresses
  }, [addresses, contractors, session.user.role, session.user.user_id, technicianAssignments, visibleCustomerIds])
  const visibleContractors = useMemo(() => {
    if (session.user.role === 'engineer') {
      return contractors.filter((item) => item.engineer_id === session.user.user_id)
    }
    if (session.user.role === 'curator') {
      const allowedAddressIds = new Set(visibleAddresses.map((address) => address.id))
      return contractors.filter((contractor) =>
        contractor.addresses.some((address) => allowedAddressIds.has(address.id))
      )
    }
    return contractors
  }, [contractors, session.user.role, session.user.user_id, visibleAddresses])
  const visibleAddressIds = useMemo(() => {
    if (session.user.role === 'technician') {
      return new Set(
        technicianAssignments
          .filter((assignment) => assignment.user.id === session.user.user_id)
          .map((assignment) => assignment.address_id)
      )
    }

    if (session.user.role === 'engineer') {
      return new Set(
        visibleContractors.flatMap((contractor) => contractor.addresses.map((address) => address.id))
      )
    }

    return null
  }, [session.user.role, session.user.user_id, technicianAssignments, visibleContractors])
  const visibleSystems = useMemo(() => {
    if (!visibleAddressIds) {
      return systems
    }

    return systems.filter((system) =>
      system.addresses.some((relation) => visibleAddressIds.has(relation.address_id))
    )
  }, [systems, visibleAddressIds])
  const visibleWorks = useMemo(() => {
    if (!visibleAddressIds) {
      return works
    }

    return works.filter((work) => visibleAddressIds.has(work.address_id))
  }, [works, visibleAddressIds])
  const visibleAssignableUsers = useMemo(
    () => staffUsers.filter((user) => user.role === 'user'),
    [staffUsers]
  )
  const visibleTechnicians = useMemo(
    () => staffUsers.filter((user) => user.role === 'technician'),
    [staffUsers]
  )

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
    if (activeRoute === 'addresses' && systems.length === 0) {
      void loadSystems()
    }
    if (activeRoute === 'addresses' && staffUsers.length === 0) {
      void loadStaffUsers()
    }
    if (activeRoute === 'works' && addresses.length === 0) {
      void loadAddresses()
    }
    if (activeRoute === 'works' && customers.length === 0) {
      void loadCustomers()
    }
    if (activeRoute === 'works' && systems.length === 0) {
      void loadSystems()
    }
    if (activeRoute === 'technicians' && contractors.length === 0) {
      void loadContractors()
    }
    if (activeRoute === 'technicians' && customers.length === 0) {
      void loadCustomers()
    }
    if (activeRoute === 'technicians' && addresses.length === 0) {
      void loadAddresses()
    }
    if (activeRoute === 'contractors' && contractors.length === 0) {
      void loadContractors()
    }
    if ((activeRoute === 'contractors' || activeRoute === 'works' || activeRoute === 'technicians') && staffUsers.length === 0) {
      void loadStaffUsers()
    }
    if (activeRoute === 'systems' && systems.length === 0) {
      void loadSystems()
    }
    if (activeRoute === 'works' && works.length === 0) {
      void loadWorks()
    }
    if (activeRoute === 'technicians' && technicianAssignments.length === 0) {
      void loadTechnicians()
    }
    if (activeRoute === 'curator-requests' && curatorRequests.length === 0) {
      void loadCuratorRequests()
    }
  }, [activeRoute, users.length, staffUsers.length, customers.length, addresses.length, contractors.length, systems.length, works.length, technicianAssignments.length, curatorRequests.length, session.user.role])

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

  const loadStaffUsers = async () =>
    withLoader('staff', async () => {
      const response = await getAssignableUsers(session.token)
      setStaffUsers(response)
      onStatusMessageChange('Список пользователей для назначений загружен.')
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

  const loadSystems = async () =>
    withLoader('systems', async () => {
      const [systemsResponse, typesResponse] = await Promise.all([
        getSystems(session.token),
        getTypesOfWorks(session.token),
      ])
      setSystems(systemsResponse)
      setTypesOfWorks(typesResponse)
      onStatusMessageChange('Справочники ППЗ и типов работ загружены.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify({ systems: systemsResponse, types: typesResponse }, null, 2))
    })

  const loadWorks = async (addressId?: number) =>
    withLoader('works', async () => {
      const response = await getWorks(session.token, addressId)
      setWorks(response)
      onStatusMessageChange('Журнал работ загружен.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    })

  const loadTechnicians = async () =>
    withLoader('technicians', async () => {
      const response = await getTechnicianAssignments(session.token)
      setTechnicianAssignments(response)
      onStatusMessageChange('Назначения техников загружены.')
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

  const handleUpdateAddress = async (addressId: number, payload: Parameters<typeof updateAddress>[1]) =>
    runAction('updateAddress', async () => {
      await updateAddress(addressId, payload, session.token)
      await loadAddresses()
      onStatusMessageChange('Адрес обновлён.')
      onStatusToneChange('success')
    })

  const handleDeleteAddress = async (addressId: number) =>
    runAction('deleteAddress', async () => {
      await deleteAddress(addressId, session.token)
      await loadAddresses()
      onStatusMessageChange('Адрес удалён.')
      onStatusToneChange('success')
    })

  const handleCreateContractor = async (payload: { name_of_contractor: string; engineer_id?: number | null }) =>
    runAction('createContractor', async () => {
      await createContractor({ ...payload, is_active: true }, session.token)
      await Promise.all([
        loadContractors(),
        loadStaffUsers(),
        session.user.role === 'admin' ? loadUsers() : Promise.resolve(),
      ])
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

  const handleUpdateUser = async (userId: number, payload: Parameters<typeof updateUser>[1]) =>
    runAction('updateUser', async () => {
      await updateUser(userId, payload, session.token)
      await loadUsers()
      onStatusMessageChange('Пользователь обновлён.')
      onStatusToneChange('success')
    })

  const handleActivateUser = async (userId: number) =>
    runAction('activateUser', async () => {
      await activateUser(userId, session.token)
      await loadUsers()
      onStatusMessageChange('Пользователь активирован.')
      onStatusToneChange('success')
    })

  const handleDeleteUser = async (userId: number) =>
    runAction('deleteUser', async () => {
      await deleteUser(userId, session.token)
      await loadUsers()
      onStatusMessageChange('Пользователь удалён.')
      onStatusToneChange('success')
    })

  const handleUpdateCustomer = async (customerId: number, payload: Parameters<typeof updateCustomer>[1]) =>
    runAction('updateCustomer', async () => {
      await updateCustomer(customerId, payload, session.token)
      await loadCustomers()
      onStatusMessageChange('Заказчик обновлён.')
      onStatusToneChange('success')
    })

  const handleDeleteCustomer = async (customerId: number) =>
    runAction('deleteCustomer', async () => {
      await deleteCustomer(customerId, session.token)
      await loadCustomers()
      onStatusMessageChange('Заказчик удалён.')
      onStatusToneChange('success')
    })

  const handleActivateCustomer = async (customerId: number) =>
    runAction('activateCustomer', async () => {
      await activateCustomer(customerId, session.token)
      await loadCustomers()
      onStatusMessageChange('Заказчик активирован.')
      onStatusToneChange('success')
    })

  const handleUpdateContractor = async (contractorId: number, payload: Parameters<typeof updateContractor>[1]) =>
    runAction('updateContractor', async () => {
      await updateContractor(contractorId, payload, session.token)
      await Promise.all([
        loadContractors(),
        loadStaffUsers(),
        session.user.role === 'admin' ? loadUsers() : Promise.resolve(),
      ])
      onStatusMessageChange('Подрядчик обновлён.')
      onStatusToneChange('success')
    })

  const handleDeleteContractor = async (contractorId: number) =>
    runAction('deleteContractor', async () => {
      await deleteContractor(contractorId, session.token)
      await loadContractors()
      onStatusMessageChange('Подрядчик удалён.')
      onStatusToneChange('success')
    })

  const handleAddAddressToContractor = async (contractorId: number, addressId: number) =>
    runAction('addAddressToContractor', async () => {
      await addAddressToContractor(contractorId, addressId, session.token)
      await Promise.all([loadContractors(), loadAddresses()])
      onStatusMessageChange('Адрес привязан к подрядчику.')
      onStatusToneChange('success')
    })

  const handleRemoveAddressFromContractor = async (contractorId: number, addressId: number) =>
    runAction('removeAddressFromContractor', async () => {
      await removeAddressFromContractor(contractorId, addressId, session.token)
      await Promise.all([loadContractors(), loadAddresses()])
      onStatusMessageChange('Связь адреса и подрядчика удалена.')
      onStatusToneChange('success')
    })

  const handleUpdateSystem = async (systemId: number, payload: { name?: string }) =>
    runAction('updateSystem', async () => {
      await updateSystem(systemId, payload, session.token)
      await loadSystems()
      onStatusMessageChange('Система обновлена.')
      onStatusToneChange('success')
    })

  const handleDeleteSystem = async (systemId: number) =>
    runAction('deleteSystem', async () => {
      await deleteSystem(systemId, session.token)
      await loadSystems()
      onStatusMessageChange('Система удалена.')
      onStatusToneChange('success')
    })

  const handleUpdateTypeOfWork = async (typeId: number, payload: { name?: string }) =>
    runAction('updateTypeOfWork', async () => {
      await updateTypeOfWork(typeId, payload, session.token)
      await loadSystems()
      onStatusMessageChange('Тип работы обновлён.')
      onStatusToneChange('success')
    })

  const handleDeleteTypeOfWork = async (typeId: number) =>
    runAction('deleteTypeOfWork', async () => {
      await deleteTypeOfWork(typeId, session.token)
      await loadSystems()
      onStatusMessageChange('Тип работы удалён.')
      onStatusToneChange('success')
    })

  const handleCreateWork = async (payload: { address_id: number; system_id: number; type_of_work_id: number; technician_id: number; description?: string | null }) =>
    runAction('createWork', async () => {
      await createWork(payload, session.token)
      await Promise.all([loadWorks(), loadAddresses()])
      onStatusMessageChange('Запись журнала добавлена.')
      onStatusToneChange('success')
    })

  const handleDeleteWork = async (workId: number) =>
    runAction('deleteWork', async () => {
      await deleteWork(workId, session.token)
      await Promise.all([loadWorks(), loadAddresses()])
      onStatusMessageChange('Запись журнала удалена.')
      onStatusToneChange('success')
    })

  const handleCreateTechnicianAssignment = async (payload: { contractor_id: number; address_id?: number | null; technician_id: number }) =>
    runAction('createTechnicianAssignment', async () => {
      await createTechnicianAssignment(payload, session.token)
      await loadTechnicians()
      onStatusMessageChange('Назначение техника создано.')
      onStatusToneChange('success')
    })

  const handleDeleteTechnicianAssignment = async (assignmentId: number) =>
    runAction('deleteTechnicianAssignment', async () => {
      await deleteTechnicianAssignment(assignmentId, session.token)
      await loadTechnicians()
      onStatusMessageChange('Назначение техника удалено.')
      onStatusToneChange('success')
    })

  const quickActions = useMemo(() => {


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

    ]
  }, [session.user.role, users.length, customers.length, addresses.length, contractors.length, curatorRequests.length, loaders, actionState.database, actionState.health])

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
              <UsersRegistry
                canManage
                loading={loaders.users}
                onActivate={handleActivateUser}
                onDelete={handleDeleteUser}
                onReload={() => void loadUsers()}
                onUpdate={handleUpdateUser}
                users={users}
              />
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
              canManage={session.user.role === 'admin' || session.user.role === 'curator'}
              customers={customers}
              loading={loaders.customers}
              onCreate={handleCreateCustomer}
              onActivate={handleActivateCustomer}
              onDelete={handleDeleteCustomer}
              onUpdate={handleUpdateCustomer}
              onReload={() => void loadCustomers()}
            />
          )}

          {activeRoute === 'addresses' && (
            <AddressesWorkspace
              addresses={visibleAddresses}
              canManage={session.user.role === 'admin' || session.user.role === 'curator'}
              customers={visibleCustomers}
              systems={visibleSystems}
              typesOfWorks={typesOfWorks}
              technicians={visibleTechnicians}
              loading={loaders.addresses}
              onCreate={handleCreateAddress}
              onDelete={handleDeleteAddress}
              onUpdate={handleUpdateAddress}
              onAddSystemToAddress={async (addressId, systemId) => {
                await addSystemToAddress(systemId, addressId, session.token)
                await loadSystems()
                await loadAddresses()
              }}
              onRemoveSystemFromAddress={async (addressId, systemId) => {
                await removeSystemFromAddress(systemId, addressId, session.token)
                await loadSystems()
                await loadAddresses()
              }}
              onCreateWork={handleCreateWork}
              onDeleteWork={handleDeleteWork}
              onReload={(customerId?: number) => void loadAddresses(customerId)}
              onReloadCustomers={() => void loadCustomers()}
            />
          )}

          {activeRoute === 'systems' && (
            <SystemsWorkspace
              canManage={session.user.role === 'admin' || session.user.role === 'curator'}
              loading={loaders.systems}
              onCreateSystem={async (payload) => {
                await createSystem(payload, session.token)
                await loadSystems()
              }}
              onCreateTypeOfWork={async (payload) => {
                await createTypeOfWork(payload, session.token)
                await loadSystems()
              }}
              onDeleteSystem={handleDeleteSystem}
              onDeleteTypeOfWork={handleDeleteTypeOfWork}
              onReload={() => void loadSystems()}
              onUpdateSystem={handleUpdateSystem}
              onUpdateTypeOfWork={handleUpdateTypeOfWork}
              systems={visibleSystems}
              typesOfWorks={typesOfWorks}
            />
          )}

          {activeRoute === 'contractors' && (
            <ContractorsWorkspace
              canCreate={session.user.role === 'admin' || session.user.role === 'curator'}
              contractors={visibleContractors}
              users={visibleAssignableUsers}
              loading={loaders.contractors}
              onCreate={handleCreateContractor}
              onAddAddress={handleAddAddressToContractor}
              onRemoveAddress={handleRemoveAddressFromContractor}
              onDelete={handleDeleteContractor}
              onUpdate={handleUpdateContractor}
              addresses={addresses}
              onReload={() => void loadContractors()}
            />
          )}

          {activeRoute === 'works' && (
            <WorksWorkspace
              canManage={session.user.role === 'admin' || session.user.role === 'curator' || session.user.role === 'engineer'}
              addresses={visibleAddresses}
              customers={customers}
              loading={loaders.works}
              onCreate={handleCreateWork}
              onDelete={handleDeleteWork}
              onReload={(addressId?: number) => void loadWorks(addressId)}
              technicians={visibleTechnicians}
              typesOfWorks={typesOfWorks}
              works={visibleWorks}
            />
          )}

          {activeRoute === 'technicians' && (
            <TechniciansWorkspace
              canManage={session.user.role === 'admin' || session.user.role === 'curator' || session.user.role === 'engineer'}
              assignments={technicianAssignments}
              contractors={visibleContractors}
              loading={loaders.technicians}
              role={session.user.role}
              onCreate={handleCreateTechnicianAssignment}
              onDelete={handleDeleteTechnicianAssignment}
              onReload={() => void loadTechnicians()}
              technicians={visibleAssignableUsers}
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
