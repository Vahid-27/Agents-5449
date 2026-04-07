import { useBlogStore } from '../store/blogStore';

// ─── Update current agent position in DB (called on navigation) ──────────────
export async function updateSessionAgent(sessionId: string, currentAgent: number) {
  try {
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentAgent }),
    });
  } catch { /* silent */ }
}

// ─── Create a new session in DB ───────────────────────────────────────────────
export async function createSession(topic: string, product: string): Promise<string | null> {
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, product }),
    });
    const { id } = await res.json();
    return id;
  } catch { return null; }
}

// ─── Save an agent's output to DB (creates a new version) ────────────────────
export async function saveAgentOutput(
  sessionId: string,
  agentNum: number,
  output: string,
  parsedData: any,
  sessionPatch?: Record<string, any>
) {
  try {
    await fetch(`/api/sessions/${sessionId}/agents/${agentNum}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ output, parsedData, status: 'done', sessionPatch }),
    });
  } catch { /* silent fail — cache is best-effort */ }
}

// ─── Save checkpoint (updates active row's output mid-stream) ─────────────────
export async function saveCheckpoint(
  sessionId: string,
  agentNum: number,
  partialOutput: string
) {
  try {
    await fetch(`/api/sessions/${sessionId}/agents/${agentNum}/checkpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ output: partialOutput }),
    });
  } catch { /* silent — checkpoint is best-effort */ }
}

// ─── Fetch all versions for an agent ─────────────────────────────────────────
export async function fetchAgentVersions(
  sessionId: string,
  agentNum: number
): Promise<{ version: number; created_at: string; is_active: number }[]> {
  try {
    const res = await fetch(`/api/sessions/${sessionId}/agents/${agentNum}/versions`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

// ─── Activate a specific version ─────────────────────────────────────────────
export async function activateVersion(
  sessionId: string,
  agentNum: number,
  version: number
): Promise<boolean> {
  try {
    const res = await fetch(`/api/sessions/${sessionId}/agents/${agentNum}/versions/${version}/activate`, {
      method: 'POST',
    });
    return res.ok;
  } catch { return false; }
}

// ─── Fetch all sessions ───────────────────────────────────────────────────────
export async function fetchSessions() {
  try {
    const res = await fetch('/api/sessions');
    return await res.json();
  } catch { return []; }
}

// ─── Fetch a single session + outputs ────────────────────────────────────────
export async function fetchSession(id: string) {
  try {
    const res = await fetch(`/api/sessions/${id}`);
    return await res.json();
  } catch { return null; }
}

// ─── Delete a session ─────────────────────────────────────────────────────────
export async function deleteSession(id: string) {
  try {
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
  } catch { /* silent */ }
}
