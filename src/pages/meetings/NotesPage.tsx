import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Edit2,
  Share2,
  CheckSquare,
  AlertCircle,
  MessageSquare,
  Clock,
  Sparkles,
  Loader2,
  X,
  Check,
  Pencil,
} from "lucide-react";
import { MEETINGS } from "../../data/mockData";
import { readMeetingSnapshotForRoute } from "../../utils/meetingRoutes";
import type { Meeting } from "../../types/meeting";
import { AvatarGroup } from "../../components/ui/Avatar";
import { formatDateFull } from "../../utils/format";
import {
  fetchMeetingUtterances,
  reassignSpeaker,
  updateUtteranceContent,
  type UtteranceItem,
} from "../../api/intelligence";
import {
  fetchWorkspaceMembers,
  type WorkspaceMemberApiItem,
} from "../../api/workspaceMembers";
import { getCurrentWorkspaceId } from "../../api/client";

/** speaker_label → 고정 색상 매핑 (같은 화자는 항상 같은 색) */
const SPEAKER_COLORS = [
  "#6b78f6",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
  "#eab308",
  "#ef4444",
];

function getSpeakerColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) & 0xffffffff;
  }
  return SPEAKER_COLORS[Math.abs(hash) % SPEAKER_COLORS.length];
}

/** start(초) → 분:초 포맷 */
function formatTime(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

const DECISIONS = [
  "사이드바 컬러 시스템 확정 (#5668F3 기반)",
  "다음 스프린트 컴포넌트 구현 착수",
];

const OPEN_ISSUES = [
  "모바일 반응형 레이아웃 검토 필요",
  "다크모드 색상 토큰 세부 조정 미완",
];

const ACTION_ITEMS_NOTES = [
  {
    id: "n1",
    text: "API 인증 엔드포인트 설계 문서 작성",
    assignee: "박준혁",
    due: "2일 후",
    done: false,
  },
  {
    id: "n2",
    text: "홈 대시보드 컴포넌트 구현",
    assignee: "김수민",
    due: "3일 후",
    done: false,
  },
  {
    id: "n3",
    text: "디자인 시스템 토큰 확정",
    assignee: "이지현",
    due: "어제",
    done: true,
  },
];

export default function NotesPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const meeting: Meeting =
    MEETINGS.find((m) => m.id === meetingId) ??
    readMeetingSnapshotForRoute(meetingId) ??
    MEETINGS.find((m) => m.status === "completed") ??
    MEETINGS[0];

  const [utterances, setUtterances] = useState<UtteranceItem[]>([]);
  const [utterancesLoading, setUtterancesLoading] = useState(true);
  const [utterancesError, setUtterancesError] = useState<string | null>(null);

  // 워크스페이스 멤버
  const [members, setMembers] = useState<WorkspaceMemberApiItem[]>([]);
  useEffect(() => {
    const wsId = getCurrentWorkspaceId();
    if (wsId)
      fetchWorkspaceMembers(wsId)
        .then(setMembers)
        .catch(() => {});
  }, []);

  // 화자 수정 모달 상태
  interface SpeakerModal {
    seq: number;
    currentLabel: string;
    selectedMemberId: number | null;
    selectedMemberName: string;
    customName: string;
    activeTab: "member" | "custom";
    applyAll: boolean;
  }
  const [speakerModal, setSpeakerModal] = useState<SpeakerModal | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  function openSpeakerModal(u: UtteranceItem) {
    if (!isEditMode) return;
    setSpeakerModal({
      seq: u.seq,
      currentLabel: u.speaker_label,
      selectedMemberId: null,
      selectedMemberName: "",
      customName: "",
      activeTab: "member",
      applyAll: true,
    });
  }

  async function handleModalSave() {
    if (!meetingId || !speakerModal) return;
    const newLabel =
      speakerModal.activeTab === "custom"
        ? speakerModal.customName.trim()
        : speakerModal.selectedMemberName.trim();
    const newId =
      speakerModal.activeTab === "custom"
        ? null
        : speakerModal.selectedMemberId;
    if (!newLabel) return;

    setModalSaving(true);
    try {
      await reassignSpeaker(meetingId, {
        old_speaker_label: speakerModal.currentLabel,
        new_speaker_id: newId,
        new_speaker_label: newLabel,
        seq: speakerModal.applyAll ? undefined : speakerModal.seq,
        apply_all: speakerModal.applyAll,
      });
      setUtterances((prev) =>
        prev.map((u) => {
          if (speakerModal.applyAll) {
            return u.speaker_label === speakerModal.currentLabel
              ? { ...u, speaker_id: newId, speaker_label: newLabel }
              : u;
          } else {
            return u.seq === speakerModal.seq
              ? { ...u, speaker_id: newId, speaker_label: newLabel }
              : u;
          }
        }),
      );
      setSpeakerModal(null);
    } finally {
      setModalSaving(false);
    }
  }

  function refreshUtterances() {
    if (!meetingId) return;
    setUtterancesLoading(true);
    setUtterancesError(null);
    fetchMeetingUtterances(meetingId)
      .then((data) => setUtterances(data.utterances))
      .catch(() => setUtterancesError("발화 데이터를 불러오지 못했습니다."))
      .finally(() => setUtterancesLoading(false));
  }

  // 수정 모드 토글
  const [isEditMode, setIsEditMode] = useState(false);

  function enterEditMode() {
    setIsEditMode(true);
  }

  function exitEditMode() {
    setIsEditMode(false);
    // 편집 중인 항목 있으면 취소
    cancelEditContent();
  }

  // 발화 텍스트 인라인 편집 상태: { seq → editingText }
  const [editingSeq, setEditingSeq] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [contentSaving, setContentSaving] = useState(false);

  function startEditContent(u: UtteranceItem) {
    if (!isEditMode) return;
    setEditingSeq(u.seq);
    setEditingText(u.content);
  }

  function cancelEditContent() {
    setEditingSeq(null);
    setEditingText("");
  }

  async function saveEditContent(seq: number) {
    if (!meetingId) return;
    const trimmed = editingText.trim();
    if (!trimmed) return;
    setContentSaving(true);
    try {
      await updateUtteranceContent(meetingId, seq, trimmed);
      setUtterances((prev) =>
        prev.map((u) => (u.seq === seq ? { ...u, content: trimmed } : u)),
      );
      setEditingSeq(null);
      setEditingText("");
    } finally {
      setContentSaving(false);
    }
  }

  useEffect(() => {
    refreshUtterances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* 화자 수정 모달 */}
      {speakerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSpeakerModal(null);
          }}
        >
          <div className="w-full max-w-sm mx-4 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Pencil size={14} className="text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  화자 수정
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
                  {speakerModal.currentLabel}
                </span>
              </div>
              <button
                onClick={() => setSpeakerModal(null)}
                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted/60 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-border">
              {(["member", "custom"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() =>
                    setSpeakerModal((prev) =>
                      prev ? { ...prev, activeTab: tab } : prev,
                    )
                  }
                  className={[
                    "flex-1 py-2 text-sm font-medium transition-colors",
                    speakerModal.activeTab === tab
                      ? "border-b-2 border-accent text-accent"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {tab === "member" ? "멤버 선택" : "직접 입력"}
                </button>
              ))}
            </div>

            {/* 탭 내용 */}
            <div className="px-4 py-3 max-h-60 overflow-y-auto">
              {speakerModal.activeTab === "member" ? (
                members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    워크스페이스 멤버가 없습니다.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {members.map((m) => {
                      const isSelected =
                        speakerModal.selectedMemberId === m.user_id;
                      return (
                        <button
                          key={m.user_id}
                          type="button"
                          onClick={() =>
                            setSpeakerModal((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    selectedMemberId: m.user_id,
                                    selectedMemberName: m.name,
                                  }
                                : prev,
                            )
                          }
                          className={[
                            "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-colors text-left",
                            isSelected
                              ? "bg-accent/15 border border-accent/40"
                              : "hover:bg-muted/60 border border-transparent",
                          ].join(" ")}
                        >
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: getSpeakerColor(m.name) }}
                          >
                            {m.name[0]}
                          </span>
                          <span className="flex-1 font-medium text-foreground">
                            {m.name}
                          </span>
                          {m.department && (
                            <span className="text-muted-foreground text-xs">
                              {m.department}
                            </span>
                          )}
                          {isSelected && (
                            <Check size={14} className="text-accent shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="py-2">
                  <input
                    type="text"
                    value={speakerModal.customName}
                    onChange={(e) =>
                      setSpeakerModal((prev) =>
                        prev ? { ...prev, customName: e.target.value } : prev,
                      )
                    }
                    placeholder="화자 이름을 입력하세요"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* 전체 변경 체크박스 + 하단 버튼 */}
            <div className="px-4 pb-4 pt-2 border-t border-border space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() =>
                    setSpeakerModal((prev) =>
                      prev ? { ...prev, applyAll: !prev.applyAll } : prev,
                    )
                  }
                  className={[
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                    speakerModal.applyAll
                      ? "bg-accent border-accent"
                      : "bg-background border-border",
                  ].join(" ")}
                >
                  {speakerModal.applyAll && (
                    <Check size={10} className="text-white" />
                  )}
                </div>
                <span className="text-sm text-foreground">전체 변경</span>
                <span className="text-xs text-muted-foreground">
                  (같은 화자의 모든 발화 변경)
                </span>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setSpeakerModal(null)}
                  className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleModalSave}
                  disabled={
                    modalSaving ||
                    (speakerModal.activeTab === "member"
                      ? !speakerModal.selectedMemberName
                      : !speakerModal.customName.trim())
                  }
                  className="flex-1 h-9 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {modalSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  변경 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-accent" />
            <span className="text-mini text-accent font-medium">
              AI 자동 생성 회의록
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {meeting.title}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-mini text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={11} /> {formatDateFull(meeting.startAt)}
            </span>
            <span>{meeting.participants.length}명 참석</span>
            <AvatarGroup participants={meeting.participants} max={4} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate(`/meetings/${meetingId}/notes/edit`)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
          >
            <Edit2 size={13} /> 편집
          </button>
          <button
            onClick={() => navigate(`/meetings/${meetingId}/export`)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
          >
            <Share2 size={13} /> 공유
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        {meeting.summary && (
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              요약
            </h2>
            <p className="text-sm text-foreground leading-relaxed bg-muted/30 px-4 py-3 rounded-lg border border-border">
              {meeting.summary}
            </p>
          </section>
        )}

        {/* Decisions */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <CheckSquare size={15} className="text-blue-500" /> 결정사항
          </h2>
          <ul className="space-y-1.5">
            {DECISIONS.map((d, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-micro font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {d}
              </li>
            ))}
          </ul>
        </section>

        {/* Open Issues */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <AlertCircle size={15} className="text-yellow-500" /> 미결 이슈
          </h2>
          <ul className="space-y-1.5">
            {OPEN_ISSUES.map((issue, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <AlertCircle
                  size={14}
                  className="text-yellow-500 shrink-0 mt-0.5"
                />
                {issue}
              </li>
            ))}
          </ul>
        </section>

        {/* Action items */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <CheckSquare size={15} className="text-green-500" /> 액션 아이템
          </h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-3 py-2 text-mini font-medium text-muted-foreground">
                    내용
                  </th>
                  <th className="text-left px-3 py-2 text-mini font-medium text-muted-foreground">
                    담당자
                  </th>
                  <th className="text-left px-3 py-2 text-mini font-medium text-muted-foreground">
                    기한
                  </th>
                  <th className="text-left px-3 py-2 text-mini font-medium text-muted-foreground">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {ACTION_ITEMS_NOTES.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td
                      className={`px-3 py-2.5 ${item.done ? "line-through text-muted-foreground" : ""}`}
                    >
                      {item.text}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {item.assignee}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {item.due}
                    </td>
                    <td className="px-3 py-2.5">
                      {item.done ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-micro font-medium">
                          완료
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-micro font-medium">
                          진행 중
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Full transcript */}
        <section>
          {/* 섹션 헤더 — 수정 모드 토글 */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <MessageSquare size={15} className="text-muted-foreground" /> 전문
              타임라인
            </h2>
            {isEditMode ? (
              <button
                onClick={exitEditMode}
                disabled={utterancesLoading}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {utterancesLoading ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Check size={11} />
                )}
                수정완료
              </button>
            ) : (
              <button
                onClick={enterEditMode}
                disabled={utterancesLoading || utterances.length === 0}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted/50 transition-colors disabled:opacity-40"
              >
                <Pencil size={11} />
                수정하기
              </button>
            )}
          </div>

          {/* 수정 모드 안내 배너 */}
          {isEditMode && !utterancesLoading && utterances.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 mb-3">
              <Pencil size={11} className="shrink-0" />
              수정 모드 — 화자 이름 또는 발화 텍스트를 클릭해 편집하세요.
            </div>
          )}

          {utterancesLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 size={16} className="animate-spin" /> 발화 데이터 로딩
              중...
            </div>
          )}

          {!utterancesLoading && utterancesError && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 py-4 px-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <AlertCircle size={14} className="shrink-0" /> {utterancesError}
            </div>
          )}

          {!utterancesLoading &&
            !utterancesError &&
            utterances.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                저장된 발화 데이터가 없습니다.
              </p>
            )}

          {!utterancesLoading && !utterancesError && utterances.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {utterances.map((u) => {
                const color = getSpeakerColor(u.speaker_label);
                const initial = u.speaker_label.trim()[0] ?? "?";

                return (
                  <div key={u.seq} className="flex gap-3 group">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-mini font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: color }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        {/* 화자 이름 — 수정 모드일 때만 클릭 가능 */}
                        {isEditMode ? (
                          <button
                            type="button"
                            onClick={() => openSpeakerModal(u)}
                            className="text-sm font-medium flex items-center gap-1 rounded px-1 -mx-1 transition-colors hover:bg-muted/60 cursor-pointer text-foreground group-hover:text-accent"
                            title="클릭해서 화자 수정"
                          >
                            <Pencil
                              size={11}
                              className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
                            />
                            {u.speaker_label}
                          </button>
                        ) : (
                          <span className="text-sm font-medium text-foreground">
                            {u.speaker_label}
                          </span>
                        )}
                        <span className="text-mini text-muted-foreground">
                          {formatTime(u.start)}
                        </span>
                      </div>
                      {/* 발화 텍스트 — 수정 모드일 때만 인라인 편집 */}
                      {isEditMode && editingSeq === u.seq ? (
                        <div className="mt-0.5">
                          <textarea
                            className="w-full text-sm text-foreground leading-relaxed bg-muted/30 border border-accent/40 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
                            rows={Math.max(
                              2,
                              Math.ceil(editingText.length / 60),
                            )}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                (e.metaKey || e.ctrlKey)
                              ) {
                                saveEditContent(u.seq);
                              }
                              if (e.key === "Escape") cancelEditContent();
                            }}
                            autoFocus
                          />
                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              onClick={() => saveEditContent(u.seq)}
                              disabled={contentSaving || !editingText.trim()}
                              className="flex items-center gap-1 h-6 px-2 rounded bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90 disabled:opacity-40 transition-colors"
                            >
                              {contentSaving ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <Check size={10} />
                              )}
                              저장
                            </button>
                            <button
                              onClick={cancelEditContent}
                              className="flex items-center gap-1 h-6 px-2 rounded border border-border text-xs hover:bg-muted/50 transition-colors"
                            >
                              <X size={10} /> 취소
                            </button>
                            <span className="text-xs text-muted-foreground ml-1">
                              ⌘Enter로 저장
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p
                          className={[
                            "text-sm text-foreground leading-relaxed rounded px-1 -mx-1 transition-colors",
                            isEditMode
                              ? "cursor-text hover:bg-muted/30"
                              : "cursor-default",
                          ].join(" ")}
                          title={
                            isEditMode ? "클릭해서 텍스트 수정" : undefined
                          }
                          onClick={
                            isEditMode ? () => startEditContent(u) : undefined
                          }
                        >
                          {u.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Link
            to={`/meetings/${meetingId}/wbs`}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center"
          >
            WBS 보기
          </Link>
          <Link
            to={`/meetings/${meetingId}/reports`}
            className="flex-1 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} /> 보고서 생성
          </Link>
        </div>
      </div>
    </div>
  );
}
