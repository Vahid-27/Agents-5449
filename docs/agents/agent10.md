# Agent 10 — HTML Converter

## Purpose

Converts the final markdown blog post into production-ready, semantic HTML with full SEO infrastructure — schema markup, Open Graph tags, Twitter cards, JSON-LD structured data, and canonical URLs. Output is ready to drop directly into a CMS or publish as a standalone page.

---

## Endpoint

```
POST /api/blog/agent10/convert
```

### Request Body

```json
{
  "blogContent": "...final markdown from Agent 9...",
  "topic": "ex gratia payment",
  "keywords": { ...from Agent 3... },
  "outline": { ...from Agent 4... },
  "productContext": { ...ProductContext... }
}
```

---

## What Gets Generated

### `<head>` Tags
```html
<title>Ex Gratia Payment: The Complete HR Guide</title>
<meta name="description" content="...">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://talsy.ai/blog/ex-gratia-payment-guide">

<!-- Open Graph -->
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:type" content="article">
<meta property="og:url" content="...">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
```

### JSON-LD Structured Data

**Article Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "author": { "@type": "Organization", "name": "talsy.ai" },
  "publisher": { "@type": "Organization", "name": "talsy.ai" },
  "datePublished": "...",
  "url": "..."
}
```

**FAQPage Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is an ex gratia payment?",
      "acceptedAnswer": { "@type": "Answer", "text": "..." }
    }
  ]
}
```

### HTML Body
- `<article>` wrapper with schema attributes
- `<h1>` through `<h3>` hierarchy preserved
- `<ul>` / `<ol>` for lists
- `<strong>` / `<em>` for emphasis
- Image placeholders: `<img src="placeholder.jpg" alt="descriptive alt text">`
- Internal links: no `rel` attribute
- External links: `rel="noopener noreferrer"`
- CTA section: `<section class="cta">` linking to product URL

---

## Canonical URL Format

```
{productContext.url}/blog/{outline.slug}
```

Example: `https://www.talsy.ai/blog/ex-gratia-payment-guide`

This is dynamically generated from the active product — not hardcoded.

---

## Store Fields Updated

- `store.htmlOutput` — full HTML string
- `store.agents[10].output` — same as htmlOutput
- `store.agents[10].parsedData` — `{ html: fullText }`

---

## UI Behaviour

- **Preview tab**: `<iframe>` rendering the HTML in a sandboxed frame
- **HTML Source tab**: syntax-highlighted code block
- Copy HTML button
- Download `.html` file button
- "Publication Ready" success banner
- Word count of the HTML (approx)

---

## Dependencies

- **Requires**: `store.finalBlog` (Agent 9) or falls back to `store.blogDraft` (Agent 5)
- **Requires**: `store.outlineData` (Agent 4) for slug and meta description
- `productContext` required for accurate canonical URL and CTA link

---

## Token Usage

- Max tokens: `8000`
- Output can be large (full HTML document including head, body, scripts)
