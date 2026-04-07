# Talsy Blog Agent — 10/10 Upgrade

## STATUS: ✅ COMPLETE

All 12 upgrade steps done and build passing.

## Changes Made

### streaming.ts
- Checkpoint callback every 30s during stream via `options.onCheckpoint`
- JSON retry logic (2 retries, truncates to last `}` on each retry)

### useSessionCache.ts
- `saveCheckpoint(sessionId, agentNum, partialOutput)` → POST `/checkpoint`
- `fetchAgentVersions(sessionId, agentNum)` → GET `/versions`
- `activateVersion(sessionId, agentNum, version)` → POST `/versions/:v/activate`

### blogStore.ts
- Added `AgentVersion` interface
- Added `versions?: AgentVersion[]` and `activeVersion?: number` to `AgentState`

### blog-agent.ts (Agent 0)
- Replaced HTML regex strip with Jina Reader (`https://r.jina.ai/{url}`)
- Fetches 3 pages: homepage, /features, /pricing (10K char cap)

### blog-agent.ts (Agent 2)
- Fetches real Google SERP via Jina
- Scrapes top 3 competitor URLs via Jina for actual content
- Passes real scraped content to LLM

### blog-agent.ts (Agent 8)
- Context window: `substring(0,3000)` → `substring(0,8000)`

### blog-agent.ts (Agent 9)
- Removed `substring(0,6000)` cap — passes full draft

### Agent0.tsx
- DOCX: mammoth.convertToMarkdown() — proper text extraction
- PDF: pdfjs-dist — proper text layer extraction (20-page max)
- Both fall back gracefully on error

### Agent5.tsx + Agent9.tsx
- Version switcher UI (v1 | v2 | v3 pills)
- Loads versions on mount when status === 'done'
- Click to activate version → reloads session from DB
- Checkpoint saves during stream

### sessions.ts
- Added `POST /:id/agents/:agentNum/versions/:version/activate` route (frontend-compatible URL)

## Packages Added
- mammoth@1.12.0
- pdfjs-dist@5.6.205
