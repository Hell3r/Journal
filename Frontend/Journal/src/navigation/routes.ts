export type AppRole = 'admin' | 'curator' | 'engineer' | 'technician' | 'user'

export type RouteConfig = {
  key: string
  label: string
  badge: string
}

const roleRoutes: Record<AppRole, RouteConfig[]> = {
  admin: [
    { key: 'overview', label: 'Обзор', badge: '01' },
    { key: 'profile', label: 'Личный кабинет', badge: '02' },
    { key: 'users', label: 'Реестр пользователей', badge: '03' },
    { key: 'curator-requests', label: 'Заявки кураторов', badge: '04' },
    { key: 'customers', label: 'Организации', badge: '05' },
    { key: 'addresses', label: 'Адреса заказчиков', badge: '06' },
    { key: 'systems', label: 'СПЗ', badge: '07' },
    { key: 'contractors', label: 'Подрядчики', badge: '08' },
    { key: 'works', label: 'Журнал и акты', badge: '09' },
    { key: 'technicians', label: 'Техники', badge: '10' },
    { key: 'access', label: 'Доступ и 2FA', badge: '11' },
  ],
  curator: [
    { key: 'profile', label: 'Личный кабинет', badge: '01' },
    { key: 'curator-requests', label: 'Моя заявка', badge: '02' },
    { key: 'customers', label: 'Информация о заказчиках', badge: '03' },
    { key: 'addresses', label: 'Адреса и объекты', badge: '04' },
    { key: 'contractors', label: 'Подрядчики и инженеры', badge: '05' },
    { key: 'works', label: 'Работы', badge: '06' },
    { key: 'technicians', label: 'Техники', badge: '07' },
    { key: 'access', label: 'Доступ и 2FA', badge: '08' },
  ],
  engineer: [
    { key: 'profile', label: 'Личный кабинет', badge: '01' },
    { key: 'contractors', label: 'Моя подрядная организация', badge: '02' },
    { key: 'addresses', label: 'Объекты и адреса', badge: '03' },
    { key: 'systems', label: 'СПЗ', badge: '04' },
    { key: 'works', label: 'Работы и системы', badge: '05' },
    { key: 'technicians', label: 'Техники', badge: '06' },
    { key: 'access', label: 'Доступ и 2FA', badge: '08' },
  ],
  technician: [
    { key: 'profile', label: 'Личный кабинет', badge: '01' },
    { key: 'addresses', label: 'Мой адрес', badge: '02' },
    { key: 'works', label: 'Журнал обслуживания', badge: '03' },
    { key: 'access', label: 'Доступ и 2FA', badge: '04' },
  ],
  user: [
    { key: 'profile', label: 'Личный кабинет', badge: '01' },
    { key: 'curator-requests', label: 'Заявка на кураторство', badge: '02' },
    { key: 'access', label: 'Доступ и 2FA', badge: '03' },
  ],
}

export function getRoutesForRole(role: string): RouteConfig[] {
  return roleRoutes[role as AppRole] ?? roleRoutes.user
}

export function getDefaultRouteForRole(role: string) {
  return getRoutesForRole(role)[0]?.key ?? 'overview'
}

export type AppRoute = string
