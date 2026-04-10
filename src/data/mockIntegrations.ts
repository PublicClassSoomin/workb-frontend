import type { Integration } from '../types/integrations'

export const INTEGRATIONS: Integration[] = [
  {
    id: 'jira',
    name: 'JIRA',
    description: '이슈 자동 생성 및 WBS 매핑',
    status: 'connected',
    connectedAs: 'workb-team.atlassian.net',
    lastSynced: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    icon: '🔵',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: '회의 요약 및 액션 아이템 알림',
    status: 'connected',
    connectedAs: '#general, #meeting-summary',
    lastSynced: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    icon: '💬',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: '회의록 자동 내보내기',
    status: 'disconnected',
    icon: '📝',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: '회의 일정 연동 및 자동 등록',
    status: 'connected',
    connectedAs: 'team@workb.io',
    lastSynced: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    icon: '📅',
  },
  {
    id: 'kakao',
    name: '카카오톡 알림',
    description: '회의 요약·액션 아이템 알림 발송',
    status: 'disconnected',
    icon: '💛',
  },
]
