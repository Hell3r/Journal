import { apiRequest } from './api'
import type { AddressRecord } from '../types/domain'

type AddressCreatePayload = {
  address_name: string
  customer_id: number
}

type AddressUpdatePayload = {
  address_name?: string
}

export function getAddresses(token?: string, customerId?: number) {
  const query = customerId ? `?customer_id=${customerId}` : ''
  return apiRequest<AddressRecord[]>(`/v1/addresses/${query}`, {
    method: 'GET',
    token,
  })
}

export function getAddress(addressId: number, token?: string) {
  return apiRequest<AddressRecord>(`/v1/addresses/${addressId}`, {
    method: 'GET',
    token,
  })
}

export function createAddress(payload: AddressCreatePayload, token?: string) {
  return apiRequest<AddressRecord>('/v1/addresses/', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function updateAddress(addressId: number, payload: AddressUpdatePayload, token?: string) {
  return apiRequest<AddressRecord>(`/v1/addresses/${addressId}`, {
    method: 'PATCH',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function deleteAddress(addressId: number, token?: string) {
  return apiRequest<void>(`/v1/addresses/${addressId}`, {
    method: 'DELETE',
    token,
  })
}
