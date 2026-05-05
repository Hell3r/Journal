import { useMemo, useState, type FormEvent } from 'react'
import type { AddressRecord, CustomerRecord } from '../../types/domain'

type AddressesWorkspaceProps = {
  addresses: AddressRecord[]
  canCreate: boolean
  customers: CustomerRecord[]
  loading: boolean
  onCreate: (payload: { address_name: string; customer_id: number }) => Promise<void>
  onReload: (customerId?: number) => void
}

export function AddressesWorkspace({
  addresses,
  canCreate,
  customers,
  loading,
  onCreate,
  onReload,
}: AddressesWorkspaceProps) {
  const [addressName, setAddressName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const filterCustomerId = useMemo(() => (customerId ? Number(customerId) : undefined), [customerId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!customerId) {
      return
    }

    await onCreate({
      address_name: addressName,
      customer_id: Number(customerId),
    })
    setAddressName('')
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Адреса и объекты</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Карточки адресов с краткой статистикой по подрядчикам, системам и последним работам.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              onClick={() => onReload(filterCustomerId)}
              type="button"
            >
              {loading ? 'Загрузка...' : 'Обновить'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {addresses.map((address) => (
            <div key={address.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">{address.address_name}</p>
              <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
                <div>Подрядчиков: {address.contractors.length}</div>
                <div>Систем: {address.systems.length}</div>
                <div>Работ: {address.works.length}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Добавление адреса</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {canCreate ? 'Новый объект создаётся внутри выбранной организации.' : 'Для текущей роли доступен только просмотр адресов.'}
        </p>
        {canCreate ? (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm text-zinc-300">
              <span>Организация</span>
              <select
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none"
                onChange={(event) => setCustomerId(event.target.value)}
                value={customerId}
              >
                <option className="bg-zinc-950" value="">Выберите организацию</option>
                {customers.map((customer) => (
                  <option key={customer.id} className="bg-zinc-950" value={customer.id}>
                    {customer.name_of_org}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Адрес" value={addressName} onChange={setAddressName} placeholder="Введите адрес объекта" />
            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
              Добавить адрес
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
            Создание адресов доступно администратору и активному куратору.
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
