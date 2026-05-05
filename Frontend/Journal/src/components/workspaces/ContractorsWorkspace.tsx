import { useState, type FormEvent } from 'react'
import type { ContractorRecord } from '../../types/domain'
import type { UserRecord } from '../../types/users'

type ContractorsWorkspaceProps = {
  canCreate: boolean
  contractors: ContractorRecord[]
  engineers: UserRecord[]
  loading: boolean
  onCreate: (payload: { name_of_contractor: string; engineer_id?: number | null }) => Promise<void>
  onReload: () => void
}

export function ContractorsWorkspace({
  canCreate,
  contractors,
  engineers,
  loading,
  onCreate,
  onReload,
}: ContractorsWorkspaceProps) {
  const [name, setName] = useState('')
  const [engineerId, setEngineerId] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onCreate({
      name_of_contractor: name,
      engineer_id: engineerId ? Number(engineerId) : null,
    })
    setName('')
    setEngineerId('')
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Подрядные организации</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Подрядчики, их состояние, связанные адреса и назначенные инженеры.
            </p>
          </div>
          <button
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            onClick={onReload}
            type="button"
          >
            {loading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {contractors.map((contractor) => (
            <div key={contractor.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{contractor.name_of_contractor}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Инженер: {contractor.engineer?.email ?? 'Не назначен'}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${contractor.is_active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}>
                  {contractor.is_active ? 'Активен' : 'Отключён'}
                </span>
              </div>
              <div className="mt-4 text-xs text-zinc-400">Закреплённых адресов: {contractor.addresses.length}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Добавление подрядчика</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {canCreate ? 'Создание подрядной организации и назначение инженера.' : 'Для текущей роли доступен только просмотр подрядчиков.'}
        </p>
        {canCreate ? (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <Field label="Название подрядчика" value={name} onChange={setName} placeholder="Введите название" />
            <label className="grid gap-2 text-sm text-zinc-300">
              <span>Инженер</span>
              <select
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none"
                onChange={(event) => setEngineerId(event.target.value)}
                value={engineerId}
              >
                <option className="bg-zinc-950" value="">Не назначать</option>
                {engineers.map((engineer) => (
                  <option key={engineer.id} className="bg-zinc-950" value={engineer.id}>
                    {engineer.username} ({engineer.email})
                  </option>
                ))}
              </select>
            </label>
            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
              Добавить подрядчика
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
            Управление подрядчиками доступно администратору и активному куратору.
          </div>
        )}
      </div>
    </section>
  )
}

type FieldProps = {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}

function Field({ label, value, placeholder, onChange }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <input
        className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}
