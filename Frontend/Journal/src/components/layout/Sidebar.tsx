import { appRoutes, type AppRoute } from '../../navigation/routes'
import type { SessionState } from '../../types/auth'

type SidebarProps = {
  activeRoute: AppRoute
  actionLabel: string
  onLogout: () => void
  onRouteChange: (route: AppRoute) => void
  session: SessionState
}

export function Sidebar({ activeRoute, actionLabel, onLogout, onRouteChange, session }: SidebarProps) {
  return (
    <aside className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,#171717_0%,#0b0b0c_58%,#070707_100%)] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="flex h-full flex-col">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-zinc-300">
            Электронный журнал
          </div>
          <h1 className="mt-5 text-3xl font-semibold leading-none text-white">Рабочее приложение</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Вертикальное меню, единая рабочая зона и доступ к защищённым данным через API.
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {appRoutes.map((route) => (
            <button
              key={route.key}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                activeRoute === route.key
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/8 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]'
              }`}
              onClick={() => onRouteChange(route.key)}
              type="button"
            >
              <span>{route.label}</span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-zinc-500">
                {route.badge}
              </span>
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-[24px] border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Аккаунт</p>
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            <p className="text-white">{session.user.username}</p>
            <p>{session.user.role}</p>
            <p>{session.user.email}</p>
          </div>
          <button
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            onClick={onLogout}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </aside>
  )
}
