import type { SessionState } from '../../types/auth'

type ProfileWorkspaceProps = {
  session: SessionState
  roleTitle: string
  roleDescription: string
}

export function ProfileWorkspace({ session, roleTitle, roleDescription }: ProfileWorkspaceProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Личный кабинет</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Профиль текущего пользователя и его роль в системе электронного журнала.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoTile label="Пользователь" value={session.user.username} />
          <InfoTile label="Email" value={session.user.email} />
          <InfoTile label="Роль" value={roleTitle} />
          <InfoTile label="Статус" value={session.user.is_active ? 'Активен' : 'Ожидает активации'} />
          <InfoTile label="ID пользователя" value={String(session.user.user_id)} />
          <InfoTile label="Дата регистрации" value={formatDate(session.user.date_joined)} />
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Роль и зона ответственности</h3>
        <p className="mt-4 text-sm leading-6 text-zinc-400">{roleDescription}</p>
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">2FA</p>
          <p className="mt-3 text-sm text-white">
            {session.twoFactorEnabled ? 'Двухфакторная защита включена.' : 'Двухфакторная защита пока не включена.'}
          </p>
        </div>
      </div>
    </section>
  )
}

type InfoTileProps = {
  label: string
  value: string
}

function InfoTile({ label, value }: InfoTileProps) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-3 text-sm leading-6 text-white">{value}</p>
    </div>
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
