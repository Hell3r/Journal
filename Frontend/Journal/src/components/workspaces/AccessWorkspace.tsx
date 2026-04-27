import type { FormEvent } from 'react'
import type { SessionState, TwoFactorSetupState } from '../../types/auth'

type AccessWorkspaceProps = {
  actionState: Record<string, boolean>
  activationCode: string
  backupCodes: string[]
  disableCode: string
  enablePassword: string
  lastResponse: string
  session: SessionState
  twoFactorSetup: TwoFactorSetupState | null
  onActivationCodeChange: (value: string) => void
  onDisableCodeChange: (value: string) => void
  onEnablePasswordChange: (value: string) => void
  onEnableSubmit: (event: FormEvent<HTMLFormElement>) => void
  onActivateSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDisableSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AccessWorkspace({
  actionState,
  activationCode,
  backupCodes,
  disableCode,
  enablePassword,
  lastResponse,
  session,
  twoFactorSetup,
  onActivationCodeChange,
  onDisableCodeChange,
  onEnablePasswordChange,
  onEnableSubmit,
  onActivateSubmit,
  onDisableSubmit,
}: AccessWorkspaceProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Двухфакторная защита</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Управление секретом, подтверждением и резервными кодами для текущего аккаунта.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <form className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4" onSubmit={onEnableSubmit}>
            <div>
              <p className="text-sm font-medium text-white">Подготовить 2FA</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">Получение QR-кода и секрета через API.</p>
            </div>
            <SettingsField
              label="Текущий пароль"
              value={enablePassword}
              onChange={onEnablePasswordChange}
              placeholder="Введите пароль"
              type="password"
            />
            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
              {actionState.enable2fa ? 'Подготовка...' : 'Получить QR-код'}
            </button>
          </form>

          <form className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4" onSubmit={onActivateSubmit}>
            <div>
              <p className="text-sm font-medium text-white">Активировать 2FA</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">Подтвердите код из приложения-аутентификатора.</p>
            </div>
            <SettingsField
              label="Код подтверждения"
              value={activationCode}
              onChange={onActivationCodeChange}
              placeholder="Введите код"
            />
            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
              {actionState.activate2fa ? 'Подтверждение...' : 'Активировать'}
            </button>
          </form>

          <form className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4" onSubmit={onDisableSubmit}>
            <div>
              <p className="text-sm font-medium text-white">Отключить 2FA</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">Используйте код из приложения или резервный код.</p>
            </div>
            <SettingsField
              label="Код отключения"
              value={disableCode}
              onChange={onDisableCodeChange}
              placeholder="Введите код"
            />
            <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
              {actionState.disable2fa ? 'Отключение...' : 'Отключить'}
            </button>
          </form>

          <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
            <p className="text-sm font-medium text-white">Состояние защиты</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              {session.twoFactorEnabled ? 'Для аккаунта включена двухфакторная защита.' : '2FA пока не активирована.'}
            </p>
            {twoFactorSetup ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white px-4 py-4">
                  <img
                    alt="QR-код 2FA"
                    className="mx-auto h-40 w-40 rounded-xl object-contain"
                    src={`data:image/png;base64,${twoFactorSetup.qrCode}`}
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs leading-6 text-zinc-400">
                  Секрет: {twoFactorSetup.secret}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
                После подготовки здесь появятся QR-код и секрет для подключения.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-white/10 bg-black/30 p-4">
          <p className="text-sm font-medium text-white">Резервные коды</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {backupCodes.length > 0 ? (
              backupCodes.map((code) => (
                <div key={code} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-zinc-200">
                  {code}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500 sm:col-span-2 lg:col-span-3">
                Резервные коды появятся после успешной активации 2FA.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Последний ответ API</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">Живой вывод по действиям авторизации и безопасности.</p>
        <pre className="mt-6 min-h-[520px] overflow-auto rounded-[24px] border border-white/10 bg-black/40 p-4 text-xs leading-6 text-zinc-300">
          {lastResponse}
        </pre>
      </div>
    </section>
  )
}

type SettingsFieldProps = {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  type?: string
}

function SettingsField({ label, value, placeholder, onChange, type = 'text' }: SettingsFieldProps) {
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
