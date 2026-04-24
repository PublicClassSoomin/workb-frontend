import { useCallback, useEffect, useRef, useState } from "react";

// ── WAV 인코딩 유틸 ───────────────────────────────────────────────
function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Float32 PCM → 16-bit WAV ArrayBuffer */
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const dataLen = samples.length * 2; // 16-bit = 2 bytes per sample
  const buffer = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLen, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, dataLen, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return buffer;
}

/** 네이티브 샘플레이트 → 16 kHz 다운샘플링 (선형 보간) */
function downsample(
  input: Float32Array,
  inputRate: number,
  outputRate: number,
): Float32Array {
  if (inputRate === outputRate) return input;
  const ratio = inputRate / outputRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx] ?? 0;
    const b = input[idx + 1] ?? 0;
    output[i] = a + frac * (b - a);
  }
  return output;
}

export type WsStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "finalizing"
  | "done"
  | "error";

export interface DiarizationSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface FinalUtterance {
  id?: string;
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface STTMessage {
  language: string;
  text: string;
  final: boolean;
  timestamps?: { text: string; start: number; end: number }[];
  sentences?: { text: string; start: number; end: number }[];
  diarization?: DiarizationSegment[];
}

const WS_BASE = "ws://localhost:8888";
const API_BASE = "http://localhost:8888";

/** start 기준 중복 제거 후 시간 순 정렬 */
function mergeDiarization(
  prev: DiarizationSegment[],
  incoming: DiarizationSegment[],
): DiarizationSegment[] {
  const map = new Map<number, DiarizationSegment>();
  for (const seg of prev) map.set(seg.start, seg);
  for (const seg of incoming) map.set(seg.start, seg);
  return Array.from(map.values()).sort((a, b) => a.start - b.start);
}

export function useLiveSTT(meetingId: string) {
  const [wsStatus, setWsStatus] = useState<WsStatus>("idle");
  const [liveText, setLiveText] = useState("");
  const [diarization, setDiarization] = useState<DiarizationSegment[]>([]);
  const [utterances, setUtterances] = useState<FinalUtterance[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcmBufferRef = useRef<Float32Array[]>([]);
  const pcmSamplesRef = useRef(0);
  const isStoppingRef = useRef(false);
  const isDoneRef = useRef(false);
  // 청크 전송 주기: 16000 Hz * 2초 = 32000 샘플
  const CHUNK_SAMPLES = 32000;

  const fetchFinalUtterances = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/utterances`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FinalUtterance[] = await res.json();
      setUtterances(data);
    } catch (err) {
      console.error("최종 발화 데이터 조회 실패:", err);
    }
  }, [meetingId]);

  useEffect(() => {
    let unmounted = false;

    async function connect() {
      setWsStatus("connecting");
      setErrorMsg(null);

      // 1. 마이크 권한 요청
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch {
        if (!unmounted) {
          setWsStatus("error");
          setErrorMsg("마이크 접근 권한이 필요합니다.");
        }
        return;
      }

      if (unmounted) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // 2. WebSocket 연결
      const ws = new WebSocket(`${WS_BASE}/ws/stream/${meetingId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) {
          ws.close();
          return;
        }

        // 언어 설정 JSON을 가장 먼저 전송
        ws.send(JSON.stringify({ language: "Korean" }));
        setWsStatus("connected");

        // AudioContext — 가능하면 16 kHz로 직접 요청
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;
        const nativeRate = audioCtx.sampleRate; // 실제 적용된 샘플레이트

        const source = audioCtx.createMediaStreamSource(stream);
        // bufferSize 4096, 1채널 입력, 1채널 출력
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;

          // 채널 0 (mono) 데이터 복사
          const raw = e.inputBuffer.getChannelData(0);
          const chunk = new Float32Array(raw);

          // 16 kHz로 다운샘플 후 누적
          const resampled = downsample(chunk, nativeRate, 16000);
          pcmBufferRef.current.push(resampled);
          pcmSamplesRef.current += resampled.length;

          // 약 2초 분량(32000 샘플)이 쌓이면 WAV로 패키징해서 전송
          if (pcmSamplesRef.current >= CHUNK_SAMPLES) {
            const merged = new Float32Array(pcmSamplesRef.current);
            let offset = 0;
            for (const buf of pcmBufferRef.current) {
              merged.set(buf, offset);
              offset += buf.length;
            }
            pcmBufferRef.current = [];
            pcmSamplesRef.current = 0;
            ws.send(encodeWav(merged, 16000));
          }
        };

        source.connect(processor);
        // ScriptProcessorNode 는 destination 에 연결해야 동작
        processor.connect(audioCtx.destination);
      };

      ws.onmessage = (e) => {
        if (unmounted) return;
        try {
          const msg = JSON.parse(e.data as string) as STTMessage;
          setLiveText(msg.text ?? "");
          if (msg.diarization && msg.diarization.length > 0) {
            setDiarization((prev) => mergeDiarization(prev, msg.diarization!));
          }
          if (msg.final) {
            isDoneRef.current = true;
            setWsStatus("done");
            fetchFinalUtterances();
          }
        } catch {
          console.error("STT 메시지 파싱 오류:", e.data);
        }
      };

      ws.onerror = () => {
        if (unmounted) return;
        setWsStatus("error");
        setErrorMsg("WebSocket 연결 오류가 발생했습니다.");
      };

      ws.onclose = (e) => {
        if (unmounted || isDoneRef.current || isStoppingRef.current) return;
        if (e.code === 4004) {
          setWsStatus("error");
          setErrorMsg("회의를 찾을 수 없습니다. (4004)");
        } else if (e.code !== 1000 && e.code !== 1001) {
          setWsStatus("error");
          setErrorMsg(`연결이 끊어졌습니다. (코드: ${e.code})`);
        }
      };
    }

    connect();

    return () => {
      unmounted = true;
      processorRef.current?.disconnect();
      audioCtxRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000);
      }
    };
  }, [meetingId, fetchFinalUtterances]);

  /** 마이크 트랙 enable/disable 토글 */
  const toggleMic = useCallback(() => {
    setMicOn((prev) => {
      const next = !prev;
      streamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
      return next;
    });
  }, []);

  /**
   * 종료 버튼 핸들러:
   * 1) AudioContext / ScriptProcessor 중지  2) 스트림 트랙 종료
   * 3) 남은 PCM 버퍼 플러시 → WAV 전송
   * 4) 빈 ArrayBuffer 전송 (서버에 오프라인 파이프라인 실행 신호)
   * 5) final: true 응답 대기 (WebSocket은 열어둠)
   */
  const stopMeeting = useCallback(() => {
    isStoppingRef.current = true;
    const ws = wsRef.current;

    // 남은 PCM 플러시
    if (pcmSamplesRef.current > 0 && ws?.readyState === WebSocket.OPEN) {
      const merged = new Float32Array(pcmSamplesRef.current);
      let off = 0;
      for (const buf of pcmBufferRef.current) {
        merged.set(buf, off);
        off += buf.length;
      }
      pcmBufferRef.current = [];
      pcmSamplesRef.current = 0;
      ws.send(encodeWav(merged, 16000));
    }

    processorRef.current?.disconnect();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    if (ws && ws.readyState === WebSocket.OPEN) {
      setWsStatus("finalizing");
      ws.send(new ArrayBuffer(0)); // 종료 신호
    }
  }, []);

  return {
    wsStatus,
    liveText,
    diarization,
    utterances,
    errorMsg,
    micOn,
    toggleMic,
    stopMeeting,
  };
}
