import { apiRequest } from './api'
import type { TechnicianAssignmentRecord } from '../types/domain'

type TechnicianAssignmentCreatePayload = {
  contractor_id: number
  address_id?: number | null
  technician_id: number
}

export function getTechnicianAssignments(token?: string, filters?: { contractorId?: number; addressId?: number; technicianId?: number }) {
  const params = new URLSearchParams()
  if (filters?.contractorId) params.set('contractor_id', String(filters.contractorId))
  if (filters?.addressId) params.set('address_id', String(filters.addressId))
  if (filters?.technicianId) params.set('technician_id', String(filters.technicianId))
  const query = params.toString()
  return apiRequest<TechnicianAssignmentRecord[]>(`/v1/technician-contractors/${query ? `?${query}` : ''}`, {
    method: 'GET',
    token,
  })
}

export function createTechnicianAssignment(payload: TechnicianAssignmentCreatePayload, token?: string) {
  return apiRequest<TechnicianAssignmentRecord>('/v1/technician-contractors/', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteTechnicianAssignment(assignmentId: number, token?: string) {
  return apiRequest<void>(`/v1/technician-contractors/${assignmentId}`, {
    method: 'DELETE',
    token,
  })
}
