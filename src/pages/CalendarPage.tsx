import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import clsx from 'clsx'
import { MEETINGS } from '../data/mockData'
import type { Meeting } from '../types/meeting'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

function getMeetingsByDate(): Map<string, Meeting[]> {
  const map = new Map<string, Meeting[]>()
  MEETINGS.forEach((m) => {
    const key = new Date(m.startAt).toDateString()
    const list = map.get(key) ?? []
    list.push(m)
    map.set(key, list)
  })
  return map
}

const STATUS_LABEL: Record<Meeting['status'], string> = {
  inprogress: '진행 중',
  upcoming: '예정',
  completed: '완료',
}

export default function CalendarPage() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<Date | null>(null)

  const meetingsByDate = getMeetingsByDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })

  // 마지막 행을 채우기 위한 trailing cell 수
  const totalCells = firstDay + daysInMonth
  const trailingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const selectedMeetings = selected ? (meetingsByDate.get(selected.toDateString()) ?? []) : []

  return (
    <div className="flex flex-col h-full">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-accent" />
          <h1 className="text-lg font-semibold text-foreground">{monthLabel}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
            aria-label="이전 달"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => {
              setViewYear(today.getFullYear())
              setViewMonth(today.getMonth())
              setSelected(null)
            }}
            className="px-3 h-8 rounded text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            오늘
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
            aria-label="다음 달"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 본문 (캘린더 + 상세 패널) */}
      <div className="flex flex-1 min-h-0">
        {/* 캘린더 그리드 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-border shrink-0">
            {DOW.map((d, i) => (
              <div
                key={d}
                className={clsx(
                  'text-center text-xs font-medium py-2 border-r border-border last:border-r-0',
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground',
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 flex-1">
            {/* 앞쪽 빈 칸 */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`lead${i}`} className="border-r border-b border-border last:border-r-0 bg-muted/10" />
            ))}

            {/* 날짜 칸 */}
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
              const meetings = meetingsByDate.get(date.toDateString()) ?? []
              const dow = date.getDay()

              return (
                <button
                  key={day}
                  onClick={() => setSelected(isSelected ? null : date)}
                  className={clsx(
                    'flex flex-col items-start p-1.5 min-h-[80px] border-r border-b border-border',
                    'last:border-r-0 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                    isSelected ? 'bg-accent-subtle' : 'hover:bg-muted/40',
                  )}
                  aria-label={`${viewYear}년 ${viewMonth + 1}월 ${day}일${meetings.length > 0 ? ` (회의 ${meetings.length}건)` : ''}`}
                  aria-pressed={isSelected}
                >
                  <span
                    className={clsx(
                      'w-6 h-6 flex items-center justify-center rounded-full text-sm mb-0.5 shrink-0',
                      isToday
                        ? 'bg-accent text-accent-foreground font-bold'
                        : '',
                      !isToday && dow === 0 && 'text-red-400',
                      !isToday && dow === 6 && 'text-blue-400',
                      !isToday && dow !== 0 && dow !== 6 && 'text-foreground',
                    )}
                  >
                    {day}
                  </span>

                  {/* 회의 칩 (최대 2개) */}
                  {meetings.slice(0, 2).map((m) => (
                    <span
                      key={m.id}
                      className="w-full truncate text-[10px] px-1 py-0.5 rounded mb-0.5 bg-accent/15 text-accent font-medium leading-tight"
                    >
                      {m.title}
                    </span>
                  ))}
                  {meetings.length > 2 && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      +{meetings.length - 2}개 더
                    </span>
                  )}
                </button>
              )
            })}

            {/* 뒤쪽 빈 칸 */}
            {Array.from({ length: trailingCells }).map((_, i) => (
              <div key={`trail${i}`} className="border-r border-b border-border last:border-r-0 bg-muted/10" />
            ))}
          </div>
        </div>

        {/* 날짜 상세 패널 (선택된 날짜가 있을 때) */}
        {selected && (
          <div className="w-64 shrink-0 border-l border-border flex flex-col">
            <div className="px-4 py-3 border-b border-border shrink-0">
              <p className="text-sm font-semibold text-foreground">
                {selected.toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedMeetings.length > 0
                  ? `회의 ${selectedMeetings.length}건`
                  : '예정된 회의 없음'}
              </p>
            </div>

            {selectedMeetings.length > 0 ? (
              <ul className="flex-1 overflow-y-auto divide-y divide-border">
                {selectedMeetings.map((m) => (
                  <li key={m.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(m.startAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {m.endAt &&
                        ` — ${new Date(m.endAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`}
                    </p>
                    <span
                      className={clsx(
                        'inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium',
                        m.status === 'inprogress' &&
                          'bg-[hsl(var(--status-inprogress))]/15 text-[hsl(var(--status-inprogress))]',
                        m.status === 'upcoming' &&
                          'bg-[hsl(var(--status-upcoming))]/15 text-[hsl(var(--status-upcoming))]',
                        m.status === 'completed' &&
                          'bg-[hsl(var(--status-completed))]/15 text-[hsl(var(--status-completed))]',
                      )}
                    >
                      {STATUS_LABEL[m.status]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1 flex items-center justify-center px-4">
                <p className="text-sm text-muted-foreground text-center">
                  이 날에 예정된 회의가 없습니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
