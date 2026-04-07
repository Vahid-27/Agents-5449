# Agent 1 — Topic Intake

## Purpose

Takes the user's blog topic and analyzes it in the context of the product. Determines B2B/B2C classification, funnel stage, target audience, content goal, and the angle that connects this topic to the product naturally.

This is the **strategy agent** — it sets the direction all other agents follow.

---

## Endpoint

```
POST /api/blog/agent1/analyze
```

### Request Body

```json
{
  "topic": "ex gratia payment",
  "productContext": { ...ProductContext from Agent 0... }
}
```

### Response

Streaming plain text (JSON object).

---

## System Prompt Role

> You are the Blog Topic Intake Agent. You analyze blog topics in the context of a specific product and determine the optimal content strategy.

---

## B2B / B2C Decision

This agent decides B2B vs B2C — **not Agent 0**. Why here:

- Agent 0 knows the product's default model (e.g. talsy.ai is generally B2B)
- But a specific topic might target a different segment (e.g. a job seeker article for a B2B product → B2C content)
- Agent 1 evaluates **topic + product together** to make the right call

---

## Output Shape

```json
{
  "topic": "original topic",
  "refinedTopic": "improved/clarified version",
  "product": "talsy.ai",
  "blogType": "B2B",
  "reasoning": "why B2B for this topic + product",
  "targetAudience": {
    "primary": "HR managers at SMBs",
    "secondary": "Payroll administrators",
    "painPoints": ["pain 1", "pain 2", "pain 3"],
    "searchIntent": "informational"
  },
  "contentGoal": "awareness",
  "funnelStage": "TOFU",
  "productAngle": "how to weave the product in",
  "estimatedSearchVolume": "low-medium",
  "competitiveness": "low-medium",
  "recommendedBlogLength": "2500-3000 words",
  "uniqueContentHook": "what makes our take better"
}
```

---

## Store Fields Updated

- `store.intakeData` — full parsed object
- `store.blogType` — `"B2B"` / `"B2C"` / `"B2B2C"`
- `store.targetAudience` — primary audience string
- `store.funnelStage` — `"TOFU"` / `"MOFU"` / `"BOFU"`
- `store.topic` — confirmed topic
- `store.product` — product name from context

---

## UI Behaviour

1. Shows product context badge (name, tagline, B2B/B2C from Agent 0)
2. If no `productContext` → shows warning and link to Agent 0
3. Text input for blog topic
4. **Content angle suggestions** — clickable chips from `productContext.contentAngles` to pre-fill the topic
5. On done: shows 3 stat cards (Blog Type, Funnel Stage, Competitiveness)
6. Shows audience panel (primary, secondary, pain points)
7. Shows product angle card
8. Shows unique content hook
9. "Next: Competitor Analysis →"

---

## Dependencies

- **Requires**: `store.productContext` (from Agent 0)
- Guards against null productContext — redirects to Agent 0 if missing
