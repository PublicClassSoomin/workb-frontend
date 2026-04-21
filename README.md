# Workb Frontend

AI 회의 어시스턴트 서비스의 프론트엔드 프로젝트입니다.  
기술 스택은 `Vite + React 18 + TypeScript + Tailwind CSS`입니다.

## 시작하기

```bash
npm install
npm run dev
```

- 기본 개발 주소: `http://localhost:5173`
- 빌드: `npm run build`
- 프리뷰: `npm run preview`

## 환경 변수

`.env` (또는 `.env.local`)에 아래 값을 설정하세요.

```env
VITE_API_URL=http://localhost:8000/api/v1
```

- `src/api/client.ts`에서 `VITE_API_URL`을 사용합니다.
- 미설정 시 기본값 `http://localhost:8000/api/v1`이 사용됩니다.

## 목업 로그인

인증 연동 전 목업 모드로 빠르게 진입하려면:

```js
localStorage.setItem('workb-auth-mock', 'true')
```

또는 `/login`에서 임의 값으로 로그인해도 홈으로 진입합니다.

---

## 라우트 구조

### 1) 인증/온보딩 (`AuthLayout`)

- `/login`
- `/signup/admin`
- `/signup/member`
- `/reset-password`
- `/onboarding/workspace`
- `/onboarding/integrations`
- `/onboarding/invite`

### 2) 앱 메인 (`AppShell`: Sidebar + TopBar + ChatFAB)

- `/`
- `/history`
- `/calendar`
- `/support`
- `/meetings/new`
- `/meetings/context`
- `/meetings/:meetingId/upcoming`
- `/meetings/:meetingId/notes`
- `/meetings/:meetingId/notes/edit`
- `/meetings/:meetingId/wbs`
- `/meetings/:meetingId/reports`
- `/meetings/:meetingId/export`
- `/settings/workspace`
- `/settings/members`
- `/settings/departments`
- `/settings/voice`
- `/settings/integrations`
- `/settings/device`

### 3) 라이브 회의 (`FullscreenLayout`)

- `/live`
- `/live/:meetingId`
- `/live/:meetingId/search` -> `/live/:meetingId` 리다이렉트
- `/live/:meetingId/screen` -> `/live/:meetingId` 리다이렉트
- `/live/:meetingId/speakers` -> `/live/:meetingId` 리다이렉트

> 라이브 보조 기능(검색/화면공유/화자)은 별도 페이지가 아니라 `LivePage` 내부 보조 패널로 통합되어 있습니다.

---

## 최근 반영된 핵심 UX

- 아젠다 페이지 의존 동선 제거 (회의 생성/예정 흐름 단순화)
- 회의 생성 화면에 `회의실 이름` 입력 필드 추가
- 직원 검색 UI 개선:
  - 이름/부서명 검색
  - 부서 단위 일괄 추가
  - 선택 직원 Chip + `X` 제거
- 예정 회의 입장 제한 제거 (항상 입장 가능)
- 라이브 화면에서 보조 기능을 우측 패널로 처리 (메인 화면 유지)
- 설정에 `부서 관리` 페이지 추가

---

## 데이터/타입

- 주요 목업 데이터: `src/data/mockData.ts`
  - `PARTICIPANTS` (부서 정보 포함)
  - `DEPARTMENTS`
  - `MEETINGS` (`roomName` 포함)
- 주요 타입: `src/types/meeting.ts`
  - `Participant.department?`
  - `Department`
  - `Meeting.roomName?`

---

## 디렉터리 개요

```txt
src/
  components/
    chat/
    home/
    layout/
    ui/
  data/
  pages/
    auth/
    onboarding/
    live/
    meetings/
    settings/
  types/
  hooks/
  context/
  api/
  utils/
```

---

## 참고 문서

- `docs/team-share-git-staging-summary.md`: 현재 스테이징 기준 기능 변경 요약
- `docs/backend-db-request-from-frontend-changes.md`: 프론트 변경에 따른 백엔드/DB 요청사항
