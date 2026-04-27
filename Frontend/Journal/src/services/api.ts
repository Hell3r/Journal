export const BASE_API_URL = 'http://127.0.0.1:8000'

type RequestOptions = RequestInit & {
  token?: string
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const { headers, token, ...rest } = options
  const response = await fetch(`${BASE_API_URL}${path}`, {
    ...rest,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    if (typeof payload === 'object' && payload && 'detail' in payload) {
      throw new Error(String(payload.detail))
    }

    throw new Error(typeof payload === 'string' ? payload : 'Не удалось выполнить запрос к API')
  }

  return payload as T
}
