import { apiRequest } from './api'
import type { CustomerRecord } from '../types/domain'

type CustomerCreatePayload = {
  name_of_org: string
  email: string
}

type CustomerUpdatePayload = Partial<CustomerCreatePayload>

export function getCustomers(token?: string) {
  return apiRequest<CustomerRecord[]>('/v1/customers/', {
    method: 'GET',
    token,
  })
}

export function getCustomer(customerId: number, token?: string) {
  return apiRequest<CustomerRecord>(`/v1/customers/${customerId}`, {
    method: 'GET',
    token,
  })
}

export function createCustomer(payload: CustomerCreatePayload, token?: string) {
  return apiRequest<CustomerRecord>('/v1/customers/', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function updateCustomer(customerId: number, payload: CustomerUpdatePayload, token?: string) {
  return apiRequest<CustomerRecord>(`/v1/customers/${customerId}`, {
    method: 'PATCH',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function deleteCustomer(customerId: number, token?: string) {
  return apiRequest<void>(`/v1/customers/${customerId}`, {
    method: 'DELETE',
    token,
  })
}

export function activateCustomer(customerId: number, token?: string) {
  return apiRequest<CustomerRecord>(`/v1/customers/${customerId}/activate`, {
    method: 'PATCH',
    token,
  })
}
