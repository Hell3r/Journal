import { apiRequest } from './api'
import type { AddressRecord, ContractorRecord } from '../types/domain'

type ContractorCreatePayload = {
  name_of_contractor: string
  engineer_id?: number | null
  is_active?: boolean
}

type ContractorUpdatePayload = Partial<ContractorCreatePayload>

export function getContractors(token?: string) {
  return apiRequest<ContractorRecord[]>('/v1/contractors/', {
    method: 'GET',
    token,
  })
}

export function getContractor(contractorId: number, token?: string) {
  return apiRequest<ContractorRecord>(`/v1/contractors/${contractorId}`, {
    method: 'GET',
    token,
  })
}

export function createContractor(payload: ContractorCreatePayload, token?: string) {
  return apiRequest<ContractorRecord>('/v1/contractors/', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function updateContractor(contractorId: number, payload: ContractorUpdatePayload, token?: string) {
  return apiRequest<ContractorRecord>(`/v1/contractors/${contractorId}`, {
    method: 'PATCH',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function deleteContractor(contractorId: number, token?: string) {
  return apiRequest<void>(`/v1/contractors/${contractorId}`, {
    method: 'DELETE',
    token,
  })
}

export function addAddressToContractor(contractorId: number, addressId: number, token?: string) {
  return apiRequest<{ detail: string }>(`/v1/contractors/${contractorId}/addresses/${addressId}`, {
    method: 'POST',
    token,
  })
}

export function removeAddressFromContractor(contractorId: number, addressId: number, token?: string) {
  return apiRequest<void>(`/v1/contractors/${contractorId}/addresses/${addressId}`, {
    method: 'DELETE',
    token,
  })
}

export function listAddressesOfContractor(contractorId: number, token?: string) {
  return apiRequest<Array<Pick<AddressRecord, 'id' | 'address_name'>>>(`/v1/contractors/${contractorId}/addresses`, {
    method: 'GET',
    token,
  })
}

export function listContractorsOfAddress(addressId: number, token?: string) {
  return apiRequest<Array<Pick<ContractorRecord, 'id' | 'name_of_contractor'>>>(
    `/v1/contractors/addresses/${addressId}/contractors`,
    {
      method: 'GET',
      token,
    }
  )
}
