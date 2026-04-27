const chartData = [
  { label: 'Сигма Сервис', value: 38 },
  { label: 'ТехИнж Групп', value: 24 },
  { label: 'Север Монтаж', value: 18 },
  { label: 'Вектор ТО', value: 12 },
  { label: 'Новая Линия', value: 8 },
]

export function MaintenanceChart() {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-white">Соотношение ТО по компаниям</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Визуальная заглушка для будущей аналитики по обслуживающим компаниям.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
          Демонстрационный график
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
          <div className="flex h-[280px] items-end gap-3">
            {chartData.map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                <div className="w-full rounded-t-[18px] bg-gradient-to-t from-white via-zinc-300 to-zinc-100" style={{ height: `${item.value * 5}px` }} />
                <div className="text-center text-xs text-zinc-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {chartData.map((item) => (
            <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-white">{item.label}</p>
                <span className="text-xs text-zinc-500">{item.value}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/5">
                <div className="h-2 rounded-full bg-white" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
