# Agent 7 — External Linking

## Purpose

Identifies high-authority external sources, statistics, and data points to add to the blog. Boosts E-E-A-T signals by citing credible research, government sources, industry reports, and authoritative publications. Also flags competitor sites to avoid linking to.

---

## Endpoint

```
POST /api/blog/agent7/external-links
```

### Request Body

```json
{
  "topic": "ex gratia payment",
  "blogContent": "...blog draft...",
  "audience": "HR managers at SMBs",
  "keywords": { ...from Agent 3... },
  "productContext": { ...ProductContext... }
}
```

---

## Output Shape

```json
{
  "statsAndData": [
    {
      "stat": "68% of HR leaders say transparent offboarding improves employer brand",
      "source": "SHRM HR Benchmarking Report",
      "url": "https://www.shrm.org/research/...",
      "year": "2023",
      "relevance": "Supports case for ex gratia payments improving employer reputation",
      "placement": "Introduction section"
    }
  ],
  "authorityLinks": [
    {
      "anchorText": "HMRC guidance on ex gratia payments",
      "url": "https://www.gov.uk/hmrc/...",
      "domain": "gov.uk",
      "domainAuthority": "very-high",
      "linkType": "citation",
      "placement": "Tax treatment section"
    }
  ],
  "competitorLinksToAvoid": ["bamboohr.com", "deel.com"],
  "linkBuildingOpportunities": ["SHRM", "CIPD", "HR Dive"],
  "eeatSignals": [
    "Government source citation establishes legal accuracy",
    "Industry report stat adds quantitative credibility"
  ]
}
```

---

## How productContext Is Used

- `productContext.competitors` → populates `competitorLinksToAvoid`
- `productContext.industry` → guides which authority sources are most relevant
- `productContext.name` → ensures we don't suggest linking to the product's own competitors

---

## E-E-A-T Signal Types

| Signal | Example |
|--------|---------|
| **Experience** | First-person scenario, practitioner framing |
| **Expertise** | Citing domain-specific research |
| **Authoritativeness** | Government / association sources (SHRM, gov.uk, etc.) |
| **Trustworthiness** | Dated, sourced statistics |

---

## Store Fields Updated

- `store.externalLinksData` — full parsed object
- Used downstream by Agent 9 (stats are integrated into the final draft)

---

## How Stats Are Integrated (Agent 9)

Agent 9 inserts stats using this format:
```
According to [source], X% of companies...
```

---

## Dependencies

- **Requires**: `store.blogDraft` (Agent 5), `store.topic`
- `productContext` improves relevance of suggested sources to the product's industry
