import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Square,
  Search,
  Monitor,
  Users,
  MessageSquare,
  CheckSquare,
  Zap,
  Globe,
  Database,
  History,
  ExternalLink,
  Sparkles,
  FileText,
  BarChart2,
  CheckCircle,
  AlertCircle,
  UserPlus,
  X,
} from "lucide-react";
import clsx from "clsx";
import { MEETINGS, PARTICIPANTS } from "../../data/mockData";
import { useLiveSTT } from "../../hooks/useLiveSTT";
import LiveScreenPage from "../../pages/live/LiveScreenPage";
import { LIVE_TRANSCRIPT } from "../../data/mockTranscript";
import { readMeetingSnapshotForRoute } from "../../utils/meetingRoutes";
import type { Meeting } from "../../types/meeting";
import { endWorkspaceMeeting } from "../../api/meetings";
import { getCurrentWorkspaceId } from "../../utils/workspace";

// ── Panel types ───────────────────────────────────────────────────────────
type MainPanel = "decisions" | "actions" | "chat";
type AuxPanel = "search" | "screen" | "speakers" | null;

// ── Search mock data ──────────────────────────────────────────────────────
type SearchSource = "all" | "web" | "db" | "history";

const MOCK_RESULTS = [
  {
    id: "r1",
    source: "web" as const,
    title: "Redis Streams 공식 문서",
    snippet:
      "Redis Streams는 append-only log 자료구조로 실시간 데이터 처리에 최적화...",
  },
  {
    id: "r2",
    source: "db" as const,
    title: "[내부] STT API 설계 문서 v2",
    snippet: "화자 분리 모델 연동 스펙 및 Redis 저장 포맷 정의.",
  },
  {
    id: "r3",
    source: "history" as const,
    title: "스프린트 플래닝 #12 — Redis 스키마 논의",
    snippet:
      "STT 전문을 Redis Streams에 저장하는 방식으로 결정. 보존 기간 7일 설정.",
  },
];

// ── Speakers mock data ────────────────────────────────────────────────────
const MOCK_SPEAKERS = [
  {
    id: "p1",
    name: "김수민",
    status: "matched" as const,
    confidence: 98,
    utterances: 24,
  },
  {
    id: "p2",
    name: "이지현",
    status: "matched" as const,
    confidence: 95,
    utterances: 18,
  },
  {
    id: "p3",
    name: "박준혁",
    status: "matched" as const,
    confidence: 91,
    utterances: 15,
  },
  {
    id: "p4",
    name: "최은영",
    status: "unmatched" as const,
    confidence: 0,
    utterances: 7,
  },
];

// ── Speaker metadata ─────────────────────────────────────────────────────
const SPEAKER_PALETTE = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

/** 문자열을 팔레트 인덱스로 해시 */
function hashIdx(s: string): number {
  return [...s].reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function speakerMeta(speaker: string | number): {
  label: string;
  color: string;
} {
  const s = String(speaker ?? "").trim();
  return {
    label: s,
    color: SPEAKER_PALETTE[hashIdx(s) % SPEAKER_PALETTE.length],
  };
}

// ─────────────────────────────────────────────────────────────────────────
type PanelItem = {
  id: string;
  speakerColor: string;
  speakerName: string;
  text: string;
};

export default function LivePage() {
  const { meetingId = "2" } = useParams();
  const navigate = useNavigate();
  const meeting = MEETINGS.find((m) => m.id === meetingId) ?? MEETINGS[0];

  // STT WebSocket hook
  const {
    wsStatus,
    liveText,
    diarization,
    errorMsg,
    micOn,
    toggleMic,
    stopMeeting,
  } = useLiveSTT(meetingId);

  // Controls
  const [camOn, setCamOn] = useState(false);

  // Main right panel (decisions / actions / chat)
  const [mainPanel, setMainPanel] = useState<MainPanel>("decisions");
  const [chatInput, setChatInput] = useState("");

  // Aux panel (search / screen / speakers) — null = closed
  const [auxPanel, setAuxPanel] = useState<AuxPanel>(null);

  // Search panel state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSource, setSearchSource] = useState<SearchSource>("all");
  const [searched, setSearched] = useState(false);

  // Speakers panel state
  const [speakerAssignments, setSpeakerAssignments] = useState<
    Record<string, string>
  >({});

  const decisions: PanelItem[] = [];
  const actions: PanelItem[] = [];
  const displaySegments = diarization;

  // 자동 스크롤
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displaySegments, liveText]);

  // 처리 완료 시 회의록 화면으로 자동 이동
  useEffect(() => {
    if (wsStatus === "done") {
      navigate(`/meetings/${meetingId}/notes`);
    }
  }, [wsStatus, meetingId, navigate]);

  const elapsedSec = meeting.startAt
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(meeting.startAt).getTime()) / 1000),
      )
    : 0;
  const elapsed = `${String(Math.floor(elapsedSec / 60)).padStart(2, "0")}:${String(elapsedSec % 60).padStart(2, "0")}`;

  function toggleAux(panel: Exclude<AuxPanel, null>) {
    setAuxPanel((prev) => (prev === panel ? null : panel));
  }

  const filteredSearchResults = MOCK_RESULTS.filter(
    (r) => searchSource === "all" || r.source === searchSource,
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);
  }

  function assignSpeaker(speakerId: string, participantId: string) {
    setSpeakerAssignments((prev) => ({ ...prev, [speakerId]: participantId }));
  }

  // ── Panel content renderers ──────────────────────────────────────────
  function renderMainPanelContent() {
    if (mainPanel === "decisions") {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-mini font-medium text-muted-foreground uppercase tracking-wide mb-1">
            실시간 감지된 결정사항
          </p>
          {decisions.map((d) => (
            <div
              key={d.id}
              className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-micro font-bold"
                  style={{ backgroundColor: d.speakerColor }}
                >
                  {d.speakerName[0]}
                </span>
                <span className="text-mini font-medium text-foreground">
                  {d.speakerName}
                </span>
              </div>
              <p className="text-mini text-foreground">{d.text}</p>
            </div>
          ))}
          {decisions.length === 0 && (
            <p className="text-mini text-muted-foreground">
              아직 감지된 결정사항이 없습니다.
            </p>
          )}
        </div>
      );
    }
    if (mainPanel === "actions") {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-mini font-medium text-muted-foreground uppercase tracking-wide mb-1">
            실시간 감지된 액션아이템
          </p>
          {actions.map((a) => (
            <div
              key={a.id}
              className="p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-micro font-bold"
                  style={{ backgroundColor: a.speakerColor }}
                >
                  {a.speakerName[0]}
                </span>
                <span className="text-mini font-medium text-foreground">
                  {a.speakerName}
                </span>
              </div>
              <p className="text-mini text-foreground">{a.text}</p>
            </div>
          ))}
          {actions.length === 0 && (
            <p className="text-mini text-muted-foreground">
              아직 감지된 액션아이템이 없습니다.
            </p>
          )}
        </div>
      );
    }
    // chat
    return (
      <div className="flex flex-col gap-2">
        <p className="text-mini font-medium text-muted-foreground uppercase tracking-wide mb-1">
          AI 챗봇 패널
        </p>
        <div className="p-2.5 rounded-lg bg-accent-subtle border border-accent/20">
          <p className="text-mini text-accent font-medium mb-1">가능한 기능</p>
          <div className="flex flex-col gap-1">
            {[
              "현재까지 내용 요약",
              "인터넷 자료 검색",
              "회사 DB 조회",
              "데이터 시각화",
              "일정 자동 등록",
            ].map((f) => (
              <button
                key={f}
                onClick={() => setChatInput(f)}
                className="text-left text-mini text-accent/80 hover:text-accent transition-colors"
              >
                • {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg border border-border bg-background">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="무엇이든 질문하세요..."
            className="flex-1 bg-transparent outline-none text-mini placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                console.log("TODO: AI chat", chatInput);
                setChatInput("");
              }
            }}
          />
          <button className="text-accent" aria-label="전송">
            <MessageSquare size={13} />
          </button>
        </div>
      </div>
    );
  }

  function renderAuxPanelContent() {
    if (auxPanel === "search") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-sm font-semibold text-foreground">
              즉석 자료 검색
            </p>
            <button
              onClick={() => setAuxPanel(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="닫기"
            >
              <X size={15} />
            </button>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 mb-3 shrink-0">
            <div className="flex items-center gap-1.5 flex-1 h-8 px-2.5 rounded border border-border bg-background">
              <Search size={12} className="text-muted-foreground shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="자연어로 검색..."
                className="flex-1 bg-transparent outline-none text-mini placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="h-8 px-3 rounded bg-accent text-accent-foreground text-mini font-medium hover:bg-accent/90 transition-colors shrink-0"
            >
              검색
            </button>
          </form>
          <div className="flex gap-1.5 mb-3 flex-wrap shrink-0">
            {(
              [
                { id: "all", label: "전체", icon: Search },
                { id: "web", label: "인터넷", icon: Globe },
                { id: "db", label: "회사 DB", icon: Database },
                { id: "history", label: "과거 회의", icon: History },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSearchSource(id)}
                className={clsx(
                  "flex items-center gap-1 px-2 py-1 rounded border text-mini transition-colors",
                  searchSource === id
                    ? "border-accent bg-accent-subtle text-accent"
                    : "border-border text-muted-foreground hover:border-foreground",
                )}
              >
                <Icon size={10} /> {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {searched ? (
              filteredSearchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-2.5 rounded-lg border border-border bg-background"
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <h3 className="text-mini font-medium text-foreground">
                      {result.title}
                    </h3>
                    <span
                      className={clsx(
                        "px-1 py-0.5 rounded text-micro font-medium shrink-0",
                        result.source === "web"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : result.source === "db"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                      )}
                    >
                      {result.source === "web"
                        ? "인터넷"
                        : result.source === "db"
                          ? "회사 DB"
                          : "과거 회의"}
                    </span>
                  </div>
                  <p className="text-micro text-muted-foreground">
                    {result.snippet}
                  </p>
                  <button
                    className="flex items-center gap-1 text-micro text-accent hover:underline mt-1.5"
                    onClick={() => {}}
                  >
                    <ExternalLink size={10} /> 원문 보기
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-8">
                <Search size={24} className="text-muted-foreground/30" />
                <p className="text-mini text-muted-foreground">
                  검색어를 입력하면 인터넷, 회사 DB, 과거 회의를 통합
                  검색합니다.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (auxPanel === "screen") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-sm font-semibold text-foreground">
              화면 공유 해석
            </p>
            <button
              onClick={() => setAuxPanel(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="닫기"
            >
              <X size={15} />
            </button>
          </div>
          {/* compact=true: 패널 안에 맞는 작은 사이즈 */}
          <LiveScreenPage meetingId={Number(meetingId)} compact />
        </div>
      );
    }

    if (auxPanel === "speakers") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-sm font-semibold text-foreground">
              화자 등록 · 확인
            </p>
            <button
              onClick={() => setAuxPanel(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="닫기"
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {MOCK_SPEAKERS.map((speaker) => {
              const p = PARTICIPANTS.find((q) => q.id === speaker.id);
              const assigned = speakerAssignments[speaker.id];
              const assignedP = PARTICIPANTS.find((q) => q.id === assigned);
              return (
                <div
                  key={speaker.id}
                  className="p-2.5 rounded-lg border border-border bg-background"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-mini"
                      style={{ backgroundColor: p?.color ?? "#888" }}
                    >
                      {speaker.status === "unmatched" ? "?" : speaker.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-mini font-medium text-foreground">
                          {assigned
                            ? assignedP?.name
                            : speaker.status === "unmatched"
                              ? "미인식 화자"
                              : speaker.name}
                        </span>
                        {speaker.status === "matched" && !assigned ? (
                          <span className="flex items-center gap-0.5 text-micro text-green-600 dark:text-green-400">
                            <CheckCircle size={10} /> {speaker.confidence}%
                          </span>
                        ) : speaker.status === "unmatched" && !assigned ? (
                          <span className="flex items-center gap-0.5 text-micro text-yellow-600 dark:text-yellow-400">
                            <AlertCircle size={10} /> 수동 교정
                          </span>
                        ) : null}
                      </div>
                      <span className="text-micro text-muted-foreground">
                        {speaker.utterances}회 발화
                      </span>
                    </div>
                  </div>
                  {(speaker.status === "unmatched" || assigned) && (
                    <select
                      value={assigned ?? ""}
                      onChange={(e) =>
                        assignSpeaker(speaker.id, e.target.value)
                      }
                      className="mt-2 w-full h-7 px-2 rounded border border-border bg-card text-mini outline-none"
                    >
                      <option value="">화자 선택</option>
                      {PARTICIPANTS.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => console.log("register new speaker")}
            className="flex items-center gap-1.5 w-full h-8 px-3 rounded border border-dashed border-border text-mini text-muted-foreground hover:border-accent hover:text-accent transition-colors mt-2 shrink-0"
          >
            <UserPlus size={13} /> 신규 참석자 즉시 등록
          </button>
          <button
            onClick={() => setAuxPanel(null)}
            className="w-full h-9 rounded bg-accent text-accent-foreground text-mini font-medium hover:bg-accent/90 transition-colors mt-2 shrink-0"
          >
            저장하고 닫기
          </button>
        </div>
      );
    }

    return null;
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-background">
      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className={clsx(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-mini font-medium shrink-0",
                wsStatus === "error"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : wsStatus === "done"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : wsStatus === "finalizing"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
              )}
            >
              <span
                className={clsx(
                  "w-1.5 h-1.5 rounded-full",
                  wsStatus === "error"
                    ? "bg-red-500"
                    : wsStatus === "done"
                      ? "bg-blue-500"
                      : wsStatus === "finalizing"
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-green-500 animate-pulse",
                )}
              />
              {wsStatus === "connecting"
                ? "연결 중"
                : wsStatus === "connected"
                  ? "진행 중"
                  : wsStatus === "finalizing"
                    ? "처리 중"
                    : wsStatus === "done"
                      ? "완료"
                      : wsStatus === "error"
                        ? "오류"
                        : "진행 중"}
            </span>
            <h1 className="text-sm font-medium text-foreground truncate">
              {meeting.title}
            </h1>
            <span className="text-mini text-muted-foreground shrink-0">
              {elapsed}
            </span>
          </div>

          {/* Aux panel toggle buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {[
              {
                id: "search" as const,
                label: "검색",
                Icon: Search,
                title: "즉석 자료 검색",
              },
              {
                id: "screen" as const,
                label: "화면공유",
                Icon: Monitor,
                title: "화면 공유 분석",
              },
              {
                id: "speakers" as const,
                label: "화자",
                Icon: Users,
                title: "화자 등록 · 확인",
              },
            ].map(({ id, label, Icon, title }) => (
              <button
                key={id}
                onClick={() => toggleAux(id)}
                title={title}
                className={clsx(
                  "flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded text-mini transition-colors",
                  auxPanel === id
                    ? "bg-accent-subtle text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-pressed={auxPanel === id}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={clsx(
                "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                micOn
                  ? "bg-muted hover:bg-muted-foreground/20"
                  : "bg-red-500 text-white hover:bg-red-600",
              )}
              aria-label={micOn ? "마이크 끄기" : "마이크 켜기"}
            >
              {micOn ? <Mic size={15} /> : <MicOff size={15} />}
            </button>
            <button
              onClick={() => setCamOn((v) => !v)}
              className={clsx(
                "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                camOn
                  ? "bg-muted hover:bg-muted-foreground/20"
                  : "bg-muted text-muted-foreground hover:bg-muted-foreground/20",
              )}
              aria-label={camOn ? "카메라 끄기" : "카메라 켜기"}
            >
              {camOn ? <Camera size={15} /> : <CameraOff size={15} />}
            </button>
            {wsStatus === "done" ? (
              <button
                onClick={() => navigate(`/meetings/${meetingId}/notes`)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-green-600 text-white text-mini font-medium hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={12} /> 회의록 보기
              </button>
            ) : (
              <button
                onClick={stopMeeting}
                disabled={wsStatus === "finalizing"}
                className={clsx(
                  "flex items-center gap-1.5 h-8 px-3 rounded-lg text-white text-mini font-medium transition-colors",
                  wsStatus === "finalizing"
                    ? "bg-yellow-500 opacity-75 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600",
                )}
              >
                {wsStatus === "finalizing" ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    처리 중
                  </>
                ) : (
                  <>
                    <Square size={12} fill="currentColor" /> 종료
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile panel tab strip */}
        <div
          role="tablist"
          className="lg:hidden flex border-b border-border bg-card shrink-0"
        >
          {(
            [
              { id: "decisions", label: "결정", icon: CheckSquare },
              { id: "actions", label: "액션", icon: Zap },
              { id: "chat", label: "AI 챗", icon: MessageSquare },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mainPanel === id}
              onClick={() =>
                setMainPanel((prev) => (prev === id ? "decisions" : id))
              }
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-mini font-medium transition-colors border-b-2",
                mainPanel === id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* STT Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={13} className="text-accent" />
              <span className="text-mini font-medium text-muted-foreground uppercase tracking-wide">
                실시간 STT 발화 스트림
              </span>
              {wsStatus === "connecting" && (
                <span className="flex items-center gap-1 text-mini text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
                  연결 중
                </span>
              )}
              {wsStatus === "connected" && (
                <span className="flex items-center gap-1 text-mini text-green-600 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  연결됨
                </span>
              )}
              {wsStatus === "finalizing" && (
                <span className="flex items-center gap-1 text-mini text-yellow-600 dark:text-yellow-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  오프라인 처리 중
                </span>
              )}
              {wsStatus === "done" && (
                <span className="flex items-center gap-1 text-mini text-green-600 dark:text-green-400">
                  <CheckCircle size={12} />
                  처리 완료
                </span>
              )}
            </div>

            {/* 에러 배너 */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-mini text-red-700 dark:text-red-400">
                  {errorMsg}
                </p>
              </div>
            )}

            {/* 오프라인 처리 완료 배너 */}
            {wsStatus === "done" && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 shrink-0" />
                  <p className="text-mini text-green-700 dark:text-green-400">
                    오프라인 처리 완료 — 최종 발화 데이터가 저장되었습니다.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/meetings/${meetingId}/notes`)}
                  className="shrink-0 flex items-center gap-1 h-7 px-3 rounded bg-green-600 text-white text-mini font-medium hover:bg-green-700 transition-colors"
                >
                  회의록 보기
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* 연결 중 플레이스홀더 */}
              {wsStatus === "connecting" && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  <p className="text-mini text-muted-foreground">
                    STT 스트림 연결 중...
                  </p>
                </div>
              )}

              {/* 빈 상태 */}
              {displaySegments.length === 0 &&
                wsStatus === "connected" &&
                !liveText && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <Mic size={24} className="text-muted-foreground/30" />
                    <p className="text-mini text-muted-foreground">
                      발화가 감지되면 여기에 표시됩니다.
                    </p>
                  </div>
                )}

              {/* 화자 분리 말풍선 (실시간 diarization 또는 최종 utterances) */}
              {displaySegments.map((seg) => {
                const { label, color } = speakerMeta(seg.speaker);
                const ts = new Date(seg.timestamp);
                const timeLabel = isNaN(ts.getTime())
                  ? seg.timestamp
                  : `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
                return (
                  <div
                    key={`${seg.speaker_id}-${seg.timestamp}`}
                    className="flex gap-3 p-3 rounded-lg bg-card border border-border"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-mini font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: color }}
                    >
                      {label[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {label}
                        </span>
                        <span className="text-mini text-muted-foreground">
                          {timeLabel}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{seg.content}</p>
                    </div>
                  </div>
                );
              })}

              {/* 라이브 텍스트 (항상 맨 아래) — diarization 이전 partial 텍스트 */}
              {liveText && wsStatus === "connected" && (
                <div className="flex gap-3 p-3 rounded-lg bg-card border border-border">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Mic size={14} className="text-accent animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        인식 중
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      {liveText}
                      <span className="inline-block w-0.5 h-4 bg-accent align-text-bottom ml-0.5 animate-pulse" />
                    </p>
                  </div>
                </div>
              )}

              {/* 라이브 커서 (liveText 없을 때만) */}
              {(wsStatus === "connected" || wsStatus === "finalizing") &&
                !liveText && (
                  <div className="flex gap-3 p-3 rounded-lg bg-card border border-border">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <Mic size={14} className="text-accent animate-pulse" />
                    </div>
                    <div className="flex-1 flex items-center gap-1">
                      {wsStatus === "finalizing" ? (
                        <>
                          <span className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin mr-1" />
                          <span className="text-mini text-muted-foreground">
                            오프라인 파이프라인 실행 중...
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            className="w-2 h-2 rounded-full bg-accent animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-2 h-2 rounded-full bg-accent animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-2 h-2 rounded-full bg-accent animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                          <span className="text-mini text-muted-foreground ml-1">
                            인식 중...
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

              {/* 자동 스크롤 앵커 */}
              <div ref={scrollBottomRef} />
            </div>
          </div>

          {/* Mobile: main panel content */}
          <div className="lg:hidden border-t border-border bg-card px-3 py-3 mt-4">
            {renderMainPanelContent()}
          </div>
        </div>
      </div>

      {/* ── Aux panel (검색/화면공유/화자) ─────────────────────── */}
      {auxPanel !== null && (
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-l border-border bg-card overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3">
            {renderAuxPanelContent()}
          </div>
        </aside>
      )}

      {/* ── Main right panel (결정/액션/챗) ─────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-l border-border bg-card">
        {/* Panel tabs */}
        <div role="tablist" className="flex border-b border-border shrink-0">
          {(
            [
              { id: "decisions", label: "결정", icon: CheckSquare },
              { id: "actions", label: "액션", icon: Zap },
              { id: "chat", label: "AI 챗", icon: MessageSquare },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mainPanel === id}
              onClick={() => setMainPanel(id)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-mini font-medium transition-colors border-b-2",
                mainPanel === id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {renderMainPanelContent()}
        </div>
      </aside>
    </div>
  );
}
