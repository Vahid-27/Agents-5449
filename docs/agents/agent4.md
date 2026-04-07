# Agent 4 — SEO Research & Outline

## Purpose

Builds the full blog outline optimized for SEO, AEO, GEO, LLMO, and semantic search. Every section is planned with keywords, word count targets, content type, featured snippet notes, and AEO formatting guidance. This outline is the blueprint Agent 5 follows to write.

---

## Endpoint

```
POST /api/blog/agent4/outline
```

### Request Body

```json
{
  "topic": "ex gratia payment",
  "keywords": { ...from Agent 3... },
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
  "title": "Ex Gratia Payment: The Complete HR Guide (2024)",
  "metaDescription": "Learn what ex gratia payments are, how they differ from severance...",
  "slug": "ex-gratia-payment-guide",
  "estimatedWordCount": 3000,
  "targetReadingTime": "12 min read",
  "primaryKeyword": "ex gratia payment",
  "topRankingQueries": ["ex gratia payment meaning", "ex gratia vs severance"],
  "topPAA": ["What is the difference between ex gratia and severance?", "..."],
  "outline": [
    {
      "type": "intro",
      "heading": "What Is an Ex Gratia Payment?",
      "purpose": "Hook with a relatable HR scenario, define ex gratia in first 100 words",
      "keywordsToInclude": ["ex gratia payment", "discretionary payment"],
      "wordCount": 250,
      "seoNotes": "Include primary keyword in first sentence. Target featured snippet."
    },
    {
      "type": "section",
      "heading": "Ex Gratia vs Severance Pay: Key Differences",
      "subheadings": [
        { "h3": "Legal obligation", "keywords": ["contractual"], "notes": "comparison table" },
        { "h3": "Tax treatment", "keywords": ["tax"], "notes": "numbered list" }
      ],
      "purpose": "Answer PAA: what is the difference between ex gratia and severance",
      "keywordsToInclude": ["ex gratia vs severance", "voluntary payment"],
      "wordCount": 400,
      "seoNotes": "Featured snippet opportunity — use comparison table",
      "aeoNotes": "Lead with direct answer sentence: 'Ex gratia differs from severance in that...'",
      "contentType": "comparison"
    }
  ],
  "faqSection": [
    { "question": "Are ex gratia payments taxable?", "intent": "informational" }
  ],
  "conclusionNotes": "CTA linking to product's HR management features",
  "schemaMarkupRecommended": ["Article", "FAQPage"],
  "contentDifferentiators": ["multi-country tax matrix", "downloadable policy template"]
}
```

---

## Outline Section Types

| Type | Description |
|------|-------------|
| `intro` | Opening — hook, definition, what reader will learn |
| `section` | Main H2 with optional H3 subheadings |
| `faq` | FAQ block (AEO-optimized Q&A) |
| `conclusion` | Summary + CTA |

---

## SEO Notes in Outline

Each section includes:
- `seoNotes` — heading optimization, featured snippet tactics
- `aeoNotes` — direct answer formatting for AI engines
- `contentType` — guides Agent 5 on format (list, table, comparison, how-to)
- `keywordsToInclude` — which keywords to use in that section

---

## Store Fields Updated

- `store.outlineData` — full parsed object
- Used downstream by Agents 5, 8, 9, 10

---

## UI Behaviour

- Renders the full outline as expandable section cards
- Each card shows: heading, purpose, word count target, keywords, SEO notes
- Title + meta description + slug displayed at top
- FAQs listed separately
- Schema markup recommendations shown as tags

---

## Dependencies

- **Requires**: `store.keywordData` (Agent 3), `store.competitorData` (Agent 2)
- `productContext` shapes the CTA direction and product mentions in the outline
