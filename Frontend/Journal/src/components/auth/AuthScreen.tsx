import { useState, type FormEvent } from 'react'
import { loginUser, registerUser, verifyTwoFactorLogin } from '../../services/auth'
import type {
  AuthStatusTone,
  LoginSuccessResponse,
  LoginTwoFactorResponse,
  PendingTwoFactorState,
  SessionState,
} from '../../types/auth'

function isLoginTwoFactorResponse(
  response: LoginSuccessResponse | LoginTwoFactorResponse
): response is LoginTwoFactorResponse {
  return '2fa_required' in response && response['2fa_required'] === true
}

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

type AuthMode = 'login' | 'register'

export function AuthScreen({
  pendingTwoFactor,
  statusMessage,
  statusTone,
  onSessionChange,
  onPendingTwoFactorChange,
  onStatusMessageChange,
  onStatusToneChange,
  onLastResponseChange,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const statusClassName =
    statusTone === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
      : statusTone === 'danger'
        ? 'border-red-500/30 bg-red-500/10 text-red-100'
        : 'border-white/10 bg-white/5 text-zinc-200'

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Не удалось выполнить запрос.'
    onStatusMessageChange(message)
    onStatusToneChange('danger')
    onLastResponseChange(message)
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await loginUser({ username, password })

      if (isLoginTwoFactorResponse(response)) {
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
      onStatusMessageChange(`Вход выполнен. Добро пожаловать, ${response.user_info.name ?? response.user_info.username}.`)
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
      })

      onSessionChange({
        token: response.access_token,
        user: response.user_info,
        twoFactorEnabled: true,
      })
      onPendingTwoFactorChange(null)
      onStatusMessageChange(`Код подтверждён. Добро пожаловать, ${response.user_info.name ?? response.user_info.username}.`)
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
      setCode('')
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await registerUser({
        name: registerName,
        username: registerUsername,
        email: registerEmail,
        phone: registerPhone,
        password: registerPassword,
        role: 'user',
        is_active: true,
        contractor_id: null,
      })

      onStatusMessageChange('Аккаунт создан. После входа откроется обычный кабинет пользователя.')
      onStatusToneChange('success')
      onLastResponseChange(JSON.stringify(response, null, 2))
      setMode('login')
      setUsername(registerUsername)
      setPassword(registerPassword)
      setRegisterName('')
      setRegisterUsername('')
      setRegisterEmail('')
      setRegisterPhone('')
      setRegisterPassword('')
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] px-2 py-2 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-1rem)] max-w-[980px] items-center justify-center gap-3 lg:grid-cols-[340px_400px] lg:items-stretch">
        <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#090909_50%,#050505_100%)] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-5 lg:h-[710px]">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="flex h-full flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-zinc-300">
                Электронный журнал
              </div>
              <div className="space-y-2">
                <h1 className="text-[26px] font-semibold leading-none sm:text-[30px]">Авторизация и регистрация</h1>
                <p className="max-w-sm text-[12px] leading-5 text-zinc-400">
                  Вход в систему выполняется через API с поддержкой двухфакторной проверки, а новые пользователи могут сразу создать аккаунт по своей роли.
                </p>
              </div>
              <div className={`rounded-[24px] border p-3 text-[12px] leading-5 ${statusClassName}`}>{statusMessage}</div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <FeatureCard title="Роль куратора" text="Работа с организациями, адресами, подрядчиками и инженерами." />
              <FeatureCard title="Роль инженера" text="Подрядные организации, объекты, техники и история работ." />
              <FeatureCard title="Роль техника" text="Ограниченный доступ к объекту и журналу обслуживания." />
              <FeatureCard title="2FA-поддержка" text="Подтверждение входа и управление защитой из личного кабинета." />
            </div>
          </div>
        </section>

        <section className="flex h-full items-stretch justify-center">
          <div className="flex h-full w-full max-w-[400px] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#0b0b0c] shadow-[0_20px_70px_rgba(0,0,0,0.35)] lg:h-[710px]">
            <div className="border-b border-white/10 p-2">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.03] p-1">
                <button
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${mode === 'login' ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/[0.04]'}`}
                  onClick={() => setMode('login')}
                  type="button"
                >
                  Вход
                </button>
                <button
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${mode === 'register' ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/[0.04]'}`}
                  onClick={() => setMode('register')}
                  type="button"
                >
                  Регистрация
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden p-3 sm:p-4">
              <div className={`absolute inset-0 flex h-full flex-col overflow-y-auto p-3 transition duration-300 sm:p-4 ${mode === 'login' || pendingTwoFactor ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0 pointer-events-none'}`}>
                <div className="mb-3">
                  <h2 className="text-[18px] font-semibold text-white sm:text-[20px]">
                    {pendingTwoFactor ? 'Подтверждение входа' : 'Вход в систему'}
                  </h2>
                  <p className="mt-1 text-[12px] leading-5 text-zinc-500">
                    {pendingTwoFactor
                      ? `Для пользователя ${pendingTwoFactor.username} требуется код из приложения-аутентификатора.`
                      : 'Введите username и пароль, чтобы открыть личный кабинет по своей роли.'}
                  </p>
                </div>

                {!pendingTwoFactor ? (
                  <form className="grid gap-2.5" onSubmit={handleLogin}>
                    <AuthField label="Имя пользователя" placeholder="Введите username" value={username} onChange={setUsername} />
                    <AuthField label="Пароль" placeholder="Введите пароль" type="password" value={password} onChange={setPassword} />
                    <button className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200">
                      {loading ? 'Выполняется вход...' : 'Открыть приложение'}
                    </button>
                    <button
                      className="pb-1 text-left text-[12px] text-zinc-500 transition hover:text-zinc-300"
                      onClick={() => setMode('register')}
                      type="button"
                    >
                      Нет аккаунта? зарегистрироваться
                    </button>
                  </form>
                ) : (
                  <form className="grid gap-2.5" onSubmit={handleVerifyTwoFactor}>
                    <AuthField label="Код подтверждения" placeholder="Введите одноразовый код" value={code} onChange={setCode} />
                    <button className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200">
                      {loading ? 'Проверка кода...' : 'Подтвердить вход'}
                    </button>
                    <button
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      onClick={() => onPendingTwoFactorChange(null)}
                      type="button"
                    >
                      Вернуться к логину
                    </button>
                  </form>
                )}
              </div>

              <div className={`absolute inset-0 flex h-full flex-col overflow-y-auto p-3 transition duration-300 sm:p-4 ${mode === 'register' && !pendingTwoFactor ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0 pointer-events-none'}`}>
                <div className="mb-3">
                  <h2 className="text-[18px] font-semibold text-white sm:text-[20px]">Регистрация аккаунта</h2>
                  <p className="mt-1 text-[12px] leading-5 text-zinc-500">
                    Создайте учётную запись для продолжения работы.
                  </p>
                </div>

                <form className="grid gap-2.5" onSubmit={handleRegister}>
                  <AuthField
                    label="Имя"
                    placeholder="Введите имя"
                    value={registerName}
                    onChange={setRegisterName}
                  />
                  <AuthField
                    label="Логин"
                    placeholder="Введите username"
                    value={registerUsername}
                    onChange={setRegisterUsername}
                  />
                  <AuthField
                    label="Email"
                    placeholder="Введите email"
                    type="email"
                    value={registerEmail}
                    onChange={setRegisterEmail}
                  />
                  <AuthField
                    label="Телефон"
                    placeholder="Введите телефон"
                    value={registerPhone}
                    onChange={setRegisterPhone}
                  />
                 
                  <AuthField
                    label="Пароль"
                    placeholder="Создайте пароль"
                    type="password"
                    value={registerPassword}
                    onChange={setRegisterPassword}
                  />
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] leading-5 text-zinc-400">
                    При регистрации создаётся обычный пользователь. Роль назначается позже администратором.
                  </div>
                  <button className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200">
                    {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
                  </button>
                  <button
                    className="pb-1 text-left text-[12px] text-zinc-500 transition hover:text-zinc-300"
                    onClick={() => setMode('login')}
                    type="button"
                  >
                    Уже есть аккаунт? войти
                  </button>
                </form>
              </div>
            </div>
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
    <label className="grid gap-1 text-sm text-zinc-300">
      <span>{label}</span>
      <input
        className="h-10 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
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
    <div className="rounded-[20px] border border-white/10 bg-black/25 p-3">
      <p className="text-[13px] font-medium text-white">{title}</p>
      <p className="mt-1 text-[11px] leading-5 text-zinc-500">{text}</p>
    </div>
  )
}
