const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api'

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

async function request<T>(method: Method, path: string, body?: unknown, token?: string): Promise<{ data: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json
}

export const api = {
  get: <T = any>(path: string, token?: string) =>
    request<T>('GET', path, undefined, token),
  post: <T = any>(path: string, body: unknown, token?: string) =>
    request<T>('POST', path, body, token),
  patch: <T = any>(path: string, body: unknown, token?: string) =>
    request<T>('PATCH', path, body, token),
}
