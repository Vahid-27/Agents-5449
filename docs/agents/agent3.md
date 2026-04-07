# Agent 3 — Keyword Extraction

## Purpose

Extracts a comprehensive keyword set optimized for all four search paradigms:
- **SEO** — traditional Google rankings
- **AEO** — Answer Engine Optimization (featured snippets, Google's AI Overviews)
- **GEO** — Generative Engine Optimization (Perplexity, ChatGPT Search)
- **LLMO** — Large Language Model Optimization (phrases LLMs naturally cite)

---

## Endpoint

```
POST /api/blog/agent3/extract
```

### Request Body

```json
{
  "topic": "ex gratia payment",
  "competitorData": { ...from Agent 2... },
  "audience": "HR managers at SMBs",
  "blogType": "B2B",
  "productContext": { ...ProductContext... }
}
```

---

## Output Shape

```json
{
  "topic": "...",
  "primaryKeyword": "ex gratia payment",
  "secondaryKeywords": ["ex gratia meaning", "ex gratia examples", "ex gratia vs severance"],
  "longTailKeywords": ["how to implement ex gratia payment policy", "..."],
  "lsiKeywords": ["discretionary payment", "goodwill payment", "voluntary severance"],
  "questionKeywords": ["what is ex gratia", "how is ex gratia taxed", "..."],
  "voiceSearchKeywords": ["how do I set up an ex gratia payment policy"],
  "ngramKeywords": {
    "bigrams": ["ex gratia", "payment policy"],
    "trigrams": ["ex gratia payment", "payment policy template"]
  },
  "intentMapping": {
    "informational": ["ex gratia meaning", "what is ex gratia"],
    "commercial": ["ex gratia payment software", "policy template"],
    "transactional": ["ex gratia policy template download"]
  },
  "aeoKeywords": ["answer-engine optimized question phrases"],
  "geoKeywords": ["ex gratia UK", "ex gratia India regulations"],
  "llmoKeywords": ["ex gratia payment is a voluntary discretionary payment made by..."],
  "keywordDensityTargets": {
    "primaryKeyword": "1.5-2%",
    "secondaryKeywords": "0.5-1% each"
  },
  "estimatedSearchVolumes": {
    "primaryKeyword": "8,000-12,000 monthly",
    "topSecondary": "2,500-4,500 monthly"
  },
  "competitiveGapOpportunities": ["payroll integration guide", "multi-country tax matrix"]
}
```

---

## Keyword Types Explained

| Type | Used For |
|------|----------|
| `primaryKeyword` | H1 title, first paragraph, 2–3 H2s, conclusion |
| `secondaryKeywords` | H2 headings, body sections |
| `longTailKeywords` | H3 subheadings, specific sections |
| `lsiKeywords` | Natural variation throughout body |
| `questionKeywords` | FAQ section, subheadings |
| `voiceSearchKeywords` | Conversational intro sentences |
| `aeoKeywords` | Definition boxes, direct answer paragraphs |
| `llmoKeywords` | Topic sentences structured for LLM citation |

---

## Store Fields Updated

- `store.keywordData` — full parsed object
- Used downstream by Agents 4, 5 (outline, blog writer)

---

## Dependencies

- **Requires**: `store.topic`, `store.competitorData` (from Agent 2)
- `productContext` is used to tailor keyword angles to the product's industry
