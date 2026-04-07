import { Hono } from "hono";
import { streamText, generateText } from "ai";
import { getOpenAI, MODEL } from "../agent/index";

export const blogAgentRoutes = new Hono<{ Bindings: Env }>();

// ─── Helper: format productContext for prompts ─────────────────────────────
function productPrompt(ctx: any): string {
  if (!ctx) return "Unknown product";
  return `Product: ${ctx.name} (${ctx.url})
Description: ${ctx.description}
Core Features: ${(ctx.coreFeatures || []).join(", ")}
USP: ${(ctx.usp || []).join(", ")}
Target Market: ${ctx.targetMarket}
Tone: ${ctx.tone}
Business Model: ${ctx.businessModel}`;
}

// ─── Agent 0: Product Intelligence ───────────────────────────────────────────
blogAgentRoutes.post("/agent0/scrape", async (c) => {
  const { productUrl, productName, prdContent } = await c.req.json();
  const openai = getOpenAI(c.env);

  // Step 1: fetch product website via Jina Reader (handles JS-rendered pages)
  let scrapedContent = "";
  const baseUrl = productUrl.replace(/\/$/, "");
  const subPages = [baseUrl, `${baseUrl}/features`, `${baseUrl}/pricing`];
  const jinaResults: string[] = [];

  for (const pageUrl of subPages) {
    try {
      const res = await fetch(`https://r.jina.ai/${pageUrl}`, {
        headers: {
          "Accept": "text/plain",
          "X-No-Cache": "true",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const text = await res.text();
        jinaResults.push(`[${pageUrl}]\n${text.substring(0, 3000)}`);
      }
    } catch { /* skip sub-page if unavailable */ }
  }

  scrapedContent = jinaResults.join("\n\n---\n\n").substring(0, 10000) ||
    `Could not fetch ${productUrl}. Use product name and PRD data only.`;

  const stream = streamText({
    model: openai.chat(MODEL),
    maxTokens: 2000,
    system: `You are a Product Intelligence Agent. You analyze product websites and PRD documents to extract structured product context that will power an SEO blog writing pipeline.

You extract:
- What the product does (core features)
- Why it's unique (USP)
- Who it's for (target market)
- B2B vs B2C classification
- Tone and positioning
- Key messaging angles for content

Always respond in clean JSON only — no markdown code blocks, no explanation.`,
    prompt: `Analyze this product and extract structured intelligence.

Product Name: ${productName}
Website URL: ${productUrl}

Scraped website text:
${scrapedContent}

${prdContent ? `PRD / Additional context:\n${prdContent.substring(0, 3000)}` : "No PRD uploaded."}

Return this exact JSON structure:
{
  "name": "product name",
  "url": "${productUrl}",
  "tagline": "one-line product tagline",
  "description": "2-3 sentence product description",
  "coreFeatures": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "usp": ["unique differentiator 1", "unique differentiator 2", "unique differentiator 3"],
  "targetMarket": "primary target audience description",
  "primaryPersona": "e.g. HR Manager at mid-size company",
  "businessModel": "B2B | B2C | B2B2C",
  "tone": "e.g. professional, authoritative, friendly",
  "contentAngles": ["content angle 1 for blogs", "angle 2", "angle 3"],
  "competitors": ["competitor 1", "competitor 2", "competitor 3"],
  "keyPainPointsSolved": ["pain point 1", "pain point 2", "pain point 3"],
  "industry": "industry category",
  "pricingModel": "freemium | subscription | one-time | enterprise | unknown",
  "confidence": "high | medium | low"
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 1: Topic Intake ────────────────────────────────────────────────────
blogAgentRoutes.post("/agent1/analyze", async (c) => {
  const { topic, productContext } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are the Blog Topic Intake Agent. You analyze blog topics in the context of a specific product and determine the optimal content strategy.

Your job:
- Validate and refine the blog topic
- Determine B2B vs B2C positioning based on the product and topic
- Identify target audience, funnel stage, content goal
- Understand the product deeply and find the best content angle

Always respond in clean JSON format — no markdown code blocks.`,
    prompt: `Analyze this blog topic for the following product.

${productPrompt(productContext)}

Blog Topic: "${topic}"

Determine the optimal content strategy. Return JSON:
{
  "topic": "${topic}",
  "refinedTopic": "improved/clarified version of the topic if needed",
  "product": "${productContext?.name || "Unknown"}",
  "blogType": "B2B | B2C | B2B2C",
  "reasoning": "why this B2B/B2C classification for this topic + product",
  "targetAudience": {
    "primary": "specific primary audience",
    "secondary": "secondary audience",
    "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
    "searchIntent": "informational | commercial | transactional | navigational"
  },
  "contentGoal": "awareness | consideration | conversion | retention",
  "funnelStage": "TOFU | MOFU | BOFU",
  "productAngle": "how to naturally weave ${productContext?.name || "the product"} into this blog",
  "estimatedSearchVolume": "low | low-medium | medium | medium-high | high",
  "competitiveness": "low | low-medium | medium | medium-high | high",
  "recommendedBlogLength": "word count range",
  "uniqueContentHook": "what makes our take on this topic better than competitors"
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 2: Competitor Analysis ────────────────────────────────────────────
blogAgentRoutes.post("/agent2/analyze", async (c) => {
  const { topic, audience, blogType, productContext } = await c.req.json();
  const openai = getOpenAI(c.env);

  // Scrape Google SERP via Jina + top 3 result pages
  let serpContent = "";
  try {
    const query = encodeURIComponent(topic);
    const serpRes = await fetch(`https://r.jina.ai/https://www.google.com/search?q=${query}&num=10`, {
      headers: { "Accept": "text/plain", "X-No-Cache": "true" },
      signal: AbortSignal.timeout(12000),
    });
    if (serpRes.ok) {
      serpContent = (await serpRes.text()).substring(0, 4000);
    }
  } catch { /* proceed without SERP */ }

  // Scrape top 3 result URLs from Jina Reader
  const competitorSnippets: string[] = [];
  const urlPattern = /https?:\/\/(?!google\.com)[^\s"'<>)]+\.[a-z]{2,}\/[^\s"'<>)]+/gi;
  const foundUrls = [...(serpContent.matchAll(urlPattern) || [])].map(m => m[0]).filter(Boolean).slice(0, 3);

  for (const url of foundUrls) {
    try {
      const res = await fetch(`https://r.jina.ai/${url}`, {
        headers: { "Accept": "text/plain" },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const text = await res.text();
        competitorSnippets.push(`URL: ${url}\n${text.substring(0, 2000)}`);
      }
    } catch { /* skip */ }
  }

  const competitorContext = competitorSnippets.length > 0
    ? `\n\nREAL COMPETITOR CONTENT SCRAPED:\n${competitorSnippets.join("\n\n---\n\n")}`
    : "\n\nNo competitor pages could be scraped. Use your training knowledge.";

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are a Competitor Content Analysis Agent specializing in SEO content strategy.
You analyze real scraped competitor content alongside your training knowledge about top-ranking pages.
You identify what makes content rank #1 and what gaps exist.
Always respond with rich, structured analysis — no markdown code blocks.`,
    prompt: `Perform a deep competitor content analysis for: "${topic}"
Blog type: ${blogType} | Target audience: ${audience}
${productContext ? `\nProduct context:\n${productPrompt(productContext)}` : ""}

Google SERP data:
${serpContent || "Not available"}
${competitorContext}

Analyze the real scraped content and identify gaps, strengths, and winning strategy.

Return JSON:
{
  "topic": "${topic}",
  "searchEnginesAnalyzed": ["Google", "ChatGPT", "Grok", "Perplexity", "Gemini", "Claude"],
  "topCompetitors": [
    {
      "rank": 1,
      "domain": "example.com",
      "title": "article title",
      "estimatedWordCount": 2500,
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "keyTopicsCovered": ["topic 1", "topic 2"],
      "missingTopics": ["gap 1", "gap 2"],
      "contentFormat": "guide/listicle/comparison/case-study",
      "seoScore": "high/medium/low"
    }
  ],
  "commonStrengths": ["what all top content does well"],
  "contentGaps": ["topics no competitor covers well"],
  "dominantKeywords": ["kw1", "kw2", "kw3"],
  "contentFormats": ["most common format types"],
  "averageWordCount": 2000,
  "winningStrategy": "what you need to do to outrank them",
  "featuredSnippetOpportunity": "yes/no + explanation",
  "peopleAlsoAsk": ["PAA question 1", "PAA question 2", "PAA question 3", "PAA question 4", "PAA question 5"]
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 3: Keyword Extraction ─────────────────────────────────────────────
blogAgentRoutes.post("/agent3/extract", async (c) => {
  const { topic, competitorData, audience, blogType, productContext } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are a Keyword Research and Extraction Agent specialized in SEO, AEO, GEO, and LLMO optimization.
Extract comprehensive keyword sets that will help content rank across traditional search, AI-generated answers, voice search, and LLM citations.
Always respond in clean JSON — no markdown code blocks.`,
    prompt: `Extract all target keywords for: "${topic}"
Blog type: ${blogType} | Audience: ${audience}
${productContext ? `Product: ${productContext.name} — ${productContext.description}` : ""}
Competitor insights: ${JSON.stringify(competitorData?.dominantKeywords || [])}
Competitor gaps: ${JSON.stringify(competitorData?.contentGaps || [])}

Return JSON:
{
  "topic": "${topic}",
  "primaryKeyword": "main keyword to target",
  "secondaryKeywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "longTailKeywords": ["long tail 1", "long tail 2", "long tail 3", "long tail 4", "long tail 5"],
  "lsiKeywords": ["semantic keyword 1", "LSI 2", "LSI 3", "LSI 4", "LSI 5"],
  "questionKeywords": ["who...", "what...", "how...", "why...", "when..."],
  "voiceSearchKeywords": ["conversational phrase 1", "conversational phrase 2"],
  "ngramKeywords": {
    "bigrams": ["2-word phrase 1", "2-word phrase 2"],
    "trigrams": ["3-word phrase 1", "3-word phrase 2"]
  },
  "intentMapping": {
    "informational": ["kw1", "kw2"],
    "commercial": ["kw1", "kw2"],
    "transactional": ["kw1", "kw2"]
  },
  "aeoKeywords": ["answer-engine optimized question phrases"],
  "geoKeywords": ["geo/local keywords if applicable"],
  "llmoKeywords": ["phrases LLMs commonly cite for this topic"],
  "keywordDensityTargets": {
    "primaryKeyword": "1.5-2%",
    "secondaryKeywords": "0.5-1% each"
  },
  "estimatedSearchVolumes": {
    "primaryKeyword": "monthly searches estimate",
    "topSecondary": "monthly searches estimate"
  },
  "competitiveGapOpportunities": ["gap keyword 1", "gap keyword 2"]
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 4: SEO Research + Outline ─────────────────────────────────────────
blogAgentRoutes.post("/agent4/outline", async (c) => {
  const { topic, keywords, competitorData, audience, blogType, productContext } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are an SEO Content Strategist and Blog Outline Architect.
You create blog outlines optimized for SEO, AEO, GEO, LLMO, and semantic search.
Your outlines are designed to win featured snippets, appear in AI answers, and rank #1.
Always respond in clean JSON — no markdown code blocks.`,
    prompt: `Create a comprehensive SEO/AEO/GEO/LLMO-optimized blog outline.

Topic: "${topic}"
Audience: ${audience} | Type: ${blogType}
${productContext ? `\n${productPrompt(productContext)}` : ""}
Primary keyword: ${keywords?.primaryKeyword || topic}
Secondary keywords: ${JSON.stringify(keywords?.secondaryKeywords || [])}
Long-tail: ${JSON.stringify(keywords?.longTailKeywords || [])}
People Also Ask: ${JSON.stringify(competitorData?.peopleAlsoAsk || [])}
Content gaps to fill: ${JSON.stringify(competitorData?.contentGaps || [])}

Return JSON:
{
  "title": "SEO-optimized H1 title (60-65 chars)",
  "metaDescription": "compelling meta description (150-160 chars)",
  "slug": "url-friendly-slug",
  "estimatedWordCount": 3000,
  "targetReadingTime": "X min read",
  "primaryKeyword": "...",
  "topRankingQueries": ["GSC simulated query 1", "query 2", "query 3"],
  "topPAA": ["PAA question 1", "PAA question 2", "PAA question 3"],
  "outline": [
    {
      "type": "intro",
      "heading": "Introduction heading",
      "purpose": "hook + problem + what reader will learn",
      "keywordsToInclude": ["kw1", "kw2"],
      "wordCount": 200,
      "seoNotes": "include primary keyword in first 100 words"
    },
    {
      "type": "section",
      "heading": "H2 heading",
      "subheadings": [
        {"h3": "Sub-section 1", "keywords": ["kw"], "notes": "answer PAA question"},
        {"h3": "Sub-section 2", "keywords": ["kw"], "notes": "add stat/data"}
      ],
      "purpose": "what this section covers",
      "keywordsToInclude": ["kw1", "kw2"],
      "wordCount": 400,
      "seoNotes": "featured snippet opportunity",
      "aeoNotes": "direct answer format for AI engines",
      "contentType": "explanation/listicle/comparison/FAQ"
    }
  ],
  "faqSection": [
    {"question": "Q1", "intent": "informational"},
    {"question": "Q2", "intent": "commercial"}
  ],
  "conclusionNotes": "CTA direction, summary approach",
  "schemaMarkupRecommended": ["Article", "FAQPage"],
  "contentDifferentiators": ["what will make this outrank competitors"]
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 5: Blog Writer ─────────────────────────────────────────────────────
blogAgentRoutes.post("/agent5/write", async (c) => {
  const { topic, outline, keywords, audience, blogType, productContext } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    maxTokens: 8000,
    system: `You are an elite SEO Content Writer who writes blogs that rank #1 on Google, appear in AI-generated answers, and get 100k+ organic impressions.

Your writing principles:
- SEO: proper keyword density, heading hierarchy, semantic coverage
- AEO: direct answers, concise definitions, FAQ-ready content
- GEO: structured for AI citation (clear facts, attributed claims)
- LLMO: write in a way LLMs will cite and reference
- E-E-A-T: demonstrate Experience, Expertise, Authoritativeness, Trustworthiness

You write for a specific product — naturally weave in product references without being salesy.`,
    prompt: `Write a complete, #1-ranking blog post.

${productContext ? productPrompt(productContext) : `Product: Unknown`}

Topic: "${topic}"
Audience: ${audience} | Type: ${blogType}
Primary keyword: ${keywords?.primaryKeyword || topic}
Secondary keywords: ${JSON.stringify(keywords?.secondaryKeywords || [])}
Long-tail keywords: ${JSON.stringify(keywords?.longTailKeywords || [])}
LSI keywords: ${JSON.stringify(keywords?.lsiKeywords || [])}

Blog outline to follow:
${JSON.stringify(outline?.outline || [], null, 2)}

Title: ${outline?.title || topic}
Meta description: ${outline?.metaDescription || ""}
FAQ questions to answer: ${JSON.stringify(outline?.faqSection || [])}

Requirements:
- Write ~${outline?.estimatedWordCount || 2500} words
- Use H1 for title, H2 for main sections, H3 for subsections
- Include the primary keyword in: title, first paragraph, 2-3 H2s, conclusion
- Add FAQ section at end with 5-7 questions
- End with a compelling CTA mentioning ${productContext?.name || "the product"}
- Use bullet points, numbered lists for scannability
- Write in clear, authoritative, engaging prose
- Do NOT use markdown code blocks — write clean markdown

Write the full blog post now:`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 6: Internal Linking ────────────────────────────────────────────────
blogAgentRoutes.post("/agent6/internal-links", async (c) => {
  const { blogContent, topic, productContext, funnelStage } = await c.req.json();
  const openai = getOpenAI(c.env);

  // Build sitemap based on product
  const productUrl = productContext?.url || "https://talsy.ai";
  const productName = productContext?.name || "the product";

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are an Internal Linking SEO Specialist.
You analyze blog content and suggest strategic internal links that improve SEO, AEO, GEO, LLMO, and funnel flow.
Always respond in clean JSON — no markdown code blocks.`,
    prompt: `Analyze this blog and suggest internal links.

Topic: "${topic}"
Product: ${productName} (${productUrl})
Funnel Stage: ${funnelStage}

Blog content preview (first 1000 chars):
${blogContent?.substring(0, 1000)}...

Product features to link to (based on: ${JSON.stringify(productContext?.coreFeatures || [])}):
Generate realistic internal page URLs based on the product website ${productUrl}.

Return JSON:
{
  "funnelStageAnalysis": {
    "stage": "TOFU/MOFU/BOFU",
    "reasoning": "why this stage",
    "contentIntent": "what the reader wants"
  },
  "internalLinkSuggestions": [
    {
      "anchorText": "exact text to hyperlink in the blog",
      "targetUrl": "${productUrl}/relevant-page",
      "targetPage": "page name",
      "placement": "where in the blog (intro/section/conclusion)",
      "seoReason": "why this link matters",
      "funnelPurpose": "TOFU awareness / MOFU consideration / BOFU conversion"
    }
  ],
  "linkingStrategy": "overall approach",
  "talsyProductMentions": [
    {
      "context": "sentence where product is mentioned",
      "suggestedAnchor": "which words to link",
      "targetUrl": "${productUrl}/most-relevant-page"
    }
  ],
  "totalLinksRecommended": 4,
  "priorityLinks": ["top 2 most important anchor texts"]
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 7: External Linking ────────────────────────────────────────────────
blogAgentRoutes.post("/agent7/external-links", async (c) => {
  const { blogContent, topic, keywords, productContext } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are an External Link and Citation Specialist for SEO content.
You identify high-authority external sources, statistics, and data points that boost E-E-A-T signals.
Always respond in clean JSON — no markdown code blocks.`,
    prompt: `Identify external link opportunities for this blog.

Topic: "${topic}"
${productContext ? `Product: ${productContext.name} — ${productContext.description}` : ""}
Primary keyword: ${keywords?.primaryKeyword || topic}
Industry: ${productContext?.industry || "general"}

Blog content preview:
${blogContent?.substring(0, 1000)}...

Return JSON:
{
  "statsAndData": [
    {
      "stat": "specific statistic or data point",
      "source": "source name",
      "url": "https://source.com/study",
      "year": "2024",
      "relevance": "why this stat strengthens the blog",
      "placement": "which section to add it"
    }
  ],
  "authorityLinks": [
    {
      "anchorText": "text to link",
      "url": "https://authority-site.com/page",
      "domain": "authority-site.com",
      "domainAuthority": "high/very-high",
      "linkType": "citation/further-reading/tool",
      "placement": "section name"
    }
  ],
  "competitorLinksToAvoid": ["competitor.com", "competitor2.com"],
  "linkBuildingOpportunities": ["outreach target 1", "outreach target 2"],
  "eeatSignals": ["how these external links boost E-E-A-T"]
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 8: Content Auditor ─────────────────────────────────────────────────
blogAgentRoutes.post("/agent8/audit", async (c) => {
  const { blogContent, keywords, outline, audience, blogType, productContext } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    maxTokens: 3000,
    system: `You are a Senior SEO Content Auditor. You perform comprehensive audits covering SEO, AEO, GEO, LLMO, E-E-A-T, readability, and conversion optimization.
Always respond in clean JSON — no markdown code blocks.`,
    prompt: `Perform a full content audit on this blog post.

Topic: "${outline?.title || "blog"}"
${productContext ? `Product: ${productContext.name} — ${productContext.description}` : ""}
Target Audience: ${audience} | Type: ${blogType}
Primary Keyword: ${keywords?.primaryKeyword || "unknown"}
Target Word Count: ${outline?.estimatedWordCount || 3000}
Actual Word Count: ${blogContent?.split(/\s+/).filter(Boolean).length || 0}

Blog content (first 8000 chars):
${blogContent?.substring(0, 12000)}

Audit across all dimensions. Return JSON:
{
  "overallScore": 85,
  "grades": {
    "seo": "A/B/C/D",
    "aeo": "A/B/C/D",
    "geo": "A/B/C/D",
    "llmo": "A/B/C/D",
    "eeat": "A/B/C/D",
    "readability": "A/B/C/D",
    "conversion": "A/B/C/D"
  },
  "criticalIssues": [
    {
      "issue": "specific problem",
      "impact": "high/medium/low",
      "fix": "exactly how to fix it",
      "section": "where in the blog"
    }
  ],
  "seoAnalysis": {
    "keywordDensity": "X%",
    "keywordInTitle": true,
    "keywordInFirstParagraph": true,
    "headingOptimization": "analysis",
    "metaDescriptionQuality": "analysis",
    "internalLinkCount": 0,
    "recommendations": ["rec 1", "rec 2"]
  },
  "aeoAnalysis": {
    "featuredSnippetReadiness": "yes/no/partial",
    "directAnswersPresent": true,
    "faqQuality": "analysis",
    "recommendations": ["rec 1"]
  },
  "eeatSignals": {
    "experienceSignals": ["found/missing signals"],
    "expertiseSignals": ["found/missing signals"],
    "recommendations": ["rec 1"]
  },
  "readabilityAnalysis": {
    "fleschKincaidEstimate": "grade level",
    "avgSentenceLength": "X words",
    "paragraphLength": "analysis",
    "recommendations": ["rec 1"]
  },
  "missingElements": ["element 1", "element 2"],
  "strengths": ["strength 1", "strength 2"],
  "priorityFixes": ["fix 1 (most important)", "fix 2", "fix 3"]
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 9: Final Publisher ─────────────────────────────────────────────────
blogAgentRoutes.post("/agent11/finalize", async (c) => {
  const { blogContent, auditReport, internalLinks, externalLinks, keywords, topic, outline, productContext } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    maxTokens: 8000,
    system: `You are the Final Blog Publisher Agent. You take a blog draft and all improvement data and produce the definitive, publication-ready version.

You integrate:
- All audit fixes and improvements
- Internal links (weaving them into anchor text naturally)
- External citations and stats
- Keyword density optimization
- E-E-A-T enhancement
- AEO/GEO/LLMO optimization
- Final CTA polish

Output clean, publication-ready markdown. No code blocks.`,
    prompt: `Produce the final, publication-ready version of this blog.

${productContext ? productPrompt(productContext) : ""}
Topic: "${topic}"
Primary Keyword: ${keywords?.primaryKeyword || topic}

ORIGINAL DRAFT:
${blogContent}

AUDIT FINDINGS TO FIX:
Critical issues: ${JSON.stringify(auditReport?.criticalIssues?.slice(0, 5) || [])}
Priority fixes: ${JSON.stringify(auditReport?.priorityFixes || [])}
Missing elements: ${JSON.stringify(auditReport?.missingElements || [])}

INTERNAL LINKS TO WEAVE IN:
${JSON.stringify(internalLinks?.internalLinkSuggestions?.slice(0, 6) || [])}

EXTERNAL STATS TO INTEGRATE:
${JSON.stringify(externalLinks?.statsAndData?.slice(0, 5) || [])}

Instructions:
1. Fix ALL critical issues from the audit
2. Naturally integrate the internal links using the exact anchor texts suggested
3. Add the external stats in the relevant sections (format: "According to [source], X%...")
4. Enhance E-E-A-T signals throughout
5. Ensure primary keyword appears naturally at 1.5-2% density
6. Make the FAQ section crisp and AEO-optimized
7. Write a compelling, conversion-focused CTA for ${productContext?.name || "the product"} at the end
8. Target ${outline?.estimatedWordCount || 3000}+ words

Write the complete final blog post in clean markdown now:`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 10: HTML Converter ─────────────────────────────────────────────────
blogAgentRoutes.post("/agent12/convert", async (c) => {
  const { blogContent, topic, keywords, outline, productContext } = await c.req.json();
  const openai = getOpenAI(c.env);

  const productUrl = productContext?.url || "https://talsy.ai";
  const productName = productContext?.name || "the product";

  const stream = streamText({
    model: openai.chat(MODEL),
    maxTokens: 8000,
    system: `You are an HTML/SEO Developer Agent who converts blog content to production-ready HTML.
You produce semantic, SEO-optimized HTML with schema markup, Open Graph tags, and structured data.`,
    prompt: `Convert this blog to production-ready, SEO-optimized HTML for ${productName}.

Product URL: ${productUrl}
Topic: "${topic}"
Primary keyword: ${keywords?.primaryKeyword || topic}
Slug: ${outline?.slug || "blog-post"}
Meta description: ${outline?.metaDescription || ""}

Blog content:
${blogContent}

Generate complete HTML including:
1. Full <head> with all meta tags, OG tags, Twitter cards, canonical pointing to ${productUrl}/blog/${outline?.slug || "blog-post"}
2. JSON-LD structured data (Article schema + FAQPage schema)
3. Semantic HTML5 body with proper article structure
4. Image placeholders with descriptive alt text
5. Proper rel attributes on links (internal: no rel, external: rel="noopener noreferrer")
6. CTA section linking to ${productUrl}

Output complete, valid HTML document:`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 11: Intent Consistency Checker ────────────────────────────────────
blogAgentRoutes.post("/agent9/check", async (c) => {
  const { topic, intakeData, keywords, outline, blogDraft, finalBlog, productContext } = await c.req.json();
  const openai = getOpenAI(c.env);
  const content = finalBlog || blogDraft || '';

  const stream = streamText({
    model: openai.chat(MODEL),
    maxTokens: 3000,
    system: `You are an Intent Consistency Auditor. Your job is to verify that the original blog intent (topic, audience, funnel stage, SEO goal) has been faithfully preserved and amplified throughout every stage of the content pipeline — from intake through final output.

You detect intent drift: when the content slowly shifts away from the original purpose, audience, or message.
Always respond in clean JSON — no markdown code blocks.`,
    prompt: `Analyze whether the intent set at the start of this pipeline has been maintained throughout.

ORIGINAL INTENT:
Topic: "${topic}"
Blog Type: ${intakeData?.blogType || 'unknown'}
Target Audience: ${JSON.stringify(intakeData?.targetAudience || {})}
Funnel Stage: ${intakeData?.funnelStage || 'unknown'}
Content Goal: ${intakeData?.contentGoal || 'organic traffic + conversions'}
Primary Keyword: ${keywords?.primaryKeyword || topic}
Search Intent: ${intakeData?.searchIntent || 'informational'}

OUTLINE STRATEGY:
Title: ${outline?.title || 'N/A'}
Angle: ${outline?.contentAngle || 'N/A'}
CTA Direction: ${outline?.ctaStrategy || 'N/A'}
Estimated Funnel Fit: ${outline?.funnelFit || 'N/A'}

FINAL CONTENT (first 6000 chars):
${content.substring(0, 6000)}

${productContext ? `Product Context: ${productContext.name} — ${productContext.description}\nUSP: ${(productContext.usp || []).join(', ')}` : ''}

Check for intent drift across these dimensions and return JSON:
{
  "intentConsistencyScore": 87,
  "overallVerdict": "PASS | DRIFT | FAIL",
  "intentSummary": {
    "originalIntent": "one-line summary of what this piece was supposed to be",
    "deliveredIntent": "one-line summary of what was actually written",
    "driftSeverity": "none | minor | moderate | major"
  },
  "dimensionScores": {
    "audienceAlignment": {
      "score": 90,
      "status": "PASS | DRIFT | FAIL",
      "finding": "specific observation",
      "evidence": "quote or example from content"
    },
    "funnelStageAlignment": {
      "score": 85,
      "status": "PASS | DRIFT | FAIL",
      "finding": "specific observation",
      "evidence": "quote or example"
    },
    "topicRelevance": {
      "score": 92,
      "status": "PASS | DRIFT | FAIL",
      "finding": "does content stay on topic or wander?",
      "evidence": "quote or example"
    },
    "keywordIntentMatch": {
      "score": 88,
      "status": "PASS | DRIFT | FAIL",
      "finding": "does keyword usage match search intent?",
      "evidence": "quote or example"
    },
    "toneConsistency": {
      "score": 82,
      "status": "PASS | DRIFT | FAIL",
      "finding": "is tone consistent with product voice and audience?",
      "evidence": "quote or example"
    },
    "ctaAlignment": {
      "score": 79,
      "status": "PASS | DRIFT | FAIL",
      "finding": "does the CTA match the funnel stage and original goal?",
      "evidence": "quote or example"
    },
    "productPositioning": {
      "score": 85,
      "status": "PASS | DRIFT | FAIL",
      "finding": "is the product positioned correctly for the audience?",
      "evidence": "quote or example"
    }
  },
  "driftInstances": [
    {
      "location": "section/paragraph description",
      "originalIntent": "what was expected",
      "actualContent": "what was written instead",
      "severity": "minor | moderate | major",
      "fix": "specific rewrite instruction"
    }
  ],
  "intentStrengths": ["what worked well in maintaining intent"],
  "criticalFixes": ["highest-priority fix 1", "fix 2", "fix 3"],
  "approvedForPublishing": true
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 12: Legal Compliance Checker ──────────────────────────────────────
blogAgentRoutes.post("/agent10/legal", async (c) => {
  const { topic, finalBlog, blogDraft, keywords, outline, productContext, externalLinks } = await c.req.json();
  const openai = getOpenAI(c.env);
  const content = finalBlog || blogDraft || '';

  const stream = streamText({
    model: openai.chat(MODEL),
    maxTokens: 3500,
    system: `You are a Legal Compliance Officer specializing in digital content, SEO practices, and marketing law. 

You audit blog content for:
1. COPYRIGHT & PLAGIARISM — unlicensed content, unattributed quotes, data without sources
2. DEFAMATION — false statements about competitors, misleading claims, disparagement
3. FTC/ADVERTISING COMPLIANCE — undisclosed sponsored content, deceptive CTAs, false testimonials
4. SEO LEGAL ISSUES — keyword stuffing penalties, cloaking practices, misleading meta descriptions
5. AEO/GEO/LLMO COMPLIANCE — AI-generated content disclosure requirements, manipulative structured data
6. PRIVACY & DATA — unlawful data collection references, GDPR/CCPA issues in CTAs
7. TRADEMARK — improper use of competitor brand names, keyword hijacking
8. MEDICAL/FINANCIAL/LEGAL DISCLAIMERS — regulated content without proper disclaimers
9. CONTENT ACCURACY — verifiable factual claims that may be incorrect
10. PLATFORM POLICIES — content that violates Google, Bing, or major platform policies

Always respond in clean JSON — no markdown code blocks.`,
    prompt: `Perform a comprehensive legal compliance audit on this blog content.

Topic: "${topic}"
Product: ${productContext?.name || 'unknown'} (${productContext?.industry || 'unknown industry'})
Primary Keyword: ${keywords?.primaryKeyword || topic}

CONTENT TO AUDIT (first 8000 chars):
${content.substring(0, 8000)}

EXTERNAL LINKS/CITATIONS USED:
${JSON.stringify(externalLinks?.statsAndData?.slice(0, 10) || externalLinks?.authorityLinks?.slice(0, 10) || [])}

META DESCRIPTION: ${outline?.metaDescription || 'N/A'}
SLUG: ${outline?.slug || 'N/A'}

Return comprehensive legal compliance report as JSON:
{
  "complianceScore": 88,
  "overallStatus": "COMPLIANT | REVIEW_REQUIRED | NON_COMPLIANT",
  "publishingClearance": "CLEAR | CONDITIONAL | BLOCKED",
  "summary": "one-sentence overall assessment",
  "riskLevel": "low | medium | high | critical",
  "categories": {
    "copyright": {
      "status": "PASS | WARNING | FAIL",
      "score": 90,
      "issues": [],
      "fixes": []
    },
    "ftcCompliance": {
      "status": "PASS | WARNING | FAIL",
      "score": 95,
      "issues": [],
      "fixes": []
    },
    "defamationRisk": {
      "status": "PASS | WARNING | FAIL",
      "score": 88,
      "issues": [],
      "fixes": []
    },
    "seoCompliance": {
      "status": "PASS | WARNING | FAIL",
      "score": 92,
      "issues": ["any black-hat SEO practices", "keyword stuffing", "misleading meta"],
      "fixes": []
    },
    "aiContentDisclosure": {
      "status": "PASS | WARNING | FAIL",
      "score": 70,
      "issues": ["AI-generated content not disclosed if legally required in jurisdiction"],
      "fixes": ["Add AI content disclosure footer if targeting EU/regulated markets"]
    },
    "trademarkIssues": {
      "status": "PASS | WARNING | FAIL",
      "score": 90,
      "issues": [],
      "fixes": []
    },
    "claimsAccuracy": {
      "status": "PASS | WARNING | FAIL",
      "score": 85,
      "issues": ["list any unverified statistical or factual claims"],
      "fixes": ["cite source or add 'according to...' qualifier"]
    },
    "privacyCompliance": {
      "status": "PASS | WARNING | FAIL",
      "score": 88,
      "issues": [],
      "fixes": []
    },
    "regulatoryDisclaimer": {
      "status": "PASS | WARNING | FAIL",
      "score": 90,
      "issues": ["missing disclaimers for regulated content (medical, financial, legal advice)"],
      "fixes": []
    },
    "platformPolicies": {
      "status": "PASS | WARNING | FAIL",
      "score": 95,
      "issues": ["Google EEAT compliance", "content quality policy adherence"],
      "fixes": []
    }
  },
  "criticalIssues": [
    {
      "issue": "specific legal problem",
      "category": "copyright | ftc | defamation | trademark | etc",
      "riskLevel": "high | medium | low",
      "location": "where in the content",
      "legalBasis": "relevant law or guideline (e.g., FTC Act Section 5, DMCA, GDPR Art. 13)",
      "requiredFix": "exactly what must change before publishing",
      "urgency": "must-fix-before-publish | fix-within-30-days | best-practice"
    }
  ],
  "recommendedDisclaimers": [
    {
      "type": "disclaimer type",
      "suggestedText": "exact disclaimer copy to add",
      "placement": "where to add it (footer, intro, etc.)"
    }
  ],
  "seoLegalNotes": [
    "any Google Search Essentials policy considerations",
    "structured data compliance notes",
    "meta tag legal considerations"
  ],
  "llmoAeoLegalNotes": [
    "AI answer engine optimization legal considerations",
    "structured data manipulation risks",
    "AI training data scraping disclosure"
  ],
  "conditionalClearanceSteps": [
    "step 1 to achieve full compliance",
    "step 2"
  ],
  "legallyRequired": {
    "privacyPolicyLink": false,
    "termsOfServiceLink": false,
    "cookieConsentMention": false,
    "aiContentDisclosure": false,
    "affiliateDisclosure": false,
    "sponsoredContentLabel": false
  }
}`,
  });

  return stream.toTextStreamResponse();
});
