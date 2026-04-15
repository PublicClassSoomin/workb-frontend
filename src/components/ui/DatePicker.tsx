import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface DatePickerProps {
  value: string          // YYYY-MM-DD 형식
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const DOW = ['일', '월', '화', '수', '목', '금', '토']

/**
 * MiniCalendar 스타일의 드롭다운 날짜 선택기.
 * 기존 <input type="date"> 대신 사용합니다.
 */
export default function DatePicker({ value, onChange, placeholder = '날짜 선택', className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  // value가 "YYYY-MM-DD"이면 로컬 자정으로 파싱
  const selected = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())
  const containerRef = useRef<HTMLDivElement>(null)

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

  // 월 변경 시 view 상태 동기화
  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear())
      setViewMonth(selected.getMonth())
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    onChange(`${yyyy}-${mm}-${dd}`)
    setOpen(false)
  }

  const displayValue = selected
    ? selected.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent flex items-center gap-2 text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="날짜 선택"
      >
        <Calendar size={14} className="text-muted-foreground shrink-0" />
        <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
          {displayValue || placeholder}
        </span>
      </button>

      {/* 드롭다운 달력 */}
      {open && (
        <div
          role="dialog"
          aria-label="날짜 선택 달력"
          className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-3 w-64"
        >
          {/* 월 탐색 */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
              aria-label="이전 달"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
              aria-label="다음 달"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {DOW.map((d, i) => (
              <div
                key={d}
                className={clsx(
                  'text-center text-xs py-0.5 font-medium',
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground',
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(viewYear, viewMonth, day)
              const isToday =
                day === today.getDate() &&
                viewMonth === today.getMonth() &&
                viewYear === today.getFullYear()
              const isSelected =
                selected != null &&
                day === selected.getDate() &&
                viewMonth === selected.getMonth() &&
                viewYear === selected.getFullYear()
              const dow = date.getDay()

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={clsx(
                    'flex items-center justify-center h-7 w-full rounded text-sm transition-colors',
                    isSelected
                      ? 'bg-accent text-accent-foreground font-medium'
                      : isToday
                      ? 'bg-accent-subtle text-accent font-semibold'
                      : 'hover:bg-muted',
                    !isSelected && dow === 0 && 'text-red-400',
                    !isSelected && dow === 6 && 'text-blue-400',
                    !isSelected && !isToday && dow !== 0 && dow !== 6 && 'text-foreground',
                  )}
                  aria-label={`${viewYear}년 ${viewMonth + 1}월 ${day}일`}
                  aria-pressed={isSelected}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* 오늘로 이동 버튼 */}
          <div className="mt-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setViewYear(today.getFullYear())
                setViewMonth(today.getMonth())
                selectDay(today.getDate())
              }}
              className="w-full h-7 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
