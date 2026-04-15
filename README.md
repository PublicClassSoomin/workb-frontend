# Workb Frontend — AI 회의 어시스턴트

Vite + React 18 + TypeScript + Tailwind CSS 기반 프론트엔드.

## 시작하기

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드
```

`npm run build` 성공 확인 완료 ✅

---

## 목업 시 로그인 스킵

브라우저에서 `localStorage.setItem('workb-auth-mock', 'true')` 실행 후 `/` 접속하면 로그인 없이 앱 사용 가능.  
또는 `/login` → 아무 이메일/비밀번호 입력 후 로그인 버튼 클릭.

---

## 경로 ↔ 명세 섹션 매핑 표

### A. 인증·온보딩 (AuthLayout — 사이드바 없음)

| 경로 | 명세 섹션 |
|------|-----------|
| `/login` | 로그인 / 회원가입 (관리자·멤버 탭) |
| `/signup/admin` | 관리자 회원가입 + 워크스페이스 생성 안내 |
| `/signup/member` | 초대코드 + 아이디/비밀번호 멤버 가입 |
| `/reset-password` | 비밀번호 재설정 (이메일 인증) |
| `/onboarding/workspace` | 워크스페이스 생성 (팀명·업종·언어·초대코드) |
| `/onboarding/integrations` | 외부 서비스 연동 설정 |
| `/onboarding/invite` | 멤버 초대·역할 설정 |

### B. 로그인 후 — AppShell (사이드바 + TopBar)

| 경로 | 명세 섹션 |
|------|-----------|
| `/` | 홈 대시보드 `[핵심]` |
| `/history` | 회의 히스토리·검색 |
| `/calendar` | 전체 캘린더 뷰 |
| `/support` | 고객지원 |
| `/meetings/new` | 회의 생성·예약 |
| `/meetings/context` | 이전 회의 열람·맥락 뷰 `[AI]` |
| `/meetings/:meetingId/agenda` | 아젠다 설정 |
| `/meetings/:meetingId/upcoming` | 예정 회의(사전) 상세 |
| `/meetings/:meetingId/notes` | 회의록 상세 `[핵심]` |
| `/meetings/:meetingId/notes/edit` | 회의록 편집 |
| `/meetings/:meetingId/wbs` | WBS·태스크 리스트 `[핵심]` |
| `/meetings/:meetingId/reports` | 보고서 생성 `[AI]` |
| `/meetings/:meetingId/export` | 내보내기·공유 `[연동]` |
| `/settings/workspace` | 워크스페이스 설정 |
| `/settings/members` | 멤버·권한 관리 |
| `/settings/voice` | 성문(음성) 수집·화자 등록 `[AI]` |
| `/settings/integrations` | 연동 관리 `[연동]` |
| `/settings/device` | 장비 설정 |

### C. 실시간 회의 — FullscreenLayout (사이드바·TopBar 없음)

라이브 구간은 `AppShell` 밖에서 렌더되어 **글로벌 ChatFAB도 표시되지 않음**.

| 경로 | 명세 섹션 |
|------|-----------|
| `/live` | 실시간 회의 메인(목업 기본 회의) `[핵심]` |
| `/live/:meetingId` | 실시간 회의 메인 `[핵심]` |
| `/live/:meetingId/search` | 즉석 자료 검색 `[AI]` |
| `/live/:meetingId/screen` | 화면 공유 해석 뷰 `[AI]` |
| `/live/:meetingId/speakers` | 화자 등록·확인 |

> **참고**: `/live/:meetingId/chat` 는 FAB 채팅 패널과 중복이므로 라우트 생략. 라이브 페이지 내 AI 챗 탭으로 대체.

---

## 목업 데이터 파일 목록

| 파일 | 내용 |
|------|------|
| `src/data/mockData.ts` | 회의 목록, 참석자, 액션 아이템, 주간 통계 |
| `src/data/mockTranscript.ts` | 실시간·완료 회의 STT 발화 스트림 |
| `src/data/mockAgenda.ts` | 아젠다 항목 (회의별) |
| `src/data/mockWbs.ts` | WBS 에픽·태스크 (JIRA 키 포함) |
| `src/data/mockChatMessages.ts` | 글로벌 FAB 챗봇·히스토리 챗봇 대화 |
| `src/data/mockIntegrations.ts` | 연동 서비스 연결 상태 |

---

## 글로벌 챗봇 FAB

- **위치**: `fixed bottom-6 right-6 z-40` — 모든 AppShell 페이지에 표시
- **로고**: `src/components/chat/WorkbAssistantAvatar.tsx` — 인라인 SVG 자체 제작 캐릭터 (로봇 얼굴 + 안테나, 브랜드 컬러 `#5668F3`)
- **패널**: 클릭 시 슬라이드업 채팅 패널 (너비 `w-96`)
- **키보드**: `Escape` 키로 패널 닫기
- **기능 칩**: "현재 회의 요약", "액션 아이템 조회", "다음 회의 일정", "자료 검색"
- **노출 범위**: `/login`, `/signup/*`, `/onboarding/*` 등 인증 전용 라우트와 **`FullscreenLayout` 하위(`/live*`)** 에서는 **숨김**. `AppShell` 이하 경로에서만 **표시**

---

## 디렉터리 구조

```
src/
├── components/
│   ├── chat/         WorkbAssistantAvatar, ChatFAB
│   ├── home/         MeetingCard, WeeklyStats, ActionItemsList
│   ├── layout/       AppShell, AuthLayout, FullscreenLayout, Sidebar, TopBar,
│   │                 NotificationsPanel
│   └── ui/           Badge, Avatar, DatePicker, TimePicker, Tooltip
├── data/
│   ├── mockData.ts
│   ├── mockTranscript.ts
│   ├── mockAgenda.ts
│   ├── mockWbs.ts
│   ├── mockChatMessages.ts
│   └── mockIntegrations.ts
├── pages/
│   ├── auth/         LoginPage, SignupAdminPage, SignupMemberPage, ResetPasswordPage
│   ├── live/         LivePage, LiveSearchPage, LiveScreenPage, LiveSpeakersPage
│   ├── meetings/     AgendaPage, ExportPage, MeetingContextPage, NewMeetingPage,
│   │                 NotesPage, NotesEditPage, ReportsPage, WbsPage, UpcomingMeetingPage
│   ├── onboarding/   OnboardingWorkspacePage, OnboardingIntegrationsPage, OnboardingInvitePage
│   ├── settings/     WorkspaceSettingsPage, MembersSettingsPage, VoiceSettingsPage,
│   │                 IntegrationsSettingsPage, DeviceSettingsPage
│   └── HomePage.tsx, HistoryPage.tsx, CalendarPage.tsx, SupportPage.tsx
├── types/
│   ├── meeting.ts    Meeting, ActionItem, Participant, WeeklyStats
│   ├── transcript.ts Utterance, TranscriptSegment
│   ├── agenda.ts     AgendaItem
│   ├── wbs.ts        WbsEpic, WbsTask, WbsStatus, WbsPriority
│   ├── integrations.ts Integration, IntegrationStatus
│   ├── chat.ts       ChatMessage, ChatRole
│   └── index.ts      re-exports
└── utils/
    └── format.ts
```

---

## 반응형(Responsive) UI

### 브레이크포인트 기준

Tailwind 기본 브레이크포인트를 그대로 사용 (커스텀 없음):

| 접두사 | 폭 | 사용 의도 |
|--------|----|-----------|
| (없음) | 0px~ | 모바일 퍼스트 기본 |
| `sm:` | 640px~ | 작은 태블릿·가로 폰 |
| `md:` | 768px~ | 태블릿·소형 데스크톱 |
| `lg:` | 1024px~ | 데스크톱 — 우측 패널 등 표시 |
| `xl:` | 1280px~ | 넓은 데스크톱 — 패널 폭 확장 |

### 모바일 내비게이션 동작

- **`md` 미만**: 사이드바는 숨김(`-translate-x-full`). TopBar 왼쪽 햄버거 버튼을 누르면 오버레이 드로어로 슬라이드인.
- **`md` 이상**: 사이드바가 레이아웃 흐름에 포함(`md:relative md:translate-x-0`). 접기/펼치기 토글 가능(`md:w-12` ↔ `md:w-56`). 데스크톱에서는 사이드바 **오른쪽 가장자리 세로 중앙**에 이중 꺾쇠 핸들 버튼으로도 토글 가능.
- 드로어 닫기: 배경 클릭 또는 `Escape` 키.

### 주요 반응형 패턴

| 컴포넌트/페이지 | 모바일 | `md`/`lg` 이상 |
|----------------|--------|----------------|
| Sidebar | 오버레이 드로어 | 고정 사이드바 |
| TopBar 내비 링크 (라이브) | 아이콘만 | 아이콘 + 텍스트 |
| HomePage 우측 패널 | 숨김 | `lg:flex` 표시 |
| HistoryPage 테이블 헤더 | 숨김, 행은 카드형 | `md:grid` 표시 |
| WbsPage 태스크 행 | 카드형 레이아웃 | 5열 그리드 |
| MembersSettingsPage 멤버 행 | 이름/이메일 + 역할 드롭다운 | 4열 그리드 |
| LivePage 우측 패널 | 탭 스트립 + 인라인 콘텐츠 | `lg:flex` 사이드 패널 |
| ChatFAB 패널 | `w-[calc(100vw-2rem)]` | `sm:w-96` |
| ChatFAB 위치 | `env(safe-area-inset-bottom)` 적용 | 동일 |

### 알려진 제한

- `WbsPage`, `HistoryPage`의 테이블형 UI는 모바일에서 **카드/리스트형으로만** 분리되며, 컬럼 정렬 기능 없음.
- `LivePage` 톱바의 내비 링크(검색·화면공유·화자)는 `sm` 미만에서 **아이콘 전용** 표시 (hover `title` 속성으로 레이블 제공).
- `MeetingContextPage` 우측 AI 채팅 패널은 `lg` 미만에서 **숨김** — 글로벌 ChatFAB로 대체.

---

## 디자인 시스템

- `darkMode: 'class'`, CSS 변수 기반 시맨틱 토큰 (`bg-background`, `text-accent` 등)
- 브랜드 포인트 컬러: `#5668F3` (`accent`)
- **shadcn 미사용** — 커스텀 컴포넌트만 사용
- `src/hooks/useThemePreference.ts`: 시스템/라이트/다크 순환, `localStorage` 유지
