export const appRoutes = [
  { key: 'overview', label: 'Обзор', badge: '01' },
  { key: 'users', label: 'Реестр пользователей', badge: '02' },
  { key: 'maintenance', label: 'ТО', badge: '03' },
  { key: 'records', label: 'Учёты', badge: '04' },
  { key: 'supplies', label: 'Поставки', badge: '05' },
  { key: 'certificates', label: 'Сертификаты', badge: '06' },
  { key: 'access', label: 'Доступ и 2FA', badge: '07' },
] as const

export type AppRoute = (typeof appRoutes)[number]['key']
