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

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "text/event-stream"
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(errText || `AI 응답 생성 중 오류가 발생했습니다. (${resp.status})`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No stream reader");

  const decoder = new TextDecoder();
  let metadata: StreamMeta;

  try {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line) continue;
        if (line.startsWith(":")) continue; // keep-alive/주석 라인 무시
        
        // 메타라인 우선 처리
        const meta = parseMetadataLine(line);
        if (meta) { metadata = meta; continue; }

        // 데이터 라인 처리
        if (handleDataLine(line, onDelta, (m) => { metadata = m; }) === "DONE") return metadata;
      }
    }

    // 남은 버퍼 처리(메타 가능성)
    if (buffer.trim()) {
      const meta = parseMetadataLine(buffer.trim());
      if (meta) metadata = meta;
    }
  } finally {
    reader.releaseLock();
  }

  return metadata;
}
 