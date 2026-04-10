import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import clsx from 'clsx'
import { MEETINGS } from '../../data/mockData'

function getMeetingDates(): Set<string> {
  const s = new Set<string>()
  MEETINGS.forEach((m) => {
    s.add(new Date(m.startAt).toDateString())
  })
  return s
}

export default function MiniCalendar() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed
  const [selected, setSelected] = useState<Date | null>(null)

  const meetingDates = getMeetingDates()

  // First day of month, number of days
  const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })

  const DOW = ['일', '월', '화', '수', '목', '금', '토']

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  // Meetings on selected day (or today if nothing selected)
  const targetDate = selected ?? today
  const dayMeetings = MEETINGS.filter((m) => {
    const d = new Date(m.startAt)
    return (
      d.getFullYear() === targetDate.getFullYear() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getDate() === targetDate.getDate()
    )
  })

  return (
    <div className="p-4 rounded-lg border bg-card flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
            aria-label="이전 달"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
            className="px-1.5 h-6 rounded text-micro text-muted-foreground hover:bg-muted transition-colors"
          >
            오늘
          </button>
          <button
            onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
            aria-label="다음 달"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-0.5">
        {DOW.map((d, i) => (
          <div
            key={d}
            className={clsx(
              'text-center text-micro font-medium py-0.5',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {/* Leading empty cells */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(viewYear, viewMonth, day)
          const isToday =
            day === today.getDate() &&
            viewMonth === today.getMonth() &&
            viewYear === today.getFullYear()
          const isSelected =
            selected &&
            day === selected.getDate() &&
            viewMonth === selected.getMonth() &&
            viewYear === selected.getFullYear()
          const hasMeeting = meetingDates.has(date.toDateString())
          const dow = date.getDay()

          return (
            <button
              key={day}
              onClick={() => setSelected(isSelected ? null : date)}
              className={clsx(
                'relative flex flex-col items-center py-0.5 rounded transition-colors text-sm leading-5',
                isSelected
                  ? 'bg-accent text-accent-foreground'
                  : isToday
                  ? 'bg-accent-subtle text-accent font-semibold'
                  : 'hover:bg-muted',
                !isSelected && dow === 0 && 'text-red-400',
                !isSelected && dow === 6 && 'text-blue-400',
                !isSelected && !isToday && dow !== 0 && dow !== 6 && 'text-foreground',
              )}
              aria-label={`${viewYear}년 ${viewMonth + 1}월 ${day}일${hasMeeting ? ' (회의 있음)' : ''}`}
            >
              {day}
              {hasMeeting && (
                <span
                  className={clsx(
                    'w-1 h-1 rounded-full mt-0.5',
                    isSelected ? 'bg-white/70' : 'bg-accent',
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day events */}
      {dayMeetings.length > 0 && (
        <div className="border-t border-border pt-3 flex flex-col gap-1.5">
          <p className="text-micro font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
            {targetDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 일정
          </p>
          {dayMeetings.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <span
                className={clsx(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  m.status === 'inprogress'
                    ? 'bg-[hsl(var(--status-inprogress))]'
                    : m.status === 'upcoming'
                    ? 'bg-[hsl(var(--status-upcoming))]'
                    : 'bg-[hsl(var(--status-completed))]',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-mini text-foreground font-medium truncate">{m.title}</p>
                <p className="text-micro text-muted-foreground">
                  {new Date(m.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  {m.endAt && ` — ${new Date(m.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {dayMeetings.length === 0 && selected && (
        <div className="border-t border-border pt-3">
          <p className="text-mini text-muted-foreground text-center">
            {selected.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}에 예정된 회의가 없습니다.
          </p>
        </div>
      )}

      {/* Google Calendar link placeholder */}
      <button
        onClick={() => console.log('TODO: open Google Calendar')}
        className="flex items-center justify-center gap-1.5 text-micro text-muted-foreground hover:text-accent transition-colors mt-0.5"
      >
        <span>🔵</span> Google Calendar에서 보기
        {/* TODO: link to Google Calendar */}
      </button>
    </div>
  )
}
