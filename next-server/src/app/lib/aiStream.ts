// AI 스트림 처리 헬퍼들
const META_PREFIX = "[METADATA]";

type StreamMeta = { messageId?: string; createdAt?: string } | undefined;

const safeJSON = <T = unknown>(s: string): T | undefined => {
  try { return JSON.parse(s) as T; } catch { return undefined; }
};

const parseMetadataLine = (line: string): StreamMeta => {
  if (!line.startsWith(META_PREFIX)) return undefined;
  const obj = safeJSON<{ type?: string; messageId?: string; createdAt?: string }>(line.slice(META_PREFIX.length));
  return obj?.type === "metadata"
    ? { messageId: obj.messageId, createdAt: obj.createdAt }
    : undefined;
};

const handleDataLine = (line: string, onDelta: (s: string) => void, onMeta?: (m: StreamMeta) => void): "DONE" | void => {
  if (!line.startsWith("data: ")) return;
  const data = line.slice(6);
  if (data === "[DONE]") return "DONE";
  // 메타가 data 페이로드로 오는 경우도 처리
  if (data.startsWith(META_PREFIX)) {
    const meta = parseMetadataLine(data);
    if (meta && onMeta) onMeta(meta);
    return;
  }
  const parsed = safeJSON<{ content?: unknown }>(data);
  if (typeof parsed?.content === "string") onDelta(parsed.content);
};

/**
 * AI 스트림 처리 함수
 * @param params - 스트림 처리 파라미터
 */
export async function aiStream(params: {
  endpoint: string;
  payload: Record<string, unknown>;
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<StreamMeta> {
  const { endpoint, payload, onDelta, signal } = params;

  // ✅ 사파리 모바일 호환성: credentials와 cache 설정 추가
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "text/event-stream"
    },
    body: JSON.stringify(payload),
    signal,
    credentials: 'include', // ✅ 쿠키 포함 (인증 필요)
    cache: 'no-store', // ✅ 사파리 모바일에서 캐시 방지
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(errText || `AI 응답 생성 중 오류가 발생했습니다. (${resp.status})`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No stream reader");

  const decoder = new TextDecoder();
  let metadata: StreamMeta;
  let isDone = false;

  try {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      
      // ✅ 모바일 사파리: 스트림 완료 시 남은 버퍼 처리
      if (done) {
        // 마지막 버퍼 처리 (완료 후 남은 데이터)
        if (buffer.trim()) {
          const lines = buffer.split(/\r?\n/);
          for (const line of lines) {
            if (!line.trim()) continue;
            if (line.startsWith(":")) continue;
            
            // 메타데이터 라인 처리
            const meta = parseMetadataLine(line);
            if (meta) { 
              metadata = meta; 
              continue;
            }
            
            // 데이터 라인 처리
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                isDone = true;
              } else if (data.startsWith(META_PREFIX)) {
                const meta = parseMetadataLine(data);
                if (meta) metadata = meta;
              } else {
                try {
                  const parsed = safeJSON<{ content?: unknown }>(data);
                  if (typeof parsed?.content === "string") {
                    onDelta(parsed.content);
                  }
                } catch {
                  // 파싱 실패 무시
                }
              }
            }
          }
        }
        break;
      }

      // ✅ 모바일 사파리: 스트림 읽기 중 에러 처리
      if (!value) continue;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith(":")) continue; // keep-alive/주석 라인 무시
        
        // 메타라인 우선 처리
        const meta = parseMetadataLine(line);
        if (meta) { 
          metadata = meta; 
          continue;
        }

        // 데이터 라인 처리
        const result = handleDataLine(line, onDelta, (m) => { metadata = m; });
        if (result === "DONE") {
          isDone = true;
          // ✅ DONE 후에도 메타데이터가 올 수 있으므로 즉시 return하지 않음
          // 하지만 스트림이 완료되면 break
        }
      }
    }

    // ✅ 남은 버퍼 최종 처리 (완료 후 확인)
    if (buffer.trim() && !isDone) {
      const trimmed = buffer.trim();
      const meta = parseMetadataLine(trimmed);
      if (meta) {
        metadata = meta;
      } else if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6).trim();
        if (data === "[DONE]") {
          isDone = true;
        } else if (!data.startsWith(META_PREFIX)) {
          try {
            const parsed = safeJSON<{ content?: unknown }>(data);
            if (typeof parsed?.content === "string") {
              onDelta(parsed.content);
            }
          } catch {
            // 파싱 실패 무시
          }
        }
      }
    }
  } catch (error) {
    // ✅ 모바일 사파리: 스트림 읽기 중 에러 발생 시 처리
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    console.error('[aiStream] 스트림 읽기 오류:', error);
    // 에러 발생 시에도 메타데이터가 있으면 반환
    if (!metadata) {
      throw error;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // 이미 해제된 경우 무시
    }
  }

  return metadata;
}
 