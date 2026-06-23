import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { ContractorRecord, TechnicianAssignmentRecord } from '../../types/domain'
import type { UserRecord } from '../../types/users'

type TechniciansWorkspaceProps = {
  canManage: boolean
  loading: boolean
  assignments: TechnicianAssignmentRecord[]
  contractors: ContractorRecord[]
  technicians: UserRecord[]
  onCreate: (payload: { contractor_id: number; address_id: number; technician_id: number }) => Promise<void>
  onDelete: (assignmentId: number) => Promise<void>
  onReload: () => void
}

export function TechniciansWorkspace({
  canManage,
  loading,
  assignments,
  contractors,
  technicians,
  onCreate,
  onDelete,
  onReload,
}: TechniciansWorkspaceProps) {
  const [contractorId, setContractorId] = useState('')
  const [addressId, setAddressId] = useState('')
  const [technicianId, setTechnicianId] = useState('')

  const contractorAddresses = useMemo(() => {
    const contractor = contractors.find((item) => String(item.id) === contractorId)
    return contractor?.addresses ?? []
  }, [contractorId, contractors])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!contractorId || !addressId || !technicianId) {
      return
    }

    await onCreate({
      contractor_id: Number(contractorId),
      address_id: Number(addressId),
      technician_id: Number(technicianId),
    })
    setTechnicianId('')
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Техники и назначения</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Назначение техников на связку подрядчик-объект. Это и есть рабочая область инженера.
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
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{assignment.user.username}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {assignment.contractor.name_of_contractor} · {assignment.address.address_name}
                  </p>
                </div>
                {canManage && (
                  <button
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                    onClick={() => void onDelete(assignment.id)}
                    type="button"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Создание назначения</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {canManage ? 'Инженер или куратор назначает технику на объект и подрядчика.' : 'Только просмотр назначений.'}
        </p>
        {canManage ? (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <SelectField label="Подрядчик" value={contractorId} onChange={setContractorId}>
              <option className="bg-zinc-950" value="">
                Выберите подрядчика
              </option>
              {contractors.map((contractor) => (
                <option key={contractor.id} className="bg-zinc-950" value={contractor.id}>
                  {contractor.name_of_contractor}
                </option>
              ))}
            </SelectField>

            <SelectField label="Объект" value={addressId} onChange={setAddressId}>
              <option className="bg-zinc-950" value="">
                {contractorId ? 'Выберите объект' : 'Сначала выберите подрядчика'}
              </option>
              {contractorAddresses.map((address) => (
                <option key={address.id} className="bg-zinc-950" value={address.id}>
                  {address.address_name}
                </option>
              ))}
            </SelectField>

            <SelectField label="Техник" value={technicianId} onChange={setTechnicianId}>
              <option className="bg-zinc-950" value="">
                Выберите техника
              </option>
              {technicians
                .filter((user) => user.role === 'technician' || user.role === 'engineer')
                .map((user) => (
                  <option key={user.id} className="bg-zinc-950" value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
            </SelectField>

            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
              Назначить
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
            Раздел доступен для инженера, администратора и активного куратора.
          </div>
        )}
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
