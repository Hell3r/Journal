import { apiRequest } from './api'
import type { WorkRecord } from '../types/domain'

type WorkCreatePayload = {
  address_id: number
  type_of_work_id: number
  technician_id: number
  description?: string | null
}

type WorkUpdatePayload = Partial<WorkCreatePayload>

export function getWorks(token?: string, addressId?: number) {
  const query = addressId ? `?address_id=${addressId}` : ''
  return apiRequest<WorkRecord[]>(`/v1/works/${query}`, {
    method: 'GET',
    token,
  })
}

export function createWork(payload: WorkCreatePayload, token?: string) {
  return apiRequest<WorkRecord>('/v1/works/', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function updateWork(workId: number, payload: WorkUpdatePayload, token?: string) {
  return apiRequest<WorkRecord>(`/v1/works/${workId}`, {
    method: 'PATCH',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteWork(workId: number, token?: string) {
  return apiRequest<void>(`/v1/works/${workId}`, {
    method: 'DELETE',
    token,
  })
}
