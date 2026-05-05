import { apiRequest } from './api'
import type { ContractorRecord } from '../types/domain'

export function getContractors(token: string) {
  return apiRequest<ContractorRecord[]>('/v1/contractors/', {
    method: 'GET',
    token,
  })
}

export function createContractor(
  payload: {
    name_of_contractor: string
    engineer_id?: number | null
    is_active?: boolean
  },
  token: string
) {
  return apiRequest<ContractorRecord>('/v1/contractors/', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}
