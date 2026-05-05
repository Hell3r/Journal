import { apiRequest } from './api'
import type { CustomerRecord } from '../types/domain'

export function getCustomers(token: string) {
  return apiRequest<CustomerRecord[]>('/v1/customers/', {
    method: 'GET',
    token,
  })
}

export function createCustomer(
  payload: {
    name_of_org: string
    email: string
  },
  token: string
) {
  return apiRequest<CustomerRecord>('/v1/customers/', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}
