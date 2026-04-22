function normalizeOrigin(raw: string): string {
  let base = raw.trim().replace(/\/+$/, '')

  // Some setups mistakenly include the API prefix in the base URL.
  // Our callers append `/api/v1` themselves, so strip it if present.
  base = base.replace(/\/api\/v1$/i, '')

  return base
}

export function getApiOrigin(): string {
  const raw =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.VITE_API_URL as string | undefined)

  if (!raw || !raw.trim()) {
    throw new Error('VITE_API_BASE_URL is not set')
  }

  return normalizeOrigin(raw)
}

export function getApiV1BaseUrl(): string {
  return `${getApiOrigin()}/api/v1`
}

