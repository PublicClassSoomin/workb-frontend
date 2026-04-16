import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Tag, DoorOpen, Search, X, UsersRound } from 'lucide-react'
import { PARTICIPANTS, DEPARTMENTS } from '../../data/mockData'
import type { Participant } from '../../types/meeting'
import DatePicker from '../../components/ui/DatePicker'
import TimePicker from '../../components/ui/TimePicker'

const MEETING_TYPES = ['일반 회의', '스프린트 플래닝', '스탠드업', '회고', '브레인스토밍', '투자자 미팅']

export default function NewMeetingPage() {
  const [title, setTitle] = useState('')
  const [roomName, setRoomName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [meetingType, setMeetingType] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const trimmed = searchQuery.trim().toLowerCase()

  // 매칭된 개별 직원 (이름 또는 부서명으로 검색)
  const filteredCandidates = PARTICIPANTS.filter(
    (p) =>
      !selectedParticipants.some((s) => s.id === p.id) &&
      (trimmed === '' ||
        p.name.toLowerCase().includes(trimmed) ||
        (p.department?.toLowerCase().includes(trimmed) ?? false))
  )

  // 매칭된 부서 그룹 (부서명이 검색어를 포함하거나, 검색어가 비어있을 때 전체 부서)
  const matchedDepartments = DEPARTMENTS.filter(
    (d) => trimmed === '' || d.name.toLowerCase().includes(trimmed)
  )

  // 드롭다운 아이템 총 수 (부서 그룹 + 개별 직원)
  const totalItems = matchedDepartments.length + filteredCandidates.length

  useEffect(() => {
    setHighlightedIndex(0)
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function addParticipant(p: Participant) {
    if (selectedParticipants.some((s) => s.id === p.id)) return
    setSelectedParticipants((prev) => [...prev, p])
  }

  function addDepartment(deptName: string) {
    const members = PARTICIPANTS.filter((p) => p.department === deptName)
    setSelectedParticipants((prev) => {
      const existingIds = new Set(prev.map((p) => p.id))
      const toAdd = members.filter((p) => !existingIds.has(p.id))
      return [...prev, ...toAdd]
    })
    setSearchQuery('')
    setDropdownOpen(false)
    searchRef.current?.focus()
  }

  function removeParticipant(id: string) {
    setSelectedParticipants((prev) => prev.filter((p) => p.id !== id))
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen || totalItems === 0) {
      if (e.key === 'ArrowDown' && totalItems > 0) setDropdownOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex < matchedDepartments.length) {
        addDepartment(matchedDepartments[highlightedIndex].name)
      } else {
        const candidate = filteredCandidates[highlightedIndex - matchedDepartments.length]
        if (candidate) {
          addParticipant(candidate)
          setSearchQuery('')
          setDropdownOpen(false)
          searchRef.current?.focus()
        }
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('TODO: create meeting', {
      title,
      roomName,
      date,
      time,
      duration,
      meetingType,
      participants: selectedParticipants.map((p) => p.id),
    })
    navigate('/meetings/m2/upcoming')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">회의 생성 · 예약</h1>
        <p className="text-sm text-muted-foreground mt-0.5">새 회의를 예약하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 회의 제목 */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
            <Tag size={14} aria-hidden="true" /> 회의 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: Q2 제품 로드맵 리뷰"
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            required
          />
        </div>

        {/* 회의실 이름 */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
            <DoorOpen size={14} aria-hidden="true" /> 회의실 이름
          </label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="예: 대회의실 A, 개발실 B"
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>

        {/* 날짜 & 시간 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">날짜</label>
            <DatePicker value={date} onChange={setDate} placeholder="날짜 선택" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">시간</label>
            <TimePicker value={time} onChange={setTime} placeholder="시간 선택" />
          </div>
        </div>

        {/* 예상 소요 시간 */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">예상 소요 시간</label>
          <div className="flex gap-2 flex-wrap">
            {['30', '60', '90', '120'].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setDuration(min)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  duration === min
                    ? 'border-accent bg-accent-subtle text-accent'
                    : 'border-border text-muted-foreground hover:border-foreground'
                }`}
              >
                {min}분
              </button>
            ))}
          </div>
        </div>

        {/* 회의 유형 */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">회의 유형</label>
          <select
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          >
            <option value="">유형 선택 (선택사항)</option>
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* 직원 검색 */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
            <Users size={14} aria-hidden="true" /> 직원 검색
          </label>

          {/* 선택된 직원 Chip 목록 */}
          {selectedParticipants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedParticipants.map((p) => (
                <span
                  key={p.id}
                  className="flex items-center gap-1.5 pl-1.5 pr-1 py-0.5 rounded-full border border-accent bg-accent-subtle text-accent text-sm"
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white text-micro shrink-0"
                    style={{ backgroundColor: p.color }}
                    aria-hidden="true"
                  >
                    {p.avatarInitials[0]}
                  </span>
                  {p.name}
                  {p.department && (
                    <span className="text-micro text-accent/60">({p.department})</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeParticipant(p.id)}
                    className="ml-0.5 hover:text-accent/60 transition-colors"
                    aria-label={`${p.name} 제거`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* 검색 입력 + 드롭다운 */}
          <div className="relative">
            <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-card focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent">
              <Search size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setDropdownOpen(true)
                }}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="이름 또는 부서명으로 검색..."
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                aria-label="직원 검색"
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
                role="combobox"
                aria-autocomplete="list"
              />
            </div>

            {dropdownOpen && totalItems > 0 && (
              <div
                ref={dropdownRef}
                role="listbox"
                aria-label="직원 및 부서 목록"
                className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden max-h-64 overflow-y-auto"
              >
                {/* 부서 그룹 섹션 */}
                {matchedDepartments.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-micro font-medium text-muted-foreground uppercase tracking-wide bg-muted/40 border-b border-border">
                      부서 전체 추가
                    </div>
                    {matchedDepartments.map((dept, idx) => {
                      const membersInDept = PARTICIPANTS.filter((p) => p.department === dept.name)
                      const alreadyAdded = membersInDept.filter((p) =>
                        selectedParticipants.some((s) => s.id === p.id)
                      ).length
                      const newCount = membersInDept.length - alreadyAdded
                      const isHighlighted = idx === highlightedIndex
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          role="option"
                          aria-selected={isHighlighted}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          onClick={() => addDepartment(dept.name)}
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors ${
                            isHighlighted
                              ? 'bg-accent-subtle text-accent'
                              : 'text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <UsersRound size={14} className="shrink-0" aria-hidden="true" />
                            <span>{dept.name}</span>
                          </div>
                          <span className="text-mini text-muted-foreground">
                            {newCount > 0 ? `+${newCount}명 추가` : '모두 추가됨'}
                          </span>
                        </button>
                      )
                    })}
                  </>
                )}

                {/* 개별 직원 섹션 */}
                {filteredCandidates.length > 0 && (
                  <>
                    {matchedDepartments.length > 0 && (
                      <div className="px-3 py-1.5 text-micro font-medium text-muted-foreground uppercase tracking-wide bg-muted/40 border-b border-border">
                        직원
                      </div>
                    )}
                    {filteredCandidates.map((p, idx) => {
                      const itemIdx = matchedDepartments.length + idx
                      const isHighlighted = itemIdx === highlightedIndex
                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="option"
                          aria-selected={isHighlighted}
                          onMouseEnter={() => setHighlightedIndex(itemIdx)}
                          onClick={() => {
                            addParticipant(p)
                            setSearchQuery('')
                            setDropdownOpen(false)
                            searchRef.current?.focus()
                          }}
                          className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors text-left ${
                            isHighlighted
                              ? 'bg-accent-subtle text-accent'
                              : 'text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-micro shrink-0"
                            style={{ backgroundColor: p.color }}
                            aria-hidden="true"
                          >
                            {p.avatarInitials[0]}
                          </span>
                          <span className="flex-1">{p.name}</span>
                          {p.department && (
                            <span className="text-mini text-muted-foreground">{p.department}</span>
                          )}
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            )}

            {dropdownOpen && trimmed !== '' && totalItems === 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg px-3 py-2.5 text-sm text-muted-foreground">
                검색 결과가 없습니다.
              </div>
            )}
          </div>

          {selectedParticipants.length === 0 && (
            <p className="text-mini text-muted-foreground mt-1.5">
              이름 또는 부서명으로 검색해 추가하세요. 부서 선택 시 소속 직원이 일괄 추가됩니다.
            </p>
          )}
        </div>

        {/* Google Calendar 연동 */}
        <div className="p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">📅 Google Calendar 연동</p>
              <p className="text-mini text-muted-foreground mt-0.5">회의 일정을 캘린더에 자동 등록합니다.</p>
            </div>
            <button
              type="button"
              onClick={() => console.log('TODO: Google Calendar sync')}
              className="px-3 py-1.5 rounded-lg border border-accent text-accent text-mini font-medium hover:bg-accent-subtle transition-colors"
            >
              캘린더 연동
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            회의 만들기
          </button>
        </div>
      </form>
    </div>
  )
}
