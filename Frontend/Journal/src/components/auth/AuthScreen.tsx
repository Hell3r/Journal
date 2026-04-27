import { useState, type FormEvent } from 'react'
import { loginUser, verifyTwoFactorLogin } from '../../services/auth'
import type {
  AuthStatusTone,
  LoginSuccessResponse,
  LoginTwoFactorResponse,
  PendingTwoFactorState,
  SessionState,
} from '../../types/auth'

type AuthScreenProps = {
  pendingTwoFactor: PendingTwoFactorState | null
  statusMessage: string
  statusTone: AuthStatusTone
  lastResponse: string
  onSessionChange: (session: SessionState | null) => void
  onPendingTwoFactorChange: (state: PendingTwoFactorState | null) => void
  onStatusMessageChange: (message: string) => void
  onStatusToneChange: (tone: AuthStatusTone) => void
  onLastResponseChange: (value: string) => void
}

export function AuthScreen({
  pendingTwoFactor,
  statusMessage,
  statusTone,
  lastResponse,
  onSessionChange,
  onPendingTwoFactorChange,
  onStatusMessageChange,
  onStatusToneChange,
  onLastResponseChange,
}: AuthScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const statusClassName =
    statusTone === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
      : statusTone === 'danger'
        ? 'border-red-500/30 bg-red-500/10 text-red-100'
        : 'border-white/10 bg-white/5 text-zinc-200'

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Не удалось выполнить авторизацию.'
    onStatusMessageChange(message)
    onStatusToneChange('danger')
    onLastResponseChange(message)
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await loginUser({ username, password }) as LoginSuccessResponse | LoginTwoFactorResponse

      if ('2fa_required' in response && response['2fa_required']) {
        onPendingTwoFactorChange({
          tempToken: response.temp_token,
          username,
        })
        onStatusMessageChange('Введите код из приложения-аутентификатора для завершения входа.')
        onStatusToneChange('neutral')
        onLastResponseChange(JSON.stringify(response, null, 2))
        return
      }

      onSessionChange({
        token: response.access_token,
        user: response.user_info,
        twoFactorEnabled: false,
      })
      onPendingTwoFactorChange(null)
      onStatusMessageChange(`Вход выполнен. Добро пожаловать, ${response.user_info.username}.`)
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pendingTwoFactor) {
      return
    }

    setLoading(true)

    try {
      const response = await verifyTwoFactorLogin({
        temp_token: pendingTwoFactor.tempToken,
        code,
      }) as LoginSuccessResponse

      onSessionChange({
        token: response.access_token,
        user: response.user_info,
        twoFactorEnabled: true,
      })
      onPendingTwoFactorChange(null)
      onStatusMessageChange(`Код подтверждён. Добро пожаловать, ${response.user_info.username}.`)
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
      setCode('')
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[460px_minmax(0,1fr)]">
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#090909_50%,#050505_100%)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-zinc-300">
                Электронный журнал
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-none sm:text-5xl">Авторизация</h1>
                <p className="max-w-sm text-sm leading-6 text-zinc-400">
                  Первый экран приложения. Вход выполняется через API, а при включенной защите сразу подключается двухфакторная проверка.
                </p>
              </div>
              <div className={`rounded-3xl border p-4 text-sm leading-6 ${statusClassName}`}>{statusMessage}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FeatureCard title="JWT-сессия" text="После входа открывается основное рабочее пространство." />
              <FeatureCard title="2FA-поток" text="Поддерживаются одноразовые и резервные коды." />
              <FeatureCard title="Тёмный интерфейс" text="Минималистичный стиль без лишнего шума." />
              <FeatureCard title="API-first" text="Фронт работает через бэкенд, а не напрямую с БД." />
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">
                {pendingTwoFactor ? 'Подтверждение входа' : 'Вход в систему'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {pendingTwoFactor
                  ? `Для пользователя ${pendingTwoFactor.username} требуется код из приложения-аутентификатора.`
                  : 'Введите username и пароль, чтобы открыть рабочее приложение.'}
              </p>
            </div>

            {!pendingTwoFactor ? (
              <form className="grid gap-4" onSubmit={handleLogin}>
                <AuthField
                  label="Имя пользователя"
                  placeholder="Введите username"
                  value={username}
                  onChange={setUsername}
                />
                <AuthField
                  label="Пароль"
                  placeholder="Введите пароль"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
                  {loading ? 'Выполняется вход...' : 'Открыть приложение'}
                </button>
              </form>
            ) : (
              <form className="grid gap-4" onSubmit={handleVerifyTwoFactor}>
                <AuthField
                  label="Код подтверждения"
                  placeholder="Введите одноразовый код"
                  value={code}
                  onChange={setCode}
                />
                <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
                  {loading ? 'Проверка кода...' : 'Подтвердить вход'}
                </button>
                <button
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  onClick={() => onPendingTwoFactorChange(null)}
                  type="button"
                >
                  Вернуться к логину
                </button>
              </form>
            )}
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Последний ответ API</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">Полезно для быстрой проверки ответов во время настройки.</p>
              </div>
            </div>
            <pre className="min-h-[260px] overflow-auto rounded-[24px] border border-white/10 bg-black/40 p-4 text-xs leading-6 text-zinc-300">
              {lastResponse}
            </pre>
          </div>
        </section>
      </div>
    </div>
  )
}

type AuthFieldProps = {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  type?: string
}

function AuthField({ label, value, placeholder, onChange, type = 'text' }: AuthFieldProps) {
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

type FeatureCardProps = {
  title: string
  text: string
}

function FeatureCard({ title, text }: FeatureCardProps) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{text}</p>
    </div>
  )
}
