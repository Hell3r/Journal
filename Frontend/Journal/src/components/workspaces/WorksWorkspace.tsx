import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { AddressRecord, SystemRecord, TypeOfWorkRecord, WorkRecord } from '../../types/domain'
import type { UserRecord } from '../../types/users'

type WorksWorkspaceProps = {
  canManage: boolean
  loading: boolean
  works: WorkRecord[]
  addresses: AddressRecord[]
  systems: SystemRecord[]
  typesOfWorks: TypeOfWorkRecord[]
  technicians: UserRecord[]
  onCreate: (payload: { address_id: number; type_of_work_id: number; technician_id: number; description?: string | null }) => Promise<void>
  onDelete: (workId: number) => Promise<void>
  onReload: (addressId?: number) => void
}

export function WorksWorkspace({
  canManage,
  loading,
  works,
  addresses,
  systems,
  typesOfWorks,
  technicians,
  onCreate,
  onDelete,
  onReload,
}: WorksWorkspaceProps) {
  const [addressId, setAddressId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [description, setDescription] = useState('')
  const [selectedWorkIds, setSelectedWorkIds] = useState<number[]>([])
  const [filterAddressId, setFilterAddressId] = useState('')
  const [filterTechnicianId, setFilterTechnicianId] = useState('')
  const [filterTypeId, setFilterTypeId] = useState('')

  const filteredWorks = useMemo(() => {
    return works.filter((work) => {
      if (filterAddressId && work.address_id !== Number(filterAddressId)) return false
      if (filterTechnicianId && work.technician_id !== Number(filterTechnicianId)) return false
      if (filterTypeId && work.type_of_work_id !== Number(filterTypeId)) return false
      return true
    })
  }, [works, filterAddressId, filterTechnicianId, filterTypeId])

  const actPreview = useMemo(() => {
    const selected = filteredWorks.filter((work) => selectedWorkIds.includes(work.id))
    const address = addresses.find((item) => String(item.id) === addressId)
    return buildActPreview(selected, address?.address_name ?? 'Выберите объект')
  }, [filteredWorks, selectedWorkIds, addresses, addressId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!addressId || !typeId || !technicianId) return
    await onCreate({
      address_id: Number(addressId),
      type_of_work_id: Number(typeId),
      technician_id: Number(technicianId),
      description: description || undefined,
    })
    setDescription('')
  }

  const toggleWorkSelection = (workId: number) => {
    setSelectedWorkIds((current) =>
      current.includes(workId) ? current.filter((item) => item !== workId) : [...current, workId]
    )
  }

  const exportAct = () => {
    const blob = new Blob([actPreview], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'act_technical_service.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Журнал и акты</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Работы, замечания и техническое обслуживание по объектам. Здесь же можно собрать акт и выгрузить его в файл.
            </p>
          </div>
          <button
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            onClick={() => onReload(filterAddressId ? Number(filterAddressId) : undefined)}
            type="button"
          >
            {loading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <SelectField label="Объект" value={filterAddressId} onChange={setFilterAddressId}>
            <option className="bg-zinc-950" value="">
              Все объекты
            </option>
            {addresses.map((address) => (
              <option key={address.id} className="bg-zinc-950" value={address.id}>
                {address.address_name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Тип работы" value={filterTypeId} onChange={setFilterTypeId}>
            <option className="bg-zinc-950" value="">
              Все типы
            </option>
            {typesOfWorks.map((type) => (
              <option key={type.id} className="bg-zinc-950" value={type.id}>
                {type.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Исполнитель" value={filterTechnicianId} onChange={setFilterTechnicianId}>
            <option className="bg-zinc-950" value="">
              Все исполнители
            </option>
            {technicians
              .filter((user) => user.role === 'technician' || user.role === 'engineer')
              .map((user) => (
                <option key={user.id} className="bg-zinc-950" value={user.id}>
                  {user.username}
                </option>
              ))}
          </SelectField>
        </div>

        <div className="mt-6 grid gap-3">
          {filteredWorks.map((work) => {
            const systemName =
              systems.find((system) => system.addresses.some((relation) => relation.address_id === work.address_id))
                ?.name ?? 'СПЗ'
            return (
              <div key={work.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{work.type_of_work.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {work.address.address_name} · {work.technician.username}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-400">{work.description ?? 'Без замечаний'}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-zinc-400">
                      <input
                        checked={selectedWorkIds.includes(work.id)}
                        onChange={() => toggleWorkSelection(work.id)}
                        type="checkbox"
                      />
                      В акт
                    </label>
                    {canManage && (
                      <button
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                        onClick={() => void onDelete(work.id)}
                        type="button"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.24em] text-zinc-500">{systemName}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
          <h3 className="text-2xl font-semibold text-white">Добавить запись</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {canManage ? 'Здесь создаётся новая запись журнала эксплуатации и замечание по объекту.' : 'Текущей роли доступен только просмотр.'}
          </p>
          {canManage ? (
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <SelectField label="Объект" value={addressId} onChange={setAddressId}>
                <option className="bg-zinc-950" value="">
                  Выберите объект
                </option>
                {addresses.map((address) => (
                  <option key={address.id} className="bg-zinc-950" value={address.id}>
                    {address.address_name}
                  </option>
                ))}
              </SelectField>

              <SelectField label="Тип работы" value={typeId} onChange={setTypeId}>
                <option className="bg-zinc-950" value="">
                  Выберите тип работ
                </option>
                {typesOfWorks.map((type) => (
                  <option key={type.id} className="bg-zinc-950" value={type.id}>
                    {type.name}
                  </option>
                ))}
              </SelectField>

              <SelectField label="Исполнитель" value={technicianId} onChange={setTechnicianId}>
                <option className="bg-zinc-950" value="">
                  Выберите исполнителя
                </option>
                {technicians
                  .filter((user) => user.role === 'technician' || user.role === 'engineer')
                  .map((user) => (
                    <option key={user.id} className="bg-zinc-950" value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
              </SelectField>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>Замечание или комментарий</span>
                <textarea
                  className="min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Введите описание работ или замечание"
                  value={description}
                />
              </label>

              <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
                Добавить запись
              </button>
            </form>
          ) : null}
        </div>

        <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-white">Акт ТО</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Локальный предварительный шаблон для выгрузки.</p>
            </div>
            <button
              className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
              onClick={exportAct}
              type="button"
            >
              Скачать
            </button>
          </div>
          <pre className="mt-6 min-h-[340px] overflow-auto rounded-[24px] border border-white/10 bg-black/40 p-4 text-xs leading-6 text-zinc-300">
            {actPreview}
          </pre>
        </div>
      </div>
    </section>
  )
}

type SelectFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}

function SelectField({ label, value, onChange, children }: SelectFieldProps) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <select
        className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  )
}

function buildActPreview(selectedWorks: WorkRecord[], addressName: string) {
  const lines = [
    `АКТ ТЕХНИЧЕСКОГО ОБСЛУЖИВАНИЯ`,
    `Объект: ${addressName}`,
    `Дата: ${new Intl.DateTimeFormat('ru-RU', { dateStyle: 'full' }).format(new Date())}`,
    '',
    selectedWorks.length
      ? selectedWorks.map((work, index) => `${index + 1}. ${work.type_of_work.name} — ${work.description ?? 'без замечаний'}`).join('\n')
      : 'Нет выбранных записей для акта.',
    '',
    'Подписи:',
    'Куратор ____________________',
    'Инженер ____________________',
  ]

  return lines.join('\n')
}
