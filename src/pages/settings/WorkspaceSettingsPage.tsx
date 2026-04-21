import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Save } from 'lucide-react'
import { useAccentColor } from '../../hooks/useAccentColor'
import { useFontScale } from '../../context/FontScaleContext'
import { getCurrentWorkspaceId } from '../../api/client'
import { getWorkspace, updateWorkspace } from '../../api/workspace'

const SUMMARY_STYLES = ['간결형 (결정사항·액션아이템 중심)', '상세형 (전문 포함)', '발표형 (PPT 구조)', '커스텀']
const LANGUAGES = ['한국어', 'English', '日本語']

const FONT_SCALE_OPTIONS: { id: 'sm' | 'md' | 'lg'; label: string; hint: string }[] = [
  { id: 'sm', label: '작게', hint: '16px 기준' },
  { id: 'md', label: '보통', hint: '18px 기준' },
  { id: 'lg', label: '크게', hint: '20px 기준' },
]

export default function WorkspaceSettingsPage() {
  const [teamName, setTeamName] = useState('Workb 팀')
  const [industry, setIndustry] = useState('')
  const [language, setLanguage] = useState('한국어')
  const [summaryStyle, setSummaryStyle] = useState(SUMMARY_STYLES[0])
  const [logoUrl, setLogoUrl] = useState('/brand/workb-logo.png')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const {
    accentPreset,
    setAccentPreset,
    accentPalettes,
    accentAsMain,
    setAccentAsMain,
  } = useAccentColor()
  const { fontScale, setFontScale } = useFontScale()
  const workspaceId = getCurrentWorkspaceId()

  useEffect(() => {
    let active = true

    async function loadWorkspace() {
      setLoading(true)
      setError('')

      try {
        const workspace = await getWorkspace(workspaceId)
        if (!active) return
        setTeamName(workspace.name)
        setIndustry(workspace.industry ?? '')
        setLanguage(workspace.default_language ?? '한국어')
        setSummaryStyle(workspace.summary_style ?? SUMMARY_STYLES[0])
        setLogoUrl(workspace.logo_url ?? '/brand/workb-logo.png')
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : '워크스페이스 정보를 불러오지 못했습니다.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadWorkspace()

    return () => {
      active = false
    }
  }, [workspaceId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const workspace = await updateWorkspace(workspaceId, {
        name: teamName,
        industry: industry || null,
        default_language: language,
        summary_style: summaryStyle,
        logo_url: logoUrl || null,
      })
      setTeamName(workspace.name)
      setIndustry(workspace.industry ?? '')
      setLanguage(workspace.default_language ?? '한국어')
      setSummaryStyle(workspace.summary_style ?? SUMMARY_STYLES[0])
      setLogoUrl(workspace.logo_url ?? '/brand/workb-logo.png')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '워크스페이스 설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
        <p className="text-sm text-muted-foreground">워크스페이스 설정을 불러오는 중입니다...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-1">워크스페이스 설정</h1>
      <p className="text-sm text-muted-foreground mb-6">팀 정보와 기본 설정을 관리합니다.</p>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Team name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">팀 이름</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">업종</label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="예: IT, 교육, 스타트업"
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">팀 로고 URL</label>
          <div className="flex items-center gap-3">
            <img src={logoUrl || '/brand/workb-logo.png'} alt="Workb 팀 로고" className="w-12 h-12 rounded-xl object-cover" />
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">기본 회의 언어</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${language === lang ? 'border-accent bg-accent-subtle text-accent' : 'border-border text-muted-foreground hover:border-foreground'}`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Summary style */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">회의록 요약 스타일</label>
          <div className="flex flex-col gap-2">
            {SUMMARY_STYLES.map((style) => (
              <label key={style} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="summaryStyle"
                  value={style}
                  checked={summaryStyle === style}
                  onChange={() => setSummaryStyle(style)}
                  className="accent-accent"
                />
                <span className="text-sm text-foreground">{style}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">글자 크기</label>
          <p className="text-mini text-muted-foreground mb-2">
            화면 전체 글자·간격(rem)이 함께 조정됩니다. 선택 즉시 반영됩니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {FONT_SCALE_OPTIONS.map((opt) => {
              const selected = fontScale === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFontScale(opt.id)}
                  className={`flex flex-col items-start gap-0.5 min-w-[5.5rem] px-3 py-2 rounded-lg border text-left transition-colors ${
                    selected
                      ? 'border-accent bg-accent-subtle text-accent'
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                  aria-pressed={selected}
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  <span className="text-micro text-muted-foreground">{opt.hint}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">포인트 색상</label>
          <p className="text-mini text-muted-foreground mb-2">
            앱 전체 강조색(버튼·뱃지·활성 상태)에 즉시 반영됩니다.
          </p>

          <div className="rounded-lg border border-border bg-card/50 px-3 py-3 mb-3 space-y-2">
            <div>
              <span className="block text-sm font-medium text-foreground" id="accent-main-label">
                메인 화면 톤
              </span>
              <p className="text-mini text-muted-foreground mt-0.5">
                기본은 중립 배경입니다. 메인 톤은 라이트 모드에서 밝은 파스텔 틴트 + 짙은 글자, 다크 모드에서는 진한
                포인트 톤 + 밝은 글자로 맞춥니다.
              </p>
            </div>

            <div
              role="group"
              aria-labelledby="accent-main-label"
              className="flex w-full max-w-md rounded-xl border border-border bg-muted/40 p-1 gap-1"
            >
              <button
                type="button"
                onClick={() => setAccentAsMain(false)}
                aria-pressed={!accentAsMain}
                className={clsx(
                  'flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                  !accentAsMain
                    ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
              >
                기본
              </button>
              <button
                type="button"
                onClick={() => setAccentAsMain(true)}
                aria-pressed={accentAsMain}
                className={clsx(
                  'flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                  accentAsMain
                    ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
              >
                메인 톤
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(accentPalettes).map(([key, palette]) => {
              const selected = accentPreset === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccentPreset(key as keyof typeof accentPalettes)}
                  className={`flex items-center gap-2 h-9 px-3 rounded-lg border text-sm transition-colors ${
                    selected
                      ? 'border-accent bg-accent-subtle text-accent'
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                  aria-pressed={selected}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: palette.swatch }}
                    aria-hidden
                  />
                  <span>{palette.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save size={14} /> {saving ? '저장 중...' : saved ? '저장됨 ✓' : '변경사항 저장'}
        </button>
      </form>
    </div>
  )
}
