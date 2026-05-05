import { apiRequest } from './api'
import type { CuratorRequestRecord } from '../types/domain'

export function getCuratorRequests(token: string) {
  return apiRequest<CuratorRequestRecord[]>('/v1/curators/', {
    method: 'GET',
    token,
  })
}

export function createCuratorRequest(customerId: number, token: string) {
  return apiRequest<CuratorRequestRecord>('/v1/curators/', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customer_id: customerId }),
  })
}

export function activateCuratorRequest(curatorId: number, token: string) {
  return apiRequest<CuratorRequestRecord>(`/v1/curators/${curatorId}/activate`, {
    method: 'PATCH',
    token,
  })
}
