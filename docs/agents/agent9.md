# Agent 9 — Final Publisher

## Purpose

The synthesis agent. Takes the blog draft and all improvement data from Agents 6, 7, and 8 — and produces the definitive, publication-ready version. This is the output you actually publish.

Integrates:
- All critical fixes from the audit (Agent 8)
- Internal links woven naturally into anchor text (Agent 6)
- External stats inserted with proper attribution (Agent 7)
- Keyword density optimization
- E-E-A-T enhancement
- AEO/GEO/LLMO polish
- Final product CTA

---

## Endpoint

```
POST /api/blog/agent9/finalize
```

### Request Body

```json
{
  "blogContent": "...original draft from Agent 5...",
  "auditReport": { ...from Agent 8... },
  "internalLinks": { ...from Agent 6... },
  "externalLinks": { ...from Agent 7... },
  "keywords": { ...from Agent 3... },
  "topic": "ex gratia payment",
  "outline": { ...from Agent 4... },
  "productContext": { ...ProductContext... }
}
```

---

## What Gets Fixed

### From Audit (Agent 8)
- All `criticalIssues` — addressed in order of impact
- `priorityFixes` — top 3 applied first
- `missingElements` — added where appropriate

### From Internal Links (Agent 6)
- Up to 6 `internalLinkSuggestions` woven into the text
- Links use the exact `anchorText` suggested
- Format: `[anchor text](targetUrl)`

### From External Links (Agent 7)
- Up to 5 `statsAndData` items inserted
- Format: `According to [source], X% of...`
- Placed in the sections specified

### General Improvements
- Primary keyword density checked → adjusted to 1.5–2%
- FAQ section tightened for AEO
- E-E-A-T signals strengthened (expert framing, specific claims)
- CTA updated with accurate product name and URL from `productContext`

---

## Output Format

Same as Agent 5 — clean markdown, no code fences. Target word count: `outline.estimatedWordCount`+ (often 3,200–3,800 words after improvements).

---

## Store Fields Updated

- `store.finalBlog` — streamed in real-time
- `store.agents[9].output` — same as finalBlog
- `store.agents[9].parsedData` — `{ content: fullText }`

---

## UI Behaviour

- **Rendered tab**: `MarkdownRenderer` — proper HTML display
- **Raw Markdown tab**: monospace pre block
- Word count bar (target: 3,500)
- Improvement summary chips at top:
  - "✓ X issues fixed" (from audit criticalIssues count)
  - "✓ X internal links added"
  - "✓ X stats integrated"
  - "✓ SEO + AEO + GEO + LLMO optimized"
- Copy + Download MD buttons
- "Convert to HTML →" advances to Agent 10

---

## Dependencies

- **Requires**: `store.blogDraft` (Agent 5)
- Strongly benefits from: `store.auditData` (Agent 8), `store.internalLinksData` (Agent 6), `store.externalLinksData` (Agent 7)
- All three are optional — agent works with partial data if some agents were skipped
- `productContext` required for accurate CTA

---

## Token Usage

- Max tokens: `8000`
- Second longest agent after Agent 5
