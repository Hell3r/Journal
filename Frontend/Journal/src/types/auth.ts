export type UserSessionInfo = {
  username: string
  email: string
  user_id: number
  role: string
  is_active: boolean
  date_joined: string
}

export type SessionState = {
  token: string
  user: UserSessionInfo
  twoFactorEnabled: boolean
}

export type PendingTwoFactorState = {
  tempToken: string
  username: string
}

export type TwoFactorSetupState = {
  secret: string
  qrCode: string
  message: string
}

export type AuthStatusTone = 'neutral' | 'success' | 'danger'

export type LoginSuccessResponse = {
  access_token: string
  token_type: string
  user_info: UserSessionInfo
}

export type LoginTwoFactorResponse = {
  '2fa_required': true
  temp_token: string
  message: string
}
