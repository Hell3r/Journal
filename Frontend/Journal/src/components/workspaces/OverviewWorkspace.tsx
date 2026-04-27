import { MaintenanceChart } from '../modules/MaintenanceChart'

type QuickAction = {
  title: string
  text: string
  actionLabel: string
  onClick: () => void
}

type OverviewWorkspaceProps = {
  quickActions: QuickAction[]
  serviceState: {
    api: string
    database: string
  }
  usersCountLabel: string
  twoFactorLabel: string
}

export function OverviewWorkspace({
  quickActions,
  serviceState,
  usersCountLabel,
  twoFactorLabel,
}: OverviewWorkspaceProps) {
  return (
    <section className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
          <h3 className="text-2xl font-semibold text-white">Рабочие панели</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Ключевые точки входа в рабочее пространство. Каждая панель может переключать содержимое основной области.
          </p>
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {quickActions.map((action) => (
              <div key={action.title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white">{action.title}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{action.text}</p>
                <button
                  className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                  onClick={action.onClick}
                  type="button"
                >
                  {action.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
          <h3 className="text-2xl font-semibold text-white">Текущее состояние</h3>
          <div className="mt-6 grid gap-3">
            <MetricCard label="API" value={serviceState.api} />
            <MetricCard label="База данных" value={serviceState.database} />
            <MetricCard label="Пользователи" value={usersCountLabel} />
            <MetricCard label="2FA" value={twoFactorLabel} />
          </div>
        </div>
      </div>

      <MaintenanceChart />
    </section>
  )
}

type MetricCardProps = {
  label: string
  value: string
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
      <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">{label}</p>
      <p className="mt-3 text-base font-medium text-white">{value}</p>
    </div>
  )
}
