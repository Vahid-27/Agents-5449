# Agent 6 — Internal Linking

## Purpose

Analyzes the blog draft and suggests strategic internal links to pages on the product's website. Links are placed to guide readers through the funnel (TOFU → MOFU → BOFU) while distributing SEO page authority.

Unlike the old hardcoded talsy.ai sitemap, this agent now **generates realistic internal URLs dynamically** based on the product's website and core features.

---

## Endpoint

```
POST /api/blog/agent6/internal-links
```

### Request Body

```json
{
  "blogContent": "...first 1000 chars of draft...",
  "topic": "ex gratia payment",
  "product": "talsy.ai",
  "funnelStage": "TOFU",
  "productContext": { ...ProductContext... }
}
```

---

## Output Shape

```json
{
  "funnelStageAnalysis": {
    "stage": "TOFU",
    "reasoning": "Reader is learning about ex gratia payments, not ready to buy",
    "contentIntent": "Seeking definition and guidance"
  },
  "internalLinkSuggestions": [
    {
      "anchorText": "employee offboarding process",
      "targetUrl": "https://talsy.ai/company/talent-management",
      "targetPage": "Talent Management",
      "placement": "intro section",
      "seoReason": "Connects HR process topic to product page",
      "funnelPurpose": "TOFU awareness"
    }
  ],
  "linkingStrategy": "Use 3-4 contextual links pointing to product feature pages",
  "talsyProductMentions": [
    {
      "context": "sentence where product is mentioned",
      "suggestedAnchor": "HR documentation platform",
      "targetUrl": "https://talsy.ai/company/talent-management"
    }
  ],
  "totalLinksRecommended": 4,
  "priorityLinks": ["employee offboarding process", "HR compliance"]
}
```

---

## How URL Generation Works

The agent receives `productContext.url` (e.g. `https://www.mockwin.ai/`) and `productContext.coreFeatures` and generates plausible internal URLs based on the product structure. No hardcoded sitemap — adapts to any product.

---

## Store Fields Updated

- `store.internalLinksData` — full parsed object
- Used downstream by Agent 9 (final publisher integrates the links into the text)

---

## UI Behaviour

- Funnel stage analysis card
- Internal link suggestions table (anchor text, target URL, placement, funnel purpose)
- Product mention opportunities
- Linking strategy summary
- "Next: External Linking →"

---

## Dependencies

- **Requires**: `store.blogDraft` (Agent 5), `store.topic`, `store.funnelStage`
- `productContext` is essential — provides the product URL and features to generate links from
