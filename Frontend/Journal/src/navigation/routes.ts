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
    { key: 'contractors', label: 'Подрядчики', badge: '07' },
    { key: 'access', label: 'Доступ и 2FA', badge: '08' },
  ],
  curator: [
    { key: 'overview', label: 'Обзор', badge: '01' },
    { key: 'profile', label: 'Личный кабинет', badge: '02' },
    { key: 'curator-requests', label: 'Моя заявка', badge: '03' },
    { key: 'customers', label: 'Информация о заказчиках', badge: '04' },
    { key: 'addresses', label: 'Адреса и объекты', badge: '05' },
    { key: 'contractors', label: 'Подрядчики и инженеры', badge: '06' },
    { key: 'works', label: 'Работы', badge: '07' },
    { key: 'access', label: 'Доступ и 2FA', badge: '08' },
  ],
  engineer: [
    { key: 'overview', label: 'Обзор', badge: '01' },
    { key: 'profile', label: 'Личный кабинет', badge: '02' },
    { key: 'contractors', label: 'Моя подрядная организация', badge: '03' },
    { key: 'addresses', label: 'Объекты и адреса', badge: '04' },
    { key: 'works', label: 'Работы и системы', badge: '05' },
    { key: 'technicians', label: 'Техники', badge: '06' },
    { key: 'access', label: 'Доступ и 2FA', badge: '07' },
  ],
  technician: [
    { key: 'overview', label: 'Обзор', badge: '01' },
    { key: 'profile', label: 'Личный кабинет', badge: '02' },
    { key: 'addresses', label: 'Мой адрес', badge: '03' },
    { key: 'works', label: 'Журнал обслуживания', badge: '04' },
    { key: 'access', label: 'Доступ и 2FA', badge: '05' },
  ],
  user: [
    { key: 'overview', label: 'Обзор', badge: '01' },
    { key: 'profile', label: 'Личный кабинет', badge: '02' },
    { key: 'curator-requests', label: 'Заявка на кураторство', badge: '03' },
    { key: 'access', label: 'Доступ и 2FA', badge: '04' },
  ],
}

export function getRoutesForRole(role: string): RouteConfig[] {
  return roleRoutes[role as AppRole] ?? roleRoutes.user
}

export function getDefaultRouteForRole(role: string) {
  return getRoutesForRole(role)[0]?.key ?? 'overview'
}

export type AppRoute = string
