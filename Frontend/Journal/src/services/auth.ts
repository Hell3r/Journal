import { apiRequest } from './api'

type RegisterPayload = {
  username: string
  email: string
  phone: string
  role: string
  password: string
  is_active: boolean
  contractor_id: number | null
}

type LoginPayload = {
  username: string
  password: string
}

type TwoFactorPayload = {
  temp_token: string
  code: string
}

export function registerUser(payload: RegisterPayload) {
  return apiRequest('/v1/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function loginUser(payload: LoginPayload) {
  const body = new URLSearchParams()
  body.set('username', payload.username)
  body.set('password', payload.password)

  return apiRequest('/v1/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
}

export function verifyTwoFactorLogin(payload: TwoFactorPayload) {
  return apiRequest('/v1/users/login/2fa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function logoutUser(token: string) {
  return apiRequest('/v1/users/logout', {
    method: 'POST',
    token,
  })
}

export function enableTwoFactor(password: string, token: string) {
  return apiRequest('/v1/users/2fa/enable', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  })
}

export function verifyAndActivateTwoFactor(code: string, token: string) {
  return apiRequest('/v1/users/2fa/verify-and-activate', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })
}

export function disableTwoFactor(code: string, token: string) {
  return apiRequest('/v1/users/2fa/disable', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })
}
