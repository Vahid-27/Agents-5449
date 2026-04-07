# Agent 0 — Product Intelligence

## Purpose

Scrapes the selected product's website and optionally parses an uploaded PRD document to extract structured product context. This context flows into every downstream agent — it's the foundation the entire pipeline builds on.

Runs once per blog session. Re-runs on every new session (no global cache).

---

## Endpoint

```
POST /api/blog/agent0/scrape
```

### Request Body

```json
{
  "productUrl": "https://www.talsy.ai/",
  "productName": "talsy.ai",
  "prdContent": "optional extracted text from uploaded PRD file"
}
```

### Response

Streaming plain text (JSON object). Parse with `tryParseJSON()` on completion.

---

## System Prompt Role

> You are a Product Intelligence Agent. You analyze product websites and PRD documents to extract structured product context that will power an SEO blog writing pipeline.

---

## What It Extracts

| Field | Description |
|-------|-------------|
| `name` | Product name |
| `url` | Product website URL |
| `tagline` | One-line product tagline |
| `description` | 2–3 sentence description |
| `coreFeatures` | Array of 5 core features |
| `usp` | Array of 3 unique differentiators |
| `targetMarket` | Primary audience description |
| `primaryPersona` | Specific job title / role |
| `businessModel` | `B2B` / `B2C` / `B2B2C` |
| `tone` | e.g. professional, friendly, authoritative |
| `contentAngles` | 3–5 blog topic angles specific to this product |
| `competitors` | Known competitor names |
| `keyPainPointsSolved` | Problems the product solves |
| `industry` | Industry category |
| `pricingModel` | freemium / subscription / enterprise / etc |
| `confidence` | `high` / `medium` / `low` — how reliable the extraction was |

---

## How Website Scraping Works

1. Fetches the URL with `fetch()` (10 second timeout)
2. Strips all `<script>`, `<style>`, and HTML tags
3. Collapses whitespace
4. Truncates to **8,000 characters** before sending to LLM
5. If fetch fails, falls back to PRD content only (or just the product name)

---

## PRD File Support

The frontend extracts text from uploaded files before sending to this endpoint:

| Format | Extraction method |
|--------|-------------------|
| `.txt` | `file.text()` |
| `.md` | `file.text()` |
| `.pdf` | FileReader binary → strip non-ASCII chars |
| `.docx` | Filename + size only (content extraction limited) |

PRD content is truncated to **3,000 characters** in the prompt.

---

## Output Shape

```typescript
interface ProductContext {
  name: string;
  url: string;
  tagline: string;
  description: string;
  coreFeatures: string[];
  usp: string[];
  targetMarket: string;
  primaryPersona: string;
  businessModel: 'B2B' | 'B2C' | 'B2B2C';
  tone: string;
  contentAngles: string[];
  competitors: string[];
  keyPainPointsSolved: string[];
  industry: string;
  pricingModel: string;
  confidence: 'high' | 'medium' | 'low';
}
```

---

## Store Fields Updated

- `store.productContext` — the parsed ProductContext object
- `store.prdFileContent` — raw extracted PRD text
- `store.agents[0].status` → `done`
- `store.agents[0].parsedData` → ProductContext object

Also saved to DB: `agent_outputs` row with `agent_num = 0`, and `blog_sessions.product_context` is updated.

---

## Error Handling

- Fetch timeout (10s) → falls back to PRD + name only
- JSON parse failure → sets status to `error`, shows raw output
- Network error → caught, error message shown in UI

---

## UI Behaviour

1. Shows active product tile (name + URL)
2. Drag-and-drop / browse file upload for PRD (optional)
3. "Analyze [product]" button → triggers run
4. While running: animated step list (Fetching → Analyzing → Identifying → Extracting)
5. On done: product card with features, USP, content angles, B2B/B2C badge
6. "Re-analyze" button resets to idle
7. "Continue: Enter Blog Topic →" advances to Agent 1

---

## Dependencies

- None — this is the first agent in the pipeline
- Must complete before Agent 1 can run (Agent 1 shows warning if `productContext` is null)

---

## Token Usage

- Max tokens: `2000`
- Model: configured in `src/api/agent/index.ts`
