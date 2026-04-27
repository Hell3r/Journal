type ModulePlaceholderProps = {
  title: string
  subtitle: string
  items: string[]
}

export function ModulePlaceholder({ title, subtitle, items }: ModulePlaceholderProps) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{subtitle}</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-white">{item}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Пространство подготовлено под реальный модуль и может быть наполнено данными на следующем этапе.
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
