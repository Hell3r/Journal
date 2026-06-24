import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { AddressRecord, ContractorRecord } from '../../types/domain'
import type { UserRecord } from '../../types/users'

type ContractorsWorkspaceProps = {
  canCreate: boolean
  contractors: ContractorRecord[]
  users: UserRecord[]
  addresses: AddressRecord[]
  loading: boolean
  onCreate: (payload: { name_of_contractor: string; engineer_id?: number | null }) => Promise<void>
  onUpdate: (contractorId: number, payload: { name_of_contractor?: string; engineer_id?: number | null; is_active?: boolean }) => Promise<void>
  onDelete: (contractorId: number) => Promise<void>
  onAddAddress: (contractorId: number, addressId: number) => Promise<void>
  onRemoveAddress: (contractorId: number, addressId: number) => Promise<void>
  onReload: () => void
}

export function ContractorsWorkspace({
  canCreate,
  contractors,
  users,
  addresses,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  onAddAddress,
  onRemoveAddress,
  onReload,
}: ContractorsWorkspaceProps) {
  const [name, setName] = useState('')
  const [engineerId, setEngineerId] = useState('')
  const [selectedContractorId, setSelectedContractorId] = useState<number | null>(null)
  const [assignedAddressId, setAssignedAddressId] = useState('')

  const selectedContractor = useMemo(
    () => contractors.find((item) => item.id === selectedContractorId) ?? null,
    [selectedContractorId, contractors]
  )
  const availableUsers = useMemo(() => users.filter((user) => user.role === 'user'), [users])

  useEffect(() => {
    if (!selectedContractorId && contractors.length > 0) {
      const first = contractors[0]
      setSelectedContractorId(first.id)
      setName(first.name_of_contractor)
      setEngineerId(first.engineer_id ? String(first.engineer_id) : '')
    }
  }, [contractors, selectedContractorId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedContractor) {
      await onUpdate(selectedContractor.id, {
        name_of_contractor: name,
        engineer_id: engineerId ? Number(engineerId) : null,
      })
    } else {
      await onCreate({
        name_of_contractor: name,
        engineer_id: engineerId ? Number(engineerId) : null,
      })
    }
    setName('')
    setEngineerId('')
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
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
            <button
              key={contractor.id}
              className={`rounded-[24px] border p-4 text-left transition ${
                selectedContractorId === contractor.id
                  ? 'border-white/20 bg-white/10'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
              }`}
              onClick={() => {
                setSelectedContractorId(contractor.id)
                setName(contractor.name_of_contractor)
                setEngineerId(contractor.engineer_id ? String(contractor.engineer_id) : '')
              }}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{contractor.name_of_contractor}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Пользователь: {contractor.engineer?.name ?? contractor.engineer?.email ?? 'Не назначен'}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${contractor.is_active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}>
                  {contractor.is_active ? 'Активен' : 'Отключён'}
                </span>
              </div>
              <div className="mt-4 text-xs text-zinc-400">Закреплённых адресов: {contractor.addresses.length}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Управление подрядчиком</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {canCreate ? 'Создание, редактирование и привязка адресов доступны администратору и кураторам.' : 'Только просмотр.'}
        </p>
        {canCreate ? (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <Field label="Название подрядчика" value={name} onChange={setName} placeholder="Введите название" />
            <label className="grid gap-2 text-sm text-zinc-300">
              <span>Пользователь</span>
              <select
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none"
                onChange={(event) => setEngineerId(event.target.value)}
                value={engineerId}
              >
                <option className="bg-zinc-950" value="">
                  Не назначать
                </option>
                {availableUsers.map((user) => (
                  <option key={user.id} className="bg-zinc-950" value={user.id}>
                    {user.name ?? user.username} ({user.email})
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-zinc-500">В списке показываются только пользователи с ролью `user`.</p>

            <div className="flex flex-wrap gap-2">
              <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
                {selectedContractor ? 'Сохранить' : 'Добавить'}
              </button>
              {selectedContractor && (
                <>
                  <button
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                    onClick={async () => {
                      await onDelete(selectedContractor.id)
                      setSelectedContractorId(null)
                      setName('')
                      setEngineerId('')
                    }}
                    type="button"
                  >
                    Удалить
                  </button>
                </>
              )}
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
            Управление подрядчиками доступно администратору и активному куратору.
          </div>
        )}

        {selectedContractor && (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Связанные адреса</p>
                <p className="mt-1 text-xs text-zinc-500">Назначение и снятие адресов для подрядчика.</p>
              </div>
            </div>
            <label className="mt-4 grid gap-2 text-sm text-zinc-300">
              <span>Добавить адрес</span>
              <select
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none"
                onChange={(event) => setAssignedAddressId(event.target.value)}
                value={assignedAddressId}
              >
                <option className="bg-zinc-950" value="">
                  Выберите адрес
                </option>
                {addresses.map((address) => (
                  <option key={address.id} className="bg-zinc-950" value={address.id}>
                    {address.address_name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
              onClick={async () => {
                if (!assignedAddressId) return
                await onAddAddress(selectedContractor.id, Number(assignedAddressId))
                setAssignedAddressId('')
              }}
              type="button"
            >
              Привязать адрес
            </button>

            <div className="mt-4 grid gap-2">
              {selectedContractor.addresses.map((address) => (
                <div key={address.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-zinc-200">
                  <span>{address.address_name}</span>
                  <button
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                    onClick={async () => {
                      await onRemoveAddress(selectedContractor.id, address.id)
                    }}
                    type="button"
                  >
                    Убрать
                  </button>
                </div>
              ))}
            </div>
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
