# Agent 2 — Competitor Analysis

## Purpose

Simulates analysis of the top 5 ranking pages for the blog topic across 6 search engines: Google, ChatGPT, Grok, Perplexity, Gemini, Claude. Identifies what they do well, what they're missing, and the winning strategy to outrank them.

Uses LLM training knowledge to simulate realistic competitor research (no live web scraping).

---

## Endpoint

```
POST /api/blog/agent2/analyze
```

### Request Body

```json
{
  "topic": "ex gratia payment",
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
  "searchEnginesAnalyzed": ["Google", "ChatGPT", "Grok", "Perplexity", "Gemini", "Claude"],
  "topCompetitors": [
    {
      "rank": 1,
      "domain": "bamboohr.com",
      "title": "article title",
      "estimatedWordCount": 2800,
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1"],
      "keyTopicsCovered": ["topic 1", "topic 2"],
      "missingTopics": ["gap 1", "gap 2"],
      "contentFormat": "comprehensive guide",
      "seoScore": "high"
    }
  ],
  "commonStrengths": ["what all top content does well"],
  "contentGaps": ["topics no competitor covers well"],
  "dominantKeywords": ["kw1", "kw2", "kw3"],
  "contentFormats": ["comprehensive guide (60%)", "how-to (25%)"],
  "averageWordCount": 2280,
  "winningStrategy": "what you need to do to outrank",
  "featuredSnippetOpportunity": "yes — strong opportunity because...",
  "peopleAlsoAsk": ["Q1", "Q2", "Q3", "Q4", "Q5"]
}
```

---

## How productContext Is Used

The product context is passed to help the LLM:
- Avoid suggesting links to actual product competitors
- Frame the winning strategy around the product's USP
- Identify content gaps that the product can uniquely fill

---

## Store Fields Updated

- `store.competitorData` — full parsed object
- Used downstream by Agents 3, 4 (keyword extraction, outline)

---

## UI Behaviour

- Shows top 5 competitor cards with strengths/weaknesses
- Content gap chips (what to cover that competitors miss)
- PAA (People Also Ask) questions list
- Winning strategy callout
- Featured snippet opportunity badge
- "Next: Keyword Extraction →"

---

## Dependencies

- **Requires**: `store.topic`, `store.targetAudience`, `store.blogType` (from Agent 1)
- `productContext` is optional but improves output quality
