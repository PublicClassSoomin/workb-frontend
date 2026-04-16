// src/api/client.ts
const BASE_URL = 'http://workb-backend-production.up.railway.app/api/v1'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail ?? `API 오류: ${res.status}`)
  }
  return res.json()
}
