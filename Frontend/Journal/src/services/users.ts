import { apiRequest } from './api'
import type { UserRecord } from '../types/users'

type UserUpdatePayload = {
  name?: string
  username?: string
  email?: string
  phone?: string
  role?: string
  is_active?: boolean
  password?: string
}

export function getUsers(token?: string) {
  return apiRequest<UserRecord[]>('/v1/users', {
    method: 'GET',
    token,
  })
}

export function getUser(userId: number, token?: string) {
  return apiRequest<UserRecord>(`/v1/users/${userId}`, {
    method: 'GET',
    token,
  })
}

export function getCurrentUser(token?: string) {
  return apiRequest<UserRecord>('/v1/users/me', {
    method: 'GET',
    token,
  })
}

export function getAssignableUsers(token?: string) {
  return apiRequest<UserRecord[]>('/v1/users/available', {
    method: 'GET',
    token,
  })
}

export function updateUser(userId: number, payload: UserUpdatePayload, token?: string) {
  return apiRequest<UserRecord>(`/v1/users/${userId}`, {
    method: 'PATCH',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function activateUser(userId: number, token?: string) {
  return apiRequest<UserRecord>(`/v1/users/${userId}/activate`, {
    method: 'PATCH',
    token,
  })
}

export function deleteUser(userId: number, token?: string) {
  return apiRequest<void>(`/v1/users/${userId}`, {
    method: 'DELETE',
    token,
  })
}
