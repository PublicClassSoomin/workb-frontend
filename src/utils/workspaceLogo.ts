import { useEffect, useState } from 'react'

export const DEFAULT_WORKSPACE_LOGO_URL = '/brand/workb-logo.png'
export const WORKSPACE_LOGO_CHANGED_EVENT = 'workb-workspace-logo-changed'

function getWorkspaceLogoKey(workspaceId: number): string {
  return `workb-workspace-logo-${workspaceId}`
}

export function getWorkspaceLogoUrl(workspaceId: number): string {
  if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
    return DEFAULT_WORKSPACE_LOGO_URL
  }

  const key = getWorkspaceLogoKey(workspaceId)
  const stored = sessionStorage.getItem(key) ?? localStorage.getItem(key)

  if (stored) {
    sessionStorage.setItem(key, stored)
    localStorage.removeItem(key)
    return stored
  }

  return DEFAULT_WORKSPACE_LOGO_URL
}

export function setWorkspaceLogoUrl(workspaceId: number, logoUrl: string | null): void {
  if (!Number.isFinite(workspaceId) || workspaceId <= 0) return

  const key = getWorkspaceLogoKey(workspaceId)
  const nextLogoUrl = logoUrl || DEFAULT_WORKSPACE_LOGO_URL

  if (logoUrl && logoUrl !== DEFAULT_WORKSPACE_LOGO_URL) {
    sessionStorage.setItem(key, logoUrl)
  } else {
    sessionStorage.removeItem(key)
  }

  localStorage.removeItem(key)
  window.dispatchEvent(
    new CustomEvent(WORKSPACE_LOGO_CHANGED_EVENT, {
      detail: { workspaceId, logoUrl: nextLogoUrl },
    }),
  )
}

export function clearWorkspaceLogoUrl(workspaceId: number): void {
  setWorkspaceLogoUrl(workspaceId, null)
}

export function useWorkspaceLogo(workspaceId: number): string {
  const [logoUrl, setLogoUrl] = useState(() => getWorkspaceLogoUrl(workspaceId))

  useEffect(() => {
    setLogoUrl(getWorkspaceLogoUrl(workspaceId))

    function handleLogoChanged(event: Event) {
      const detail = (event as CustomEvent<{ workspaceId: number; logoUrl: string }>).detail
      if (detail?.workspaceId === workspaceId) {
        setLogoUrl(detail.logoUrl || DEFAULT_WORKSPACE_LOGO_URL)
      }
    }

    window.addEventListener(WORKSPACE_LOGO_CHANGED_EVENT, handleLogoChanged)
    return () => window.removeEventListener(WORKSPACE_LOGO_CHANGED_EVENT, handleLogoChanged)
  }, [workspaceId])

  return logoUrl
}
