import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type AccentPreset = 'pink' | 'yellow' | 'green' | 'blue' | 'purple'

const STORAGE_KEY = 'workb-accent-preset'
const STORAGE_MAIN_KEY = 'workb-accent-as-main'

type AccentTokenSet = {
  accent: string
  accentForeground: string
  accentSubtle: string
  sidebarActive: string
}

type AccentPalette = {
  label: string
  swatch: string
  hue: number
  light: AccentTokenSet
  dark: AccentTokenSet
}

/** 노랑·라임 등 밝은 색은 흰 글자 대비가 나쁨 → 어두운 본문색 사용 */
function preferLightTextOnBoldMain(hue: number): boolean {
  return !(hue >= 36 && hue <= 88)
}

type BoldMainThemeVars = {
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string
  border: string
  sidebar: string
  sidebarForeground: string
  sidebarBorder: string
  sidebarHover: string
  accent: string
  accentForeground: string
  accentSubtle: string
  sidebarActive: string
}

/** 극단 메인: 원래 화이트 영역을 포인트 색으로 채우고, 본문은 라이트(또는 노랑 계열은 다크) 톤 */
function buildBoldMainTheme(palette: AccentPalette, isDark: boolean): BoldMainThemeVars {
  const h = palette.hue
  const lightText = preferLightTextOnBoldMain(h)

  if (isDark) {
    const background = `${h} 52% 7%`
    const card = `${h} 48% 10%`
    const sidebar = `${h} 55% 5%`
    const muted = `${h} 42% 12%`
    const border = `${h} 38% 20%`
    const sidebarHover = `${h} 45% 11%`
    const sidebarBorder = `${h} 42% 15%`

    const foreground = lightText ? '0 0% 98%' : '43 35% 94%'
    const cardForeground = foreground
    const sidebarForeground = lightText ? '0 0% 95%' : '43 30% 90%'
    const mutedForeground = lightText ? `${h} 18% 78%` : '220 12% 42%'

    let accent: string
    let accentForeground: string
    let accentSubtle: string
    let sidebarActive: string

    if (lightText) {
      accent = '0 0% 100%'
      accentForeground = `${h} 55% 14%`
      accentSubtle = `${h} 40% 20%`
      sidebarActive = `${h} 45% 18%`
    } else {
      accent = `${h} 85% 58%`
      accentForeground = '220 35% 8%'
      accentSubtle = `${h} 42% 16%`
      sidebarActive = `${h} 48% 16%`
    }

    return {
      background,
      foreground,
      card,
      cardForeground,
      muted,
      mutedForeground,
      border,
      sidebar,
      sidebarForeground,
      sidebarBorder,
      sidebarHover,
      accent,
      accentForeground,
      accentSubtle,
      sidebarActive,
    }
  }

  /* 라이트 테마: 밝은 파스텔 베이스 + 짙은 본문 (화이트 UI에 맞게) */
  const background = `${h} 28% 97.5%`
  const card = `${h} 32% 99.2%`
  const sidebar = `${h} 34% 95%`
  const muted = `${h} 26% 94%`
  const border = `${h} 22% 88%`
  const sidebarHover = `${h} 30% 92%`
  const sidebarBorder = `${h} 26% 90%`

  const foreground = lightText ? `${h} 32% 22%` : '220 30% 10%'
  const cardForeground = foreground
  const sidebarForeground = lightText ? `${h} 30% 20%` : '220 28% 12%'
  const mutedForeground = lightText ? `${h} 22% 40%` : '220 14% 38%'

  let accent: string
  let accentForeground: string
  let accentSubtle: string
  let sidebarActive: string

  if (lightText) {
    accent = `${h} 72% 52%`
    accentForeground = '0 0% 100%'
    accentSubtle = `${h} 38% 93%`
    sidebarActive = `${h} 36% 91%`
  } else {
    accent = `${h} 88% 46%`
    accentForeground = '220 28% 10%'
    accentSubtle = `${h} 55% 90%`
    sidebarActive = `${h} 48% 88%`
  }

  return {
    background,
    foreground,
    card,
    cardForeground,
    muted,
    mutedForeground,
    border,
    sidebar,
    sidebarForeground,
    sidebarBorder,
    sidebarHover,
    accent,
    accentForeground,
    accentSubtle,
    sidebarActive,
  }
}

/** 메인 톤 켜질 때 덮어쓰는 변수 — 끌 때 전부 제거 */
const BOLD_MAIN_KEYS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--muted',
  '--muted-foreground',
  '--border',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-border',
  '--sidebar-hover',
  '--accent',
  '--accent-foreground',
  '--accent-subtle',
  '--sidebar-active',
] as const

export const ACCENT_PALETTES: Record<AccentPreset, AccentPalette> = {
  pink: {
    label: '핑크',
    swatch: '#EC4899',
    hue: 330,
    light: {
      accent: '330 81% 60%',
      accentForeground: '0 0% 100%',
      accentSubtle: '330 86% 95%',
      sidebarActive: '330 70% 95%',
    },
    dark: {
      accent: '330 81% 60%',
      accentForeground: '0 0% 100%',
      accentSubtle: '330 34% 18%',
      sidebarActive: '330 35% 22%',
    },
  },
  yellow: {
    label: '노랑',
    swatch: '#FFB703',
    hue: 43,
    light: {
      accent: '43 100% 51%',
      accentForeground: '220 20% 12%',
      accentSubtle: '43 100% 94%',
      sidebarActive: '43 90% 93%',
    },
    dark: {
      accent: '43 100% 51%',
      accentForeground: '220 25% 8%',
      accentSubtle: '43 45% 14%',
      sidebarActive: '43 55% 16%',
    },
  },
  green: {
    label: '초록',
    swatch: '#22C55E',
    hue: 142,
    light: {
      accent: '142 71% 45%',
      accentForeground: '0 0% 100%',
      accentSubtle: '142 60% 94%',
      sidebarActive: '142 52% 93%',
    },
    dark: {
      accent: '142 71% 45%',
      accentForeground: '0 0% 100%',
      accentSubtle: '142 40% 15%',
      sidebarActive: '142 38% 20%',
    },
  },
  blue: {
    label: '파랑',
    swatch: '#5668F3',
    hue: 237,
    light: {
      accent: '237 84% 63%',
      accentForeground: '0 0% 100%',
      accentSubtle: '237 84% 95%',
      sidebarActive: '237 85% 95%',
    },
    dark: {
      accent: '237 84% 63%',
      accentForeground: '0 0% 100%',
      accentSubtle: '237 28% 18%',
      sidebarActive: '237 30% 22%',
    },
  },
  purple: {
    label: '보라',
    swatch: '#8B5CF6',
    hue: 258,
    light: {
      accent: '258 90% 66%',
      accentForeground: '0 0% 100%',
      accentSubtle: '258 86% 95%',
      sidebarActive: '258 72% 94%',
    },
    dark: {
      accent: '258 90% 66%',
      accentForeground: '0 0% 100%',
      accentSubtle: '258 33% 19%',
      sidebarActive: '258 35% 23%',
    },
  },
}

function readStoredPreset(): AccentPreset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && raw in ACCENT_PALETTES) return raw as AccentPreset
  } catch {
    /* ignore */
  }
  return 'blue'
}

function readStoredAccentAsMain(): boolean {
  try {
    return localStorage.getItem(STORAGE_MAIN_KEY) === 'true'
  } catch {
    return false
  }
}

function clearBoldMainOverrides(root: HTMLElement) {
  for (const key of BOLD_MAIN_KEYS) {
    root.style.removeProperty(key)
  }
}

function applyBoldMainToRoot(root: HTMLElement, bold: BoldMainThemeVars) {
  root.style.setProperty('--background', bold.background)
  root.style.setProperty('--foreground', bold.foreground)
  root.style.setProperty('--card', bold.card)
  root.style.setProperty('--card-foreground', bold.cardForeground)
  root.style.setProperty('--muted', bold.muted)
  root.style.setProperty('--muted-foreground', bold.mutedForeground)
  root.style.setProperty('--border', bold.border)
  root.style.setProperty('--sidebar', bold.sidebar)
  root.style.setProperty('--sidebar-foreground', bold.sidebarForeground)
  root.style.setProperty('--sidebar-border', bold.sidebarBorder)
  root.style.setProperty('--sidebar-hover', bold.sidebarHover)
  root.style.setProperty('--accent', bold.accent)
  root.style.setProperty('--accent-foreground', bold.accentForeground)
  root.style.setProperty('--accent-subtle', bold.accentSubtle)
  root.style.setProperty('--sidebar-active', bold.sidebarActive)
}

function applyAccentTokens(
  preset: AccentPreset,
  isDark: boolean,
  accentAsMain: boolean,
) {
  const palette = ACCENT_PALETTES[preset]
  const tokens = isDark ? palette.dark : palette.light
  const root = document.documentElement

  if (accentAsMain) {
    const bold = buildBoldMainTheme(palette, isDark)
    applyBoldMainToRoot(root, bold)
    root.dataset.accentAsMain = 'true'
    return
  }

  clearBoldMainOverrides(root)
  delete root.dataset.accentAsMain

  root.style.setProperty('--accent', tokens.accent)
  root.style.setProperty('--accent-foreground', tokens.accentForeground)
  root.style.setProperty('--accent-subtle', tokens.accentSubtle)
  root.style.setProperty('--sidebar-active', tokens.sidebarActive)
}

type AccentColorContextValue = {
  accentPreset: AccentPreset
  setAccentPreset: (next: AccentPreset) => void
  accentPalettes: typeof ACCENT_PALETTES
  accentAsMain: boolean
  setAccentAsMain: (value: boolean) => void
}

const AccentColorContext = createContext<AccentColorContextValue | null>(null)

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [accentPreset, setAccentPresetState] = useState<AccentPreset>(() =>
    typeof window === 'undefined' ? 'blue' : readStoredPreset(),
  )

  const [accentAsMain, setAccentAsMainState] = useState<boolean>(() =>
    typeof window === 'undefined' ? false : readStoredAccentAsMain(),
  )

  const setAccentPreset = useCallback((next: AccentPreset) => {
    setAccentPresetState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const setAccentAsMain = useCallback((value: boolean) => {
    setAccentAsMainState(value)
    try {
      localStorage.setItem(STORAGE_MAIN_KEY, value ? 'true' : 'false')
    } catch {
      /* ignore */
    }
  }, [])

  const syncToDocument = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark')
    applyAccentTokens(accentPreset, isDark, accentAsMain)
  }, [accentPreset, accentAsMain])

  useEffect(() => {
    syncToDocument()
  }, [syncToDocument])

  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => syncToDocument())
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [syncToDocument])

  const value: AccentColorContextValue = {
    accentPreset,
    setAccentPreset,
    accentPalettes: ACCENT_PALETTES,
    accentAsMain,
    setAccentAsMain,
  }

  return (
    <AccentColorContext.Provider value={value}>{children}</AccentColorContext.Provider>
  )
}

export function useAccentColor() {
  const ctx = useContext(AccentColorContext)
  if (!ctx) {
    throw new Error('useAccentColor must be used within AccentColorProvider')
  }
  return ctx
}
