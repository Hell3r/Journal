import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { UserRecord } from '../../types/users'

type UsersRegistryProps = {
  users: UserRecord[]
  loading: boolean
  canManage: boolean
  onReload: () => void
  onUpdate: (userId: number, payload: { name?: string; username?: string; email?: string; phone?: string; role?: string; is_active?: boolean; password?: string }) => Promise<void>
  onActivate: (userId: number) => Promise<void>
  onDelete: (userId: number) => Promise<void>
}

export function UsersRegistry({ users, loading, canManage, onReload, onUpdate, onActivate, onDelete }: UsersRegistryProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  )

  useEffect(() => {
    if (selectedUser) {
      setName(selectedUser.name ?? '')
      setUsername(selectedUser.username)
      setEmail(selectedUser.email)
      setPhone(selectedUser.phone)
      setRole(selectedUser.role)
      setPassword('')
      return
    }

    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id)
    }
  }, [selectedUser, selectedUserId, users])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedUser) {
      return
    }

    await onUpdate(selectedUser.id, {
      name,
      username,
      email,
      phone,
      role,
      password: password || undefined,
    })
    setPassword('')
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Реестр пользователей</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Таблица показывает роли, статусы, привязку к подрядчику и состояние двухфакторной защиты.
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
                {users.map((user) => {
                  const isSelected = selectedUser?.id === user.id
                  return (
                    <tr
                      key={user.id}
                      className={`border-t border-white/8 transition ${
                        isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <td className="px-4 py-4">{user.id}</td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-white">{user.name ?? user.username}</p>
                          <p className="text-xs text-zinc-500">{user.username}</p>
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
                  )
                })}
              </tbody>
            </table>
          </div>
          {!loading && users.length === 0 && (
            <div className="border-t border-white/8 px-4 py-10 text-center text-sm text-zinc-500">
              Список пока пуст. После появления пользователей они будут выведены здесь.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
          <h3 className="text-2xl font-semibold text-white">Карточка пользователя</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {canManage
              ? 'Можно отредактировать реквизиты, роль, состояние учётной записи и включить пользователя снова.'
              : 'Для текущей роли доступен только просмотр.'}
          </p>

          {selectedUser ? (
            <>
              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white">{selectedUser.name ?? selectedUser.username}</p>
                <p className="mt-1 text-xs text-zinc-500">{selectedUser.email}</p>
                <p className="mt-3 text-xs text-zinc-400">
                  Роль: {selectedUser.role} · Телефон: {selectedUser.phone || 'Не указан'}
                </p>
              </div>

              {canManage ? (
                <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                  <Field label="Имя" value={name} onChange={setName} placeholder="Введите имя" />
                  <Field label="Логин" value={username} onChange={setUsername} placeholder="username" />
                  <Field label="Email" value={email} onChange={setEmail} placeholder="email@example.com" />
                  <Field label="Телефон" value={phone} onChange={setPhone} placeholder="+7 ..." />
                  <label className="grid gap-2 text-sm text-zinc-300">
                    <span>Роль</span>
                    <select
                      className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none"
                      onChange={(event) => setRole(event.target.value)}
                      value={role}
                    >
                      <option className="bg-zinc-950" value="admin">
                        admin
                      </option>
                      <option className="bg-zinc-950" value="curator">
                        curator
                      </option>
                      <option className="bg-zinc-950" value="engineer">
                        engineer
                      </option>
                      <option className="bg-zinc-950" value="technician">
                        technician
                      </option>
                      <option className="bg-zinc-950" value="user">
                        user
                      </option>
                    </select>
                  </label>
                  <Field
                    label="Новый пароль"
                    value={password}
                    onChange={setPassword}
                    placeholder="Оставьте пустым, если не меняете"
                    type="password"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
                      Сохранить
                    </button>
                    {!selectedUser.is_active ? (
                      <button
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                        onClick={async () => {
                          await onActivate(selectedUser.id)
                        }}
                        type="button"
                      >
                        Активировать
                      </button>
                    ) : null}
                    <button
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                      onClick={async () => {
                        await onDelete(selectedUser.id)
                        setSelectedUserId(null)
                      }}
                      type="button"
                    >
                      Удалить
                    </button>
                  </div>
                </form>
              ) : null}
            </>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
              Выберите пользователя слева, чтобы открыть его карточку.
            </div>
          )}
        </div>
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
