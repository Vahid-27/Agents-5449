# Agent 8 — Content Auditor

## Purpose

Performs a comprehensive multi-dimensional audit of the blog draft. Grades it across 7 dimensions and outputs specific, actionable fixes. Agent 9 uses this audit to produce the final publication-ready version.

---

## Endpoint

```
POST /api/blog/agent8/audit
```

### Request Body

```json
{
  "blogContent": "...full blog draft...",
  "topic": "ex gratia payment",
  "keywords": { ...from Agent 3... },
  "outline": { ...from Agent 4... },
  "audience": "HR managers at SMBs",
  "blogType": "B2B",
  "productContext": { ...ProductContext... }
}
```

---

## Output Shape

```json
{
  "overallScore": 82,
  "grades": {
    "seo": "B",
    "aeo": "A",
    "geo": "B",
    "llmo": "B",
    "eeat": "C",
    "readability": "A",
    "conversion": "B"
  },
  "criticalIssues": [
    {
      "issue": "Primary keyword missing from H1",
      "impact": "high",
      "fix": "Add 'ex gratia payment' to the H1 title",
      "section": "Title"
    }
  ],
  "seoAnalysis": {
    "keywordDensity": "1.2%",
    "keywordInTitle": false,
    "keywordInFirstParagraph": true,
    "headingOptimization": "H2s are good but H1 needs primary keyword",
    "metaDescriptionQuality": "Good length, missing primary keyword",
    "internalLinkCount": 0,
    "recommendations": ["Add primary keyword to H1", "Include 3-4 internal links"]
  },
  "aeoAnalysis": {
    "featuredSnippetReadiness": "partial",
    "directAnswersPresent": true,
    "faqQuality": "Good — 6 questions covering all PAA",
    "recommendations": ["Add a 40-60 word definition at the very top"]
  },
  "eeatSignals": {
    "experienceSignals": ["HR scenario in intro — good", "Missing: author credentials"],
    "expertiseSignals": ["Technical accuracy good", "Missing: citations"],
    "recommendations": ["Add 2-3 authoritative citations", "Add expert quote placeholder"]
  },
  "readabilityAnalysis": {
    "fleschKincaidEstimate": "Grade 11",
    "avgSentenceLength": "18 words",
    "paragraphLength": "Good — avg 3-4 sentences",
    "recommendations": ["Break up 2 dense paragraphs in section 3"]
  },
  "missingElements": ["Author bio section", "Key takeaways box", "Table of contents"],
  "strengths": ["Strong FAQ section", "Good keyword variation", "Compelling CTA"],
  "priorityFixes": [
    "Add primary keyword to H1 (high SEO impact)",
    "Add 3-4 external citations (E-E-A-T)",
    "Add 40-word definition for featured snippet"
  ]
}
```

---

## Audit Dimensions

| Dimension | What's Evaluated |
|-----------|-----------------|
| **SEO** | Keyword density, heading hierarchy, meta description, internal links |
| **AEO** | Featured snippet readiness, direct answers, FAQ quality |
| **GEO** | Structure for AI citation, fact clarity, attribution |
| **LLMO** | Citable topic sentences, LLM-friendly formatting |
| **E-E-A-T** | Experience signals, expertise indicators, authority citations, trust signals |
| **Readability** | Flesch-Kincaid estimate, sentence length, paragraph density |
| **Conversion** | CTA presence, product mentions, funnel alignment |

---

## Grade Scale

| Grade | Meaning |
|-------|---------|
| A | Excellent — no major issues |
| B | Good — minor improvements needed |
| C | Average — significant gaps |
| D | Poor — major rework needed |

---

## Store Fields Updated

- `store.auditData` — full parsed object
- Used downstream by Agent 9 to fix all critical issues

---

## UI Behaviour

- Overall score ring / percentage display
- 7 grade badges (color coded: A=green, B=blue, C=orange, D=red)
- Critical issues table with impact level and fix instructions
- Expandable sections: SEO Analysis, AEO Analysis, E-E-A-T, Readability
- Strengths list
- Priority fixes callout (top 3 most important)
- "Next: Final Publisher →"

---

## Dependencies

- **Requires**: `store.blogDraft` (Agent 5), `store.keywordData` (Agent 3), `store.outlineData` (Agent 4)
- `productContext` used to audit CTA accuracy and product mention quality

---

## Token Usage

- Max tokens: `3000`
