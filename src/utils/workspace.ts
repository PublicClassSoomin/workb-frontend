const KEY = 'workb-workspace-id'
const LEGACY_KEY = 'workb-current-workspace-id'
export const WORKSPACE_CHANGED_EVENT = 'workb-workspace-changed'

/**
 * 현재 선택된 워크스페이스 numeric id를 반환.
 * - 아직 백엔드 워크스페이스 목록 API가 없어서, 기본값은 1.
 */
export function getCurrentWorkspaceId(): number {
  const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? n : 1
}

export function setCurrentWorkspaceId(id: number): void {
  if (!Number.isFinite(id) || id <= 0) return
  localStorage.setItem(KEY, String(id))
  localStorage.setItem(LEGACY_KEY, String(id))
  // 같은 탭에서는 storage 이벤트가 안 떠서 커스텀 이벤트로 통지
  window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGED_EVENT, { detail: { id } }))
}
