import { apiRequest } from './api'
import type { AddressRecord } from '../types/domain'

export function getAddresses(token: string, customerId?: number) {
  const query = customerId ? `?customer_id=${customerId}` : ''
  return apiRequest<AddressRecord[]>(`/v1/addresses/${query}`, {
    method: 'GET',
    token,
  })
}

export function createAddress(
  payload: {
    address_name: string
    customer_id: number
  },
  token: string
) {
  return apiRequest<AddressRecord>('/v1/addresses/', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}
