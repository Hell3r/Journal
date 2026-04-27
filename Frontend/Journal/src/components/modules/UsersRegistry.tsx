import type { UserRecord } from '../../types/users'

type UsersRegistryProps = {
  users: UserRecord[]
  loading: boolean
  onReload: () => void
}

export function UsersRegistry({ users, loading, onReload }: UsersRegistryProps) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-white">Реестр пользователей</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Таблица загружается из API и отражает состояние пользователей, ролей и двухфакторной защиты.
          </p>
        </div>
        <button
          className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
          onClick={onReload}
          type="button"
        >
          {loading ? 'Обновление...' : 'Обновить список'}
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.24em] text-zinc-500">
              <tr>
                <th className="px-4 py-4 font-medium">ID</th>
                <th className="px-4 py-4 font-medium">Пользователь</th>
                <th className="px-4 py-4 font-medium">Роль</th>
                <th className="px-4 py-4 font-medium">Контакты</th>
                <th className="px-4 py-4 font-medium">Статус</th>
                <th className="px-4 py-4 font-medium">2FA</th>
                <th className="px-4 py-4 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody className="bg-black/20 text-sm text-zinc-200">
              {users.map((user) => (
                <tr key={user.id} className="border-t border-white/8">
                  <td className="px-4 py-4">{user.id}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-white">{user.username}</p>
                      <p className="text-xs text-zinc-500">Подрядчик: {user.contractor_id ?? 'Не привязан'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">{user.role}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p>{user.email}</p>
                      <p className="text-xs text-zinc-500">{user.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs ${
                        user.is_active
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {user.is_active ? 'Активен' : 'Отключён'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs ${
                        user.is_2fa_enabled
                          ? 'border-white/20 bg-white/10 text-white'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {user.is_2fa_enabled ? 'Включена' : 'Выключена'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-zinc-400">{formatDate(user.date_joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && users.length === 0 && (
          <div className="border-t border-white/8 px-4 py-10 text-center text-sm text-zinc-500">
            Список пока пуст. После появления пользователей они будут выведены здесь.
          </div>
        )}
      </div>
    </section>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
