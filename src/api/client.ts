// src/api/client.ts
import { getApiV1BaseUrl } from './baseUrl'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${getApiV1BaseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail ?? `API 오류: ${res.status}`)
  }
  return res.json()
}
