# Blog Agent — Documentation

Multi-product AI blog writing pipeline for talsy.ai, MockWin.ai, and yashvini.in.

## Architecture

```
Product Selection (Sidebar)
        ↓
Agent 0 — Product Intelligence     ← scrapes URL + parses PRD
        ↓
Agent 1 — Topic Intake             ← topic + B2B/B2C + audience
        ↓
Agent 2 — Competitor Analysis      ← top 5 competitors across 6 search engines
        ↓
Agent 3 — Keyword Extraction       ← SEO / AEO / GEO / LLMO keywords
        ↓
Agent 4 — SEO Research & Outline   ← full blog outline with schema notes
        ↓
Agent 5 — Blog Writer              ← ~3000 word draft
        ↓
Agent 6 — Internal Linking         ← TOFU/MOFU/BOFU internal links
        ↓
Agent 7 — External Linking         ← authority citations + stats
        ↓
Agent 8 — Content Auditor          ← SEO/AEO/GEO/LLMO/E-E-A-T grades
        ↓
Agent 9 — Final Publisher          ← integrates all fixes → final markdown
        ↓
Agent 10 — HTML Converter          ← production-ready HTML with schema markup
```

## Products

| Product | URL | Color |
|---------|-----|-------|
| talsy.ai | https://www.talsy.ai/ | Blue |
| MockWin.ai | https://www.mockwin.ai/ | Violet |
| yashvini.in | https://www.yashvini.in/ | Emerald |

## Key Design Decisions

- **Product context flows through every agent** — Agent 0 scrapes once per session, result (`productContext`) is passed to all downstream agents
- **B2B/B2C is decided by Agent 1** — not hardcoded, inferred from topic + product
- **Sessions are product-scoped** — History filters by active product
- **Re-scrapes every new session** — productContext is never cached globally
- **Streaming everywhere** — all agents use `toTextStreamResponse()`, frontend accumulates raw text chunks

## Stack

- **Frontend**: React + Vite + Zustand + Tailwind + shadcn/ui
- **Backend**: Hono on Cloudflare Workers
- **DB**: Cloudflare D1 (SQLite) via Drizzle ORM
- **AI**: OpenAI via AI SDK (`streamText`)
- **Markdown**: `marked` library for rendering

## File Structure

```
src/
  api/
    routes/
      blog-agent.ts     — all 11 agent endpoints
      sessions.ts       — session CRUD + agent output persistence
    database/
      schema.ts         — blog_sessions + agent_outputs tables
    agent/
      index.ts          — OpenAI client + model config
  web/
    pages/
      Agent0.tsx        — Product Intelligence UI
      Agent1.tsx        — Topic Intake UI
      Agent2.tsx        — Competitor Analysis UI
      Agent3.tsx        — Keyword Extraction UI
      Agent4.tsx        — Outline UI
      Agent5.tsx        — Blog Writer UI (with markdown renderer)
      Agent6.tsx        — Internal Linking UI
      Agent7.tsx        — External Linking UI
      Agent8.tsx        — Content Auditor UI
      Agent9.tsx        — Final Publisher UI (with markdown renderer)
      Agent10.tsx       — HTML Converter UI
      History.tsx       — Session history (filtered by product)
    components/
      AgentSidebar.tsx  — pipeline nav + product switcher
      ProductSwitcher.tsx — 3-product selector tiles
      MarkdownRenderer.tsx — marked-based HTML renderer
      AgentHeader.tsx   — reusable agent header component
    store/
      blogStore.ts      — Zustand store (all pipeline + product state)
    lib/
      streaming.ts      — streamAgentAPI + tryParseJSON helpers
    hooks/
      useSessionCache.ts — DB session/output helpers
docs/
  README.md             — this file
  agents/
    agent0.md           — Product Intelligence skill doc
    agent1.md           — Topic Intake skill doc
    agent2.md           — Competitor Analysis skill doc
    agent3.md           — Keyword Extraction skill doc
    agent4.md           — SEO Outline skill doc
    agent5.md           — Blog Writer skill doc
    agent6.md           — Internal Linking skill doc
    agent7.md           — External Linking skill doc
    agent8.md           — Content Auditor skill doc
    agent9.md           — Final Publisher skill doc
    agent10.md          — HTML Converter skill doc
```

## Database Schema

```sql
blog_sessions
  id              TEXT PRIMARY KEY
  topic           TEXT
  product         TEXT              -- product name (talsy.ai / MockWin.ai / yashvini.in)
  product_url     TEXT              -- product website URL
  product_context TEXT              -- JSON: scraped product intelligence
  blog_type       TEXT              -- B2B | B2C | B2B2C
  target_audience TEXT
  funnel_stage    TEXT              -- TOFU | MOFU | BOFU
  current_agent   INTEGER
  status          TEXT              -- in_progress | done
  created_at      INTEGER
  updated_at      INTEGER

agent_outputs
  id              TEXT PRIMARY KEY  -- {sessionId}_{agentNum}
  session_id      TEXT FK
  agent_num       INTEGER           -- 0–10
  output          TEXT              -- raw streamed output
  parsed_data     TEXT              -- JSON parsed result
  status          TEXT              -- idle | running | done | error
  updated_at      INTEGER
```

## Adding a New Product

1. Add to `PRODUCTS` array in `src/web/store/blogStore.ts`
2. Add icon letter to `PRODUCT_ICONS` in `ProductSwitcher.tsx`
3. Add color classes to `PRODUCT_COLORS` and `PRODUCT_LIGHT_COLORS` in `ProductSwitcher.tsx`
4. No backend changes needed — Agent 0 handles any URL dynamically
