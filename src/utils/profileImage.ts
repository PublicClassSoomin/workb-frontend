import { useEffect, useState } from 'react'

export const PROFILE_IMAGE_CHANGED_EVENT = 'workb-profile-image-changed'

function getProfileImageKey(userId: number | undefined): string {
  return `workb-profile-image-${userId ?? 'guest'}`
}

export function getProfileImage(userId: number | undefined): string {
  const key = getProfileImageKey(userId)
  const stored = sessionStorage.getItem(key) ?? localStorage.getItem(key)

  if (stored) {
    sessionStorage.setItem(key, stored)
    localStorage.removeItem(key)
  }

  return stored ?? ''
}

export function setProfileImage(userId: number | undefined, profileImage: string): void {
  const key = getProfileImageKey(userId)

  if (profileImage) {
    sessionStorage.setItem(key, profileImage)
  } else {
    sessionStorage.removeItem(key)
  }

  localStorage.removeItem(key)
  window.dispatchEvent(
    new CustomEvent(PROFILE_IMAGE_CHANGED_EVENT, {
      detail: { userId, profileImage },
    }),
  )
}

export function useProfileImage(userId: number | undefined): string {
  const [profileImage, setProfileImageState] = useState(() => getProfileImage(userId))

  useEffect(() => {
    setProfileImageState(getProfileImage(userId))

    function handleProfileImageChanged(event: Event) {
      const detail = (event as CustomEvent<{ userId: number | undefined; profileImage: string }>).detail
      if (detail?.userId === userId) {
        setProfileImageState(detail.profileImage)
      }
    }

    window.addEventListener(PROFILE_IMAGE_CHANGED_EVENT, handleProfileImageChanged)
    return () => window.removeEventListener(PROFILE_IMAGE_CHANGED_EVENT, handleProfileImageChanged)
  }, [userId])

  return profileImage
}
