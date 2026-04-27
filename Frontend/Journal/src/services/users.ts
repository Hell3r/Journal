import { apiRequest } from './api'
import type { UserRecord } from '../types/users'

export function getUsers(token: string) {
  return apiRequest<UserRecord[]>('/v1/users', {
    method: 'GET',
    token,
  })
}
