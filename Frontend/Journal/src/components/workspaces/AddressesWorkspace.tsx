import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { AddressRecord, CustomerRecord, SystemRecord, TypeOfWorkRecord } from '../../types/domain'
import type { UserRecord } from '../../types/users'

type AddressesWorkspaceProps = {
  addresses: AddressRecord[]
  customers: CustomerRecord[]
  systems: SystemRecord[]
  typesOfWorks: TypeOfWorkRecord[]
  technicians: UserRecord[]
  loading: boolean
  canManage: boolean
  onCreate: (payload: { address_name: string; customer_id: number }) => Promise<void>
  onUpdate: (addressId: number, payload: { address_name?: string }) => Promise<void>
  onDelete: (addressId: number) => Promise<void>
  onAddSystemToAddress: (addressId: number, systemId: number) => Promise<void>
  onRemoveSystemFromAddress: (addressId: number, systemId: number) => Promise<void>
  onCreateWork: (payload: { address_id: number; type_of_work_id: number; technician_id: number; description?: string | null }) => Promise<void>
  onDeleteWork: (workId: number) => Promise<void>
  onReload: (customerId?: number) => void
  onReloadCustomers: () => void
}

export function AddressesWorkspace({
  addresses,
  customers,
  systems,
  typesOfWorks,
  technicians,
  loading,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
  onAddSystemToAddress,
  onRemoveSystemFromAddress,
  onCreateWork,
  onDeleteWork,
  onReload,
  onReloadCustomers,
}: AddressesWorkspaceProps) {
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [customerId, setCustomerId] = useState('')
  const [addressName, setAddressName] = useState('')
  const [systemId, setSystemId] = useState('')
  const [workTypeId, setWorkTypeId] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [workDescription, setWorkDescription] = useState('')

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  )

  const availableSystems = useMemo(() => {
    if (!selectedAddress) {
      return systems
    }

    return systems.filter(
      (system) => !selectedAddress.systems.some((relation) => relation.system_id === system.id)
    )
  }, [systems, selectedAddress])

  const addressWorks = useMemo(() => {
    if (!selectedAddress) {
      return []
    }

    return selectedAddress.works.slice().sort((left, right) => right.id - left.id)
  }, [selectedAddress])

  useEffect(() => {
    if (selectedAddress) {
      setAddressName(selectedAddress.address_name)
      setCustomerId(String(selectedAddress.customer_id))
      setSystemId('')
      setWorkTypeId('')
      setTechnicianId('')
      setWorkDescription('')
      return
    }

    setAddressName('')
  }, [selectedAddress])

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      setSelectedAddressId(addresses[0].id)
    }
  }, [addresses, selectedAddressId])

  const techniciansOptions = useMemo(
    () => technicians.filter((user) => user.role === 'technician' || user.role === 'engineer'),
    [technicians]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedAddress) {
      await onUpdate(selectedAddress.id, { address_name: addressName })
      return
    }

    if (!customerId) {
      return
    }

    await onCreate({
      address_name: addressName,
      customer_id: Number(customerId),
    })
    setAddressName('')
  }

  const handleCreateWork = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAddress || !workTypeId || !technicianId) {
      return
    }

    await onCreateWork({
      address_id: selectedAddress.id,
      type_of_work_id: Number(workTypeId),
      technician_id: Number(technicianId),
      description: workDescription || undefined,
    })
    setWorkDescription('')
  }

  const lastWork = addressWorks[0] ?? null
  const responsibleTechnicians = Array.from(
    new Map(
      addressWorks
        .map((work) => work.technician)
        .filter(
          (technician): technician is NonNullable<(typeof addressWorks)[number]['technician']> => Boolean(technician)
        )
        .map((technician) => [technician.id, technician])
    ).values()
  )

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Адреса и объекты</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Здесь видны системы, последние работы и ответственные исполнители по каждому объекту.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              onClick={() => onReload(selectedAddress?.customer_id)}
              type="button"
            >
              {loading ? 'Загрузка...' : 'Обновить'}
            </button>
            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              onClick={onReloadCustomers}
              type="button"
            >
              Организации
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {addresses.map((address) => {
            const isSelected = selectedAddress?.id === address.id
            const firstWork = address.works[0]
            return (
              <button
                key={address.id}
                className={`rounded-[24px] border p-4 text-left transition ${
                  isSelected
                    ? 'border-white/25 bg-white/10'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
                onClick={() => setSelectedAddressId(address.id)}
                type="button"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{address.address_name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {customers.find((customer) => customer.id === address.customer_id)?.name_of_org ?? 'Без организации'}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <div>Систем: {address.systems.length}</div>
                    <div>Работ: {addressWorksFor(address).length}</div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
                  <div>Подрядчиков: {address.contractors.length}</div>
                  <div>Последняя запись: {firstWork ? firstWork.type_of_work?.name ?? 'Без типа' : 'Нет данных'}</div>
                  <div>Исполнителей: {addressWorksFor(address).length ? new Set(address.works.map((work) => work.technician_id)).size : 0}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
          <h3 className="text-2xl font-semibold text-white">
            {selectedAddress ? 'Редактирование объекта' : 'Добавление адреса'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {canManage
              ? 'Редактируем название объекта, привязку к организации и используем те же данные для быстрого создания новых адресов.'
              : 'Текущая роль может только просматривать карточки объектов.'}
          </p>

          {canManage ? (
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>Организация</span>
                <select
                  className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none"
                  onChange={(event) => setCustomerId(event.target.value)}
                  value={selectedAddress ? String(selectedAddress.customer_id) : customerId}
                  disabled={Boolean(selectedAddress)}
                >
                  <option className="bg-zinc-950" value="">
                    Выберите организацию
                  </option>
                  {customers.map((customer) => (
                    <option key={customer.id} className="bg-zinc-950" value={customer.id}>
                      {customer.name_of_org}
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label="Адрес"
                value={addressName}
                onChange={setAddressName}
                placeholder="Введите адрес объекта"
              />

              <div className="flex flex-wrap gap-2">
                <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
                  {selectedAddress ? 'Сохранить' : 'Добавить адрес'}
                </button>
                {selectedAddress && (
                  <button
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                    onClick={async () => {
                      await onDelete(selectedAddress.id)
                      setSelectedAddressId(null)
                    }}
                    type="button"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
              Создание и изменение объектов доступно администратору и куратору.
            </div>
          )}
        </div>

        {selectedAddress ? (
          <>
            <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-semibold text-white">Системы и оборудование</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Назначаем СПЗ на объект и снимаем лишние связи из карточки объекта.
                  </p>
                  <div className="mt-3 text-xs text-zinc-500">
                    Последняя запись:{' '}
                    {lastWork
                      ? `${lastWork.type_of_work?.name ?? 'Тип работы'} · ${lastWork.technician?.username ?? 'Исполнитель'}`
                      : 'нет данных'}
                  </div>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <div>Подрядчиков: {selectedAddress.contractors.length}</div>
                  <div>Ответственных: {responsibleTechnicians.length}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {selectedAddress.systems.map((relation) => (
                  <div
                    key={relation.id}
                    className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{relation.system?.name ?? 'Система'}</p>
                      <p className="mt-1 text-xs text-zinc-500">Связь #{relation.id}</p>
                    </div>
                    {canManage && (
                      <button
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                        onClick={async () => {
                          await onRemoveSystemFromAddress(selectedAddress.id, relation.system_id)
                        }}
                        type="button"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canManage && (
                <div className="mt-6 grid gap-3">
                  <label className="grid gap-2 text-sm text-zinc-300">
                    <span>Добавить систему</span>
                    <select
                      className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none"
                      onChange={(event) => setSystemId(event.target.value)}
                      value={systemId}
                    >
                      <option className="bg-zinc-950" value="">
                        Выберите систему
                      </option>
                      {availableSystems.map((system) => (
                        <option key={system.id} className="bg-zinc-950" value={system.id}>
                          {system.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                    onClick={async () => {
                      if (!systemId) {
                        return
                      }

                      await onAddSystemToAddress(selectedAddress.id, Number(systemId))
                      setSystemId('')
                    }}
                    type="button"
                  >
                    Привязать систему
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
              <h3 className="text-2xl font-semibold text-white">Журнал объекта</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Последние работы и замечания по выбранному адресу.
              </p>

              {addressWorks.length > 0 ? (
                <div className="mt-6 grid gap-3">
                  {addressWorks.map((work) => (
                    <div key={work.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{work.type_of_work?.name ?? 'Тип работы'}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {work.technician?.username ?? 'Исполнитель'} · {work.technician?.email ?? 'Нет email'}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-zinc-300">
                            {work.description ?? 'Без замечаний'}
                          </p>
                        </div>
                        {canManage && (
                          <button
                            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                            onClick={async () => {
                              await onDeleteWork(work.id)
                            }}
                            type="button"
                          >
                            Удалить
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
                  По этому объекту пока нет записей журнала.
                </div>
              )}

              {canManage && (
                <form className="mt-6 grid gap-4" onSubmit={handleCreateWork}>
                  <label className="grid gap-2 text-sm text-zinc-300">
                    <span>Тип работы</span>
                    <select
                      className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none"
                      onChange={(event) => setWorkTypeId(event.target.value)}
                      value={workTypeId}
                    >
                      <option className="bg-zinc-950" value="">
                        Выберите тип
                      </option>
                      {typesOfWorks.map((type) => (
                        <option key={type.id} className="bg-zinc-950" value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm text-zinc-300">
                    <span>Исполнитель</span>
                    <select
                      className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none"
                      onChange={(event) => setTechnicianId(event.target.value)}
                      value={technicianId}
                    >
                      <option className="bg-zinc-950" value="">
                        Выберите исполнителя
                      </option>
                      {techniciansOptions.map((user) => (
                        <option key={user.id} className="bg-zinc-950" value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm text-zinc-300">
                    <span>Комментарий</span>
                    <textarea
                      className="min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
                      onChange={(event) => setWorkDescription(event.target.value)}
                      placeholder="Введите замечание или описание работ"
                      value={workDescription}
                    />
                  </label>

                  <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
                    Добавить запись
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-[30px] border border-dashed border-white/10 bg-[#0b0b0c] p-6 text-sm text-zinc-500 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
            Выберите адрес слева, чтобы увидеть системы, работы и ответственных.
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

function addressWorksFor(address: AddressRecord) {
  return address.works ?? []
}
