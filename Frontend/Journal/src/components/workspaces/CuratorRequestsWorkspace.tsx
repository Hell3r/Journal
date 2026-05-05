import { useState, type FormEvent } from 'react'
import type { CuratorRequestRecord, CustomerRecord } from '../../types/domain'

type CuratorRequestsWorkspaceProps = {
  canActivate: boolean
  canCreate: boolean
  customers: CustomerRecord[]
  loading: boolean
  requests: CuratorRequestRecord[]
  onActivate: (id: number) => Promise<void>
  onCreate: (customerId: number) => Promise<void>
  onReload: () => void
}

export function CuratorRequestsWorkspace({
  canActivate,
  canCreate,
  customers,
  loading,
  requests,
  onActivate,
  onCreate,
  onReload,
}: CuratorRequestsWorkspaceProps) {
  const [customerId, setCustomerId] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!customerId) {
      return
    }

    await onCreate(Number(customerId))
    setCustomerId('')
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Заявки на кураторство</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {canActivate
                ? 'Администратор может обрабатывать заявки пользователей на вступление в роль куратора.'
                : 'Здесь отображается состояние вашей заявки на роль куратора по организации.'}
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
          {requests.map((request) => (
            <div key={request.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{request.customer.name_of_org}</p>
                  <p className="mt-1 text-xs text-zinc-500">{request.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs ${request.is_active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}>
                    {request.is_active ? 'Одобрена' : 'На модерации'}
                  </span>
                  {canActivate && !request.is_active && (
                    <button
                      className="rounded-2xl bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-zinc-200"
                      onClick={() => void onActivate(request.id)}
                      type="button"
                    >
                      Одобрить
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Подача заявки</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {canCreate
            ? 'Пользователь подаёт заявку на кураторство в рамках выбранной организации.'
            : 'Создание новых заявок доступно пользователю и будущему куратору.'}
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
            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
              Отправить на модерацию
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
            Для администратора здесь доступно только рассмотрение входящих заявок.
          </div>
        )}
      </div>
    </section>
  )
}
