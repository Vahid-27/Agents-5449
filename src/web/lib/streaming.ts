export async function streamAgentAPI(
  endpoint: string,
  body: object,
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: string) => void,
  options?: {
    onCheckpoint?: (text: string) => void;
    checkpointIntervalMs?: number;
  }
) {
  try {
    const res = await fetch(`/api/blog${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      onError(`HTTP ${res.status}: ${errText}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) { onError('No response body'); return; }

    const decoder = new TextDecoder();
    let fullText = '';
    let lastCheckpoint = Date.now();
    const checkpointInterval = options?.checkpointIntervalMs ?? 30_000;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      onChunk(fullText);

      // Checkpoint every 30s during long streams
      if (options?.onCheckpoint && (Date.now() - lastCheckpoint) >= checkpointInterval) {
        options.onCheckpoint(fullText);
        lastCheckpoint = Date.now();
      }
    }

    onDone(fullText);
  } catch (e: any) {
    onError(e.message || 'Unknown error');
  }
}

export function tryParseJSON(text: string, retries = 2): any {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Extract JSON from markdown code blocks if present
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1].trim());
      }
      // Try direct parse of full text
      const trimmed = text.trim();
      if (trimmed.startsWith('{')) {
        return JSON.parse(trimmed);
      }
      // Extract JSON object from text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      if (attempt < retries) {
        // Try to salvage truncated JSON by finding last complete object boundary
        const lastBrace = text.lastIndexOf('}');
        if (lastBrace > 0) {
          text = text.substring(0, lastBrace + 1);
        }
        continue;
      }
    }
  }
  return null;
}
