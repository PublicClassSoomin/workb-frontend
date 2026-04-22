import type { Integration } from '../types/integrations'

export const INTEGRATIONS: Integration[] = [
  {
    id: 1,
    service: 'jira',
    is_connected: true,
<<<<<<< HEAD
    webhook_url: 'https://workb-team.atlassian.net',
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
=======
    updated_at: new Date().toISOString(),
>>>>>>> main
    name: 'JIRA',
    description: '이슈 자동 생성 및 WBS 매핑',
    icon: '🔵',
  },
  {
    id: 2,
    service: 'slack',
    is_connected: true,
<<<<<<< HEAD
    webhook_url: '#general, #meeting-summary',
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
=======
    updated_at: new Date().toISOString(),
>>>>>>> main
    name: 'Slack',
    description: '회의 요약 및 액션 아이템 알림',
    icon: '💬',
  },
  {
    id: 3,
    service: 'notion',
    is_connected: false,
<<<<<<< HEAD
    webhook_url: null,
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
=======
    updated_at: new Date().toISOString(),
>>>>>>> main
    name: 'Notion',
    description: '회의록 자동 내보내기',
    icon: '📝',
  },
  {
    id: 4,
    service: 'google_calendar',
    is_connected: true,
<<<<<<< HEAD
    webhook_url: 'team@workb.io',
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
=======
    updated_at: new Date().toISOString(),
>>>>>>> main
    name: 'Google Calendar',
    description: '회의 일정 연동 및 자동 등록',
    icon: '📅',
  },
  {
    id: 5,
    service: 'kakao',
    is_connected: false,
<<<<<<< HEAD
    webhook_url: null,
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
=======
    updated_at: new Date().toISOString(),
>>>>>>> main
    name: '카카오톡 알림',
    description: '회의 요약·액션 아이템 알림 발송',
    icon: '💛',
  },
]
