import { apiRequest } from './api'

export function checkHealth() {
  return apiRequest<{ message: string }>('/v1/health')
}

export function checkDatabase() {
  return apiRequest<{ status: string; message: string; database?: string }>('/v1/health/db_check')
}

export function setupDatabase() {
  return apiRequest<{ message: string }>('/v1/health/setup_db', {
    method: 'POST',
  })
}
