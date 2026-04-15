import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'
import clsx from 'clsx'

interface TimePickerProps {
  value: string // HH:MM 형식
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]

/**
 * DatePicker와 동일한 디자인 언어를 사용하는 커스텀 시간 선택기.
 * 시(0–23)와 분(0, 15, 30, 45)을 각각 컬럼으로 선택.
 */
export default function TimePicker({
  value,
  onChange,
  placeholder = '시간 선택',
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hourListRef = useRef<HTMLDivElement>(null)

  const [selHour, selMin] = value
    ? value.split(':').map(Number)
    : [null, null]

  // 외부 클릭·ESC로 닫기
  useEffect(() => {
    if (!open) return
    function handleDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // 패널 열릴 때 선택된 시간으로 스크롤
  useEffect(() => {
    if (!open || selHour === null) return
    const el = hourListRef.current
    if (!el) return
    const btn = el.querySelector(`[data-hour="${selHour}"]`) as HTMLElement | null
    btn?.scrollIntoView({ block: 'center' })
  }, [open, selHour])

  function select(h: number, m: number) {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    onChange(`${hh}:${mm}`)
    setOpen(false)
  }

  const displayValue =
    selHour !== null && selMin !== null
      ? `${String(selHour).padStart(2, '0')}:${String(selMin).padStart(2, '0')}`
      : ''

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* 트리거 버튼 — DatePicker 트리거와 동일한 스타일 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent flex items-center gap-2 text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="시간 선택"
      >
        <Clock size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
        <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
          {displayValue || placeholder}
        </span>
      </button>

      {/* 드롭다운 패널 — DatePicker 달력 패널과 동일한 스타일 */}
      {open && (
        <div
          role="dialog"
          aria-label="시간 선택"
          className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-3 w-52"
        >
          <div className="flex gap-2">
            {/* 시(Hour) 컬럼 */}
            <div className="flex-1 flex flex-col">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 text-center">시</p>
              <div
                ref={hourListRef}
                className="max-h-44 overflow-y-auto flex flex-col gap-0.5 scrollbar-none"
              >
                {HOURS.map((h) => (
                  <button
                    key={h}
                    data-hour={h}
                    type="button"
                    onClick={() => select(h, selMin ?? 0)}
                    className={clsx(
                      'w-full h-7 rounded text-sm transition-colors',
                      selHour === h
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'hover:bg-muted text-foreground',
                    )}
                    aria-pressed={selHour === h}
                    aria-label={`${h}시`}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px bg-border shrink-0" />

            {/* 분(Minute) 컬럼 */}
            <div className="flex-1 flex flex-col">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 text-center">분</p>
              <div className="flex flex-col gap-0.5">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => select(selHour ?? 9, m)}
                    className={clsx(
                      'w-full h-7 rounded text-sm transition-colors',
                      selMin === m
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'hover:bg-muted text-foreground',
                    )}
                    aria-pressed={selMin === m}
                    aria-label={`${m}분`}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
