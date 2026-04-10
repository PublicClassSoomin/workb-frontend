import type { Meeting, ActionItem, WeeklyStats, Participant } from '../types/meeting'

// ── Participants ──────────────────────────────────────────────────────────
export const PARTICIPANTS: Participant[] = [
  { id: 'p1', name: '김수민', avatarInitials: '수민', color: '#6b78f6' },
  { id: 'p2', name: '이지현', avatarInitials: '지현', color: '#22c55e' },
  { id: 'p3', name: '박준혁', avatarInitials: '준혁', color: '#f97316' },
  { id: 'p4', name: '최은영', avatarInitials: '은영', color: '#ec4899' },
  { id: 'p5', name: '정민준', avatarInitials: '민준', color: '#eab308' },
  { id: 'p6', name: '오서연', avatarInitials: '서연', color: '#14b8a6' },
]

// ── Meetings ──────────────────────────────────────────────────────────────
export const MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: '2025 Q2 제품 로드맵 리뷰',
    status: 'inprogress',
    startAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25분 전 시작
    participants: [PARTICIPANTS[0], PARTICIPANTS[1], PARTICIPANTS[2], PARTICIPANTS[3]],
    agenda: ['Q1 회고', 'Q2 목표 설정', '리소스 배분'],
    actionItemCount: 3,
    decisionCount: 2,
    tags: ['제품', '로드맵', '분기리뷰'],
  },
  {
    id: 'm2',
    title: '백엔드 API 설계 논의',
    status: 'upcoming',
    startAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후
    participants: [PARTICIPANTS[0], PARTICIPANTS[2], PARTICIPANTS[4]],
    agenda: ['인증 엔드포인트', 'STT 연동 API', 'Redis 스키마'],
    actionItemCount: 0,
    decisionCount: 0,
    tags: ['개발', 'API', '백엔드'],
  },
  {
    id: 'm3',
    title: '마케팅 캠페인 기획',
    status: 'upcoming',
    startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 내일
    participants: [PARTICIPANTS[1], PARTICIPANTS[3], PARTICIPANTS[5]],
    agenda: ['타겟 오디언스 분석', 'SNS 전략', '예산 배분'],
    actionItemCount: 0,
    decisionCount: 0,
    tags: ['마케팅', '캠페인'],
  },
  {
    id: 'm4',
    title: '주간 스탠드업',
    status: 'upcoming',
    startAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    participants: PARTICIPANTS,
    agenda: ['진행 현황 공유', '블로커 논의'],
    actionItemCount: 0,
    decisionCount: 0,
    tags: ['스탠드업', '주간'],
  },
  {
    id: 'm5',
    title: 'UI/UX 디자인 검토',
    status: 'completed',
    startAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    participants: [PARTICIPANTS[0], PARTICIPANTS[1], PARTICIPANTS[3]],
    summary: '홈 대시보드 와이어프레임 승인. 사이드바 컬러 시스템 확정. 다음 스프린트 컴포넌트 구현 시작 예정.',
    actionItemCount: 5,
    decisionCount: 3,
    tags: ['디자인', 'UI', 'UX'],
  },
  {
    id: 'm6',
    title: '투자자 미팅 준비',
    status: 'completed',
    startAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    participants: [PARTICIPANTS[0], PARTICIPANTS[2], PARTICIPANTS[4]],
    summary: 'IR 덱 최종 검토 완료. 핵심 지표 업데이트 필요. 데모 시나리오 확정.',
    actionItemCount: 7,
    decisionCount: 4,
    tags: ['투자', 'IR', '경영'],
  },
  {
    id: 'm7',
    title: '스프린트 플래닝 #12',
    status: 'completed',
    startAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    participants: [PARTICIPANTS[0], PARTICIPANTS[1], PARTICIPANTS[2], PARTICIPANTS[4]],
    summary: '스프린트 12 목표 확정. 총 23개 태스크 배정. STT 연동 에픽 우선순위 상향.',
    actionItemCount: 8,
    decisionCount: 5,
    tags: ['개발', '스프린트', '애자일'],
  },
]

// ── Action Items ──────────────────────────────────────────────────────────
export const ACTION_ITEMS: ActionItem[] = [
  {
    id: 'a1',
    title: 'API 인증 엔드포인트 설계 문서 작성',
    assignee: PARTICIPANTS[2],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    done: false,
    meetingId: 'm5',
    meetingTitle: 'UI/UX 디자인 검토',
  },
  {
    id: 'a2',
    title: '홈 대시보드 컴포넌트 구현',
    assignee: PARTICIPANTS[0],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'urgent',
    done: false,
    meetingId: 'm5',
    meetingTitle: 'UI/UX 디자인 검토',
  },
  {
    id: 'a3',
    title: 'IR 덱 핵심 지표 슬라이드 업데이트',
    assignee: PARTICIPANTS[4],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'urgent',
    done: false,
    meetingId: 'm6',
    meetingTitle: '투자자 미팅 준비',
  },
  {
    id: 'a4',
    title: '타겟 오디언스 분석 자료 준비',
    assignee: PARTICIPANTS[3],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    done: false,
    meetingId: 'm6',
    meetingTitle: '투자자 미팅 준비',
  },
  {
    id: 'a5',
    title: 'Redis 스키마 설계 초안',
    assignee: PARTICIPANTS[2],
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    done: false,
    meetingId: 'm7',
    meetingTitle: '스프린트 플래닝 #12',
  },
  {
    id: 'a6',
    title: '디자인 시스템 토큰 확정',
    assignee: PARTICIPANTS[1],
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 어제 (기한 초과)
    priority: 'medium',
    done: true,
    meetingId: 'm5',
    meetingTitle: 'UI/UX 디자인 검토',
  },
]

// ── Weekly Stats ──────────────────────────────────────────────────────────
export const WEEKLY_STATS: WeeklyStats = {
  totalMeetings: 8,
  totalMinutes: 342,
  actionItemsTotal: 23,
  actionItemsDone: 15,
  topParticipant: PARTICIPANTS[0],
}
