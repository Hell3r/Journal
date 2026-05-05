import { useState, type FormEvent } from 'react'
import type { CustomerRecord } from '../../types/domain'

type CustomersWorkspaceProps = {
  canCreate: boolean
  customers: CustomerRecord[]
  loading: boolean
  onCreate: (payload: { name_of_org: string; email: string }) => Promise<void>
  onReload: () => void
}

export function CustomersWorkspace({
  canCreate,
  customers,
  loading,
  onCreate,
  onReload,
}: CustomersWorkspaceProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onCreate({
      name_of_org: name,
      email,
    })
    setName('')
    setEmail('')
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Организации и заказчики</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Список организаций, к которым привязываются кураторы, адреса и дальнейшие объекты обслуживания.
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
          {customers.map((customer) => (
            <div key={customer.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{customer.name_of_org}</p>
                  <p className="mt-1 text-xs text-zinc-500">{customer.email}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${customer.is_active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}>
                  {customer.is_active ? 'Активна' : 'Ожидает'}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                <div>Адресов: {customer.addresses.length}</div>
                <div>Кураторов: {customer.curators.length}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Добавление заказчика</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {canCreate ? 'Создание новой организации через API.' : 'Для текущей роли доступен просмотр без создания новых организаций.'}
        </p>
        {canCreate ? (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <Field label="Название организации" value={name} onChange={setName} placeholder="Введите наименование" />
            <Field label="Email" value={email} onChange={setEmail} placeholder="Введите email" type="email" />
            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
              Добавить организацию
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
            Создание организаций доступно из кабинета администратора.
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
  type?: string
}

function Field({ label, value, placeholder, onChange, type = 'text' }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <input
        className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  )
}
