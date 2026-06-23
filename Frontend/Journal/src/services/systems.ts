import { apiRequest } from './api'
import type { SystemRecord, TypeOfWorkRecord } from '../types/domain'

type SystemCreatePayload = {
  name: string
}

type SystemUpdatePayload = Partial<SystemCreatePayload>

type TypeOfWorkCreatePayload = {
  name: string
}

type TypeOfWorkUpdatePayload = Partial<TypeOfWorkCreatePayload>

export function getSystems(token?: string) {
  return apiRequest<SystemRecord[]>('/v1/systems/', {
    method: 'GET',
    token,
  })
}

export function createSystem(payload: SystemCreatePayload, token?: string) {
  return apiRequest<SystemRecord>('/v1/systems/', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function updateSystem(systemId: number, payload: SystemUpdatePayload, token?: string) {
  return apiRequest<SystemRecord>(`/v1/systems/${systemId}`, {
    method: 'PATCH',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteSystem(systemId: number, token?: string) {
  return apiRequest<void>(`/v1/systems/${systemId}`, {
    method: 'DELETE',
    token,
  })
}

export function addSystemToAddress(systemId: number, addressId: number, token?: string) {
  return apiRequest<SystemRecord['addresses'][number]>(`/v1/systems/${systemId}/addresses/${addressId}`, {
    method: 'POST',
    token,
  })
}

export function removeSystemFromAddress(systemId: number, addressId: number, token?: string) {
  return apiRequest<void>(`/v1/systems/${systemId}/addresses/${addressId}`, {
    method: 'DELETE',
    token,
  })
}

export function getTypesOfWorks(token?: string) {
  return apiRequest<TypeOfWorkRecord[]>('/v1/types-of-works/', {
    method: 'GET',
    token,
  })
}

export function createTypeOfWork(payload: TypeOfWorkCreatePayload, token?: string) {
  return apiRequest<TypeOfWorkRecord>('/v1/types-of-works/', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function updateTypeOfWork(typeOfWorkId: number, payload: TypeOfWorkUpdatePayload, token?: string) {
  return apiRequest<TypeOfWorkRecord>(`/v1/types-of-works/${typeOfWorkId}`, {
    method: 'PATCH',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteTypeOfWork(typeOfWorkId: number, token?: string) {
  return apiRequest<void>(`/v1/types-of-works/${typeOfWorkId}`, {
    method: 'DELETE',
    token,
  })
}
