# Agent 5 — Blog Writer

## Purpose

Writes the complete ~3,000 word first draft following the outline from Agent 4. Applies SEO, AEO, GEO, LLMO, and E-E-A-T principles throughout. Output is clean markdown — no code fences.

---

## Endpoint

```
POST /api/blog/agent5/write
```

### Request Body

```json
{
  "topic": "ex gratia payment",
  "outline": { ...from Agent 4... },
  "keywords": { ...from Agent 3... },
  "audience": "HR managers at SMBs",
  "blogType": "B2B",
  "productContext": { ...ProductContext... }
}
```

---

## System Prompt Role

> You are an elite SEO Content Writer who writes blogs that rank #1 on Google, appear in AI-generated answers, and get 100k+ organic impressions.

---

## Writing Principles Applied

| Principle | How |
|-----------|-----|
| **SEO** | 1.5–2% primary keyword density, proper heading hierarchy, semantic coverage |
| **AEO** | Direct answer sentences, FAQ at end, concise definitions |
| **GEO** | Clear facts, attributed claims, structured for AI citation |
| **LLMO** | Topic sentences written in citable format |
| **E-E-A-T** | Authoritative tone, specific claims, expert framing |
| **Engagement** | Compelling intro, bullet points, numbered lists, strong CTA |

---

## Output Format

Clean markdown:
- `#` for H1 title
- `##` for H2 sections
- `###` for H3 subsections
- `-` for bullet lists
- `1.` for numbered lists
- `**bold**` for emphasis
- No code blocks, no HTML, no markdown fences

---

## Word Count

- Target: ~`outline.estimatedWordCount` (usually 2,500–3,500 words)
- Max tokens: `8000`
- Word count bar in UI: green when over target, capped at 100% visually

---

## Product Integration

The product is woven in naturally — not forced. Agent 5 receives the full `productContext` including:
- `name`, `url`, `description` — for accurate mentions
- `contentAngles` — for angle-specific phrasing
- `usp` — for differentiation points to reference
- `tone` — to match writing style

The CTA at the end always references the product by name.

---

## Store Fields Updated

- `store.blogDraft` — streamed and accumulated in real-time
- `store.agents[5].output` — same as blogDraft (for raw tab)
- `store.agents[5].parsedData` — `{ content: fullText }`

---

## UI Behaviour

- **Rendered tab**: uses `MarkdownRenderer` (marked library) → displays proper HTML
- **Raw Markdown tab**: `<pre>` with monospace font
- Word count bar with live update during streaming
- Copy + Download MD buttons when done
- "Regenerate" button resets and reruns
- "Next: Internal Links →" when done

---

## Markdown Rendering

Uses `MarkdownRenderer.tsx` which calls `marked.parse(content)` synchronously.
CSS classes applied: `.blog-content` with full prose styles (headings, lists, bold, blockquotes, tables, code).

---

## Dependencies

- **Requires**: `store.outlineData` (Agent 4), `store.keywordData` (Agent 3)
- `productContext` required for accurate product references in the draft

---

## Token Usage

- Max tokens: `8000`
- Longest agent in the pipeline
