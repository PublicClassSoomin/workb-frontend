import { apiRequest } from './client'

export interface SendMessageResponse {
    session_id: string
    function_type: string
    answer: string
    result: Record<string, unknown>
    timestamp: string
}

export interface HistoryMessage {
    role: 'user' | 'assistant'
    content: string
    function_type: string
    timestamp: string
}

export interface HistoryResponse {
    messages: HistoryMessage[]
}

// 메시지 전송
// sessionId 없으면 서버가 새 UUID 발급 -> 응답의 session_id를 sessionStorage에 저장해야 함
export async function sendChatMessage(
    workspaceId: number,
    message: string,
    meetingId: number | null,
    sessionId: string | null,
): Promise<SendMessageResponse> {
    const params = sessionId ? `session_id=${sessionId}` : ''
    return apiRequest<SendMessageResponse> (
        `/knowledges/workspace/${workspaceId}/chatbot/message?${params}`,
        {
            method: 'POST',
            body: JSON.stringify({
                message,
                meeting_id: meetingId ?? undefined,
            }),
        },
    )
}

// 대화 히스토리 조회 - 탭 새로 열 때 이전 대화 복원용
export async function getChatHistory(
    workspaceId: number,
    sessionId: string,
): Promise<HistoryResponse>{
    return apiRequest<HistoryResponse> (
        `/knowledges/workspace/${workspaceId}/chatbot/history?session_id=${sessionId}`,
    )
}