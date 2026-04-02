import { Hono } from "hono";
import { streamText } from "ai";
import { getOpenAI, MODEL } from "../agent/index";

export const blogAgentRoutes = new Hono<{ Bindings: Env }>();

// ─── Agent 1: Topic Intake ───────────────────────────────────────────────────
blogAgentRoutes.post("/agent1/analyze", async (c) => {
  const { topic, product } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are the Blog Topic Intake Agent for talsy.ai — an AI-powered recruitment and sourcing engine.
Your job: analyze a blog topic and produce a structured intake report.

talsy.ai products:
- Free ATS (Applicant Tracking System)
- Internal Recruitment tools
- Vendor Management
- AI Technical Screening
- Job Seeker platform
- Freelancer marketplace

Always respond in clean JSON format with no markdown code blocks.`,
    prompt: `Analyze this blog topic: "${topic}"
Product focus: ${product || "talsy.ai (general)"}

Provide a JSON response with these exact fields:
{
  "topic": "${topic}",
  "product": "product name",
  "blogType": "B2B or B2C",
  "reasoning": "why B2B or B2C",
  "targetAudience": {
    "primary": "main audience segment",
    "secondary": "secondary segment",
    "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
    "searchIntent": "informational/navigational/transactional/commercial"
  },
  "contentGoal": "awareness/consideration/decision",
  "funnelStage": "TOFU/MOFU/BOFU",
  "talsyAngle": "how talsy.ai fits this topic",
  "estimatedSearchVolume": "low/medium/high",
  "competitiveness": "low/medium/high",
  "recommendedBlogLength": "word count range"
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 2: Competitor Analysis ────────────────────────────────────────────
blogAgentRoutes.post("/agent2/analyze", async (c) => {
  const { topic, audience, blogType } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are a Competitor Content Analysis Agent specializing in SEO content strategy.
You simulate analysis of top-ranking content across Google, ChatGPT, Grok, Perplexity, Gemini, and Claude search results.
You identify what makes content rank #1 and what gaps exist.
Always respond with rich, structured analysis. Use your training knowledge to simulate realistic competitor research.`,
    prompt: `Perform a deep competitor content analysis for the blog topic: "${topic}"
Blog type: ${blogType} | Target audience: ${audience}

Simulate analysis of top 5 ranking pages across search engines (Google, ChatGPT, Grok, Perplexity, Gemini, Claude).

Return a JSON response:
{
  "topic": "${topic}",
  "searchEnginesAnalyzed": ["Google", "ChatGPT", "Grok", "Perplexity", "Gemini", "Claude"],
  "topCompetitors": [
    {
      "rank": 1,
      "domain": "example.com",
      "title": "article title",
      "estimatedWordCount": 2500,
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "keyTopicsCovered": ["topic 1", "topic 2"],
      "missingTopics": ["gap 1", "gap 2"],
      "contentFormat": "listicle/guide/comparison/case-study",
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
  const { topic, competitorData, audience, blogType } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are a Keyword Research and Extraction Agent specialized in SEO, AEO, GEO, and LLMO optimization.
Extract comprehensive keyword sets that will help content rank across traditional search, AI-generated answers, voice search, and LLM citations.`,
    prompt: `Extract all target keywords for: "${topic}"
Blog type: ${blogType} | Audience: ${audience}
Competitor insights: ${JSON.stringify(competitorData?.dominantKeywords || [])}
Competitor gaps: ${JSON.stringify(competitorData?.contentGaps || [])}

Return JSON:
{
  "topic": "${topic}",
  "primaryKeyword": "main keyword to target",
  "secondaryKeywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "longTailKeywords": ["long tail 1", "long tail 2", "long tail 3", "long tail 4", "long tail 5", "long tail 6"],
  "lsiKeywords": ["LSI/semantic keyword 1", "LSI 2", "LSI 3", "LSI 4", "LSI 5"],
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
  "geoKeywords": ["geo/local if applicable, or empty"],
  "llmoKeywords": ["phrases LLMs commonly cite for this topic"],
  "keywordDensityTargets": {
    "primaryKeyword": "1.5-2%",
    "secondaryKeywords": "0.5-1% each"
  },
  "estimatedSearchVolumes": {
    "primaryKeyword": "monthly searches estimate",
    "topSecondary": "monthly searches estimate"
  }
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 4: SEO Research + Outline ─────────────────────────────────────────
blogAgentRoutes.post("/agent4/outline", async (c) => {
  const { topic, keywords, competitorData, audience, blogType } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are an SEO Content Strategist and Blog Outline Architect.
You create blog outlines optimized for SEO (search engine optimization), AEO (answer engine optimization), GEO (generative engine optimization), LLMO (large language model optimization), and semantic search.

Your outlines are designed to:
- Win featured snippets
- Appear in AI-generated answers (ChatGPT, Perplexity, Gemini, Claude)
- Rank in voice search
- Satisfy all search intents
- Cover topic clusters comprehensively`,
    prompt: `Create a comprehensive SEO/AEO/GEO/LLMO-optimized blog outline for: "${topic}"
Audience: ${audience} | Type: ${blogType}
Primary keyword: ${keywords?.primaryKeyword || topic}
Secondary keywords: ${JSON.stringify(keywords?.secondaryKeywords || [])}
Long-tail: ${JSON.stringify(keywords?.longTailKeywords || [])}
People Also Ask: ${JSON.stringify(competitorData?.peopleAlsoAsk || [])}
Content gaps to fill: ${JSON.stringify(competitorData?.contentGaps || [])}

Simulate Google Search Console top queries and Google Keyword Planner data for this topic.

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
      "purpose": "hook + problem statement + what reader will learn",
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
      "seoNotes": "opportunity for featured snippet with bullet list",
      "aeoNotes": "direct answer format for AI engines",
      "contentType": "explanation/listicle/comparison/FAQ"
    }
  ],
  "faqSection": [
    {"question": "Q1", "intent": "informational"},
    {"question": "Q2", "intent": "commercial"}
  ],
  "conclusionNotes": "CTA direction, summary approach",
  "schemaMarkupRecommended": ["Article", "FAQPage", "HowTo"],
  "internalLinkOpportunities": ["talsy.ai page relevant to this topic"],
  "contentDifferentiators": ["what will make this outrank competitors"]
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 5: Blog Writer ─────────────────────────────────────────────────────
blogAgentRoutes.post("/agent5/write", async (c) => {
  const { topic, outline, keywords, audience, blogType, product } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    maxTokens: 8000,
    system: `You are an elite SEO Content Writer who writes blogs that rank #1 on Google, appear in AI-generated answers, and get 100k+ organic impressions.

Your writing principles:
- SEO: proper keyword density, heading hierarchy, semantic coverage
- AEO: direct answers, concise definitions, FAQ-ready content
- GEO: structured for AI citation (clear facts, attributed claims, structured data)
- LLMO: write in a way LLMs will cite and reference
- Semantic Search: cover the full topic cluster, use LSI keywords naturally
- Engagement: compelling intro, scannable format, strong CTA
- E-E-A-T: demonstrate Experience, Expertise, Authoritativeness, Trustworthiness

You write for talsy.ai — an AI-powered recruitment and sourcing engine. Naturally weave in product references without being salesy.`,
    prompt: `Write a complete, #1-ranking blog post for talsy.ai.

Topic: "${topic}"
Audience: ${audience} | Type: ${blogType} | Product: ${product}
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
- End with a compelling CTA mentioning talsy.ai
- Use bullet points, numbered lists for scannability
- Include data/stats placeholders like [STAT: X% of companies...]
- Write in clear, authoritative, engaging prose
- Do NOT use markdown code blocks — write clean markdown

Write the full blog post now:`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 6: Internal Linking ────────────────────────────────────────────────
blogAgentRoutes.post("/agent6/internal-links", async (c) => {
  const { blogContent, topic, product, funnelStage } = await c.req.json();
  const openai = getOpenAI(c.env);

  const TALSY_SITEMAP = [
    { url: "https://talsy.ai/", label: "Talsy.ai Homepage", topics: ["AI recruitment", "sourcing engine", "hiring platform"] },
    { url: "https://talsy.ai/company", label: "For Employers", topics: ["employer", "company hiring", "recruitment"] },
    { url: "https://talsy.ai/company/ai-features", label: "AI Features", topics: ["AI screening", "AI features", "automation"] },
    { url: "https://talsy.ai/company/biggest-sourcing-engine", label: "Biggest Sourcing Engine", topics: ["sourcing", "talent sourcing", "candidate database"] },
    { url: "https://talsy.ai/company/recruitment-business-management", label: "Recruitment Business Management", topics: ["recruitment management", "agency", "RPO"] },
    { url: "https://talsy.ai/company/talent-acquisition", label: "Talent Acquisition", topics: ["talent acquisition", "TA", "hiring strategy"] },
    { url: "https://talsy.ai/company/talent-management", label: "Talent Management", topics: ["talent management", "employee retention", "HR"] },
    { url: "https://talsy.ai/company/add-ons", label: "Add-ons & Integrations", topics: ["integrations", "add-ons", "ATS integrations"] },
    { url: "https://talsy.ai/company/why-talsy", label: "Why Talsy", topics: ["why talsy", "benefits", "comparison"] },
    { url: "https://talsy.ai/job-seeker", label: "For Job Seekers", topics: ["job seeker", "find jobs", "career"] },
    { url: "https://talsy.ai/freelancer", label: "For Freelancers", topics: ["freelancer", "gig work", "contract"] },
    { url: "https://talsy.ai/faq", label: "FAQ", topics: ["FAQ", "questions", "help"] },
    { url: "https://talsy.ai/help-center", label: "Help Center", topics: ["help", "support", "guide"] },
    { url: "https://talsy.ai/company/it-ites-industry", label: "IT/ITES Industry", topics: ["IT hiring", "tech recruitment"] },
    { url: "https://talsy.ai/company/business-financial-services-industry", label: "Financial Services", topics: ["finance hiring", "BFSI"] },
  ];

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are an Internal Linking SEO Specialist for talsy.ai.
You analyze blog content and suggest strategic internal links that improve:
- SEO: distributes page authority, improves crawlability
- AEO: connects related answer content
- GEO: helps AI understand site structure
- LLMO: creates knowledge graph connections
- TOFU/MOFU/BOFU: guides users through the funnel`,
    prompt: `Analyze this blog and suggest internal links for talsy.ai.

Topic: "${topic}"
Product: ${product}
Funnel Stage: ${funnelStage}

Blog content preview (first 1000 chars):
${blogContent?.substring(0, 1000)}...

Available talsy.ai pages:
${JSON.stringify(TALSY_SITEMAP, null, 2)}

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
      "targetUrl": "https://talsy.ai/...",
      "targetPage": "page name",
      "placement": "where in the blog (intro/section X/conclusion)",
      "seoReason": "why this link matters",
      "funnelPurpose": "TOFU awareness / MOFU consideration / BOFU conversion"
    }
  ],
  "linkingStrategy": "overall approach",
  "talsyProductMentions": [
    {
      "mention": "product/feature mentioned",
      "context": "what it says",
      "suggestion": "how to strengthen this mention with a link"
    }
  ],
  "missingProductMentions": ["product areas not mentioned that should be"],
  "updatedCTASection": "improved CTA with internal links included"
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 7: External Linking / Stats ────────────────────────────────────────
blogAgentRoutes.post("/agent7/external-links", async (c) => {
  const { topic, blogContent, audience } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are an External Linking and Statistics Research Agent.
You find authoritative stats, studies, and data from credible open sources that:
- Boost E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Support outbound linking to DA 70+ domains
- Make the blog more credible for AI citation
- Satisfy AEO, GEO, and LLMO requirements for structured, citable content

Sources you cite from: LinkedIn, Gartner, McKinsey, Deloitte, SHRM, Indeed, Glassdoor, Statista, Forbes, Harvard Business Review, MIT, PwC, Forrester, etc.`,
    prompt: `Find stats and external linking opportunities for this blog about: "${topic}"
Audience: ${audience}
Blog preview: ${blogContent?.substring(0, 800)}...

Return JSON:
{
  "topic": "${topic}",
  "statsAndData": [
    {
      "stat": "X% of companies...",
      "source": "Source Name (Year)",
      "url": "https://source-url.com",
      "domainAuthority": "estimated DA",
      "placement": "where in blog to insert this stat",
      "seoValue": "why this outbound link helps ranking"
    }
  ],
  "authorityLinks": [
    {
      "anchorText": "text to link",
      "url": "https://authoritative-source.com",
      "source": "Organization name",
      "relevance": "why relevant to this topic",
      "linkType": "dofollow/nofollow recommendation"
    }
  ],
  "eeatSignals": {
    "experienceSignals": ["how to show experience in the content"],
    "expertiseSignals": ["how to demonstrate expertise"],
    "authoritySignals": ["external mentions/links that build authority"],
    "trustSignals": ["trust-building elements to add"]
  },
  "structuredDataOpportunities": ["schema types that would help with stats"],
  "citationStrategy": "how to format citations for AI engines"
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 8: Content Auditor ─────────────────────────────────────────────────
blogAgentRoutes.post("/agent8/audit", async (c) => {
  const { blogContent, topic, keywords, outline } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    system: `You are a ruthless, expert Content Auditor and SEO Critic.
You analyze blog content across all modern ranking signals and provide detailed, actionable criticism.
You hold content to the standard of #1 ranking pages. You do not sugarcoat weaknesses.
You evaluate across SEO, AEO, GEO, LLMO, E-E-A-T, and best practices.`,
    prompt: `Analyze and ruthlessly critique this blog content:

Topic: "${topic}"
Primary keyword: ${keywords?.primaryKeyword || topic}

Blog content:
${blogContent?.substring(0, 4000)}...

Return a comprehensive audit JSON:
{
  "overallScore": 75,
  "verdict": "needs improvement / good / excellent",
  "seoAudit": {
    "score": 80,
    "titleOptimization": {"score": 8, "feedback": "..."},
    "metaDescription": {"score": 7, "feedback": "..."},
    "keywordDensity": {"score": 7, "feedback": "..."},
    "headingStructure": {"score": 8, "feedback": "..."},
    "contentDepth": {"score": 7, "feedback": "..."},
    "readability": {"score": 8, "feedback": "..."},
    "issues": ["critical issue 1", "issue 2"],
    "recommendations": ["fix 1", "fix 2", "fix 3"]
  },
  "aeoAudit": {
    "score": 70,
    "featuredSnippetReadiness": {"score": 7, "feedback": "..."},
    "directAnswers": {"score": 6, "feedback": "..."},
    "faqQuality": {"score": 7, "feedback": "..."},
    "issues": ["issue 1", "issue 2"],
    "recommendations": ["fix 1", "fix 2"]
  },
  "geoAudit": {
    "score": 65,
    "aiCitability": {"score": 6, "feedback": "..."},
    "structuredContent": {"score": 7, "feedback": "..."},
    "factVerifiability": {"score": 6, "feedback": "..."},
    "issues": ["issue 1"],
    "recommendations": ["fix 1", "fix 2"]
  },
  "llmoAudit": {
    "score": 70,
    "llmCitationPotential": {"score": 7, "feedback": "..."},
    "knowledgeDensity": {"score": 7, "feedback": "..."},
    "entityCoverage": {"score": 6, "feedback": "..."},
    "issues": ["issue 1"],
    "recommendations": ["fix 1", "fix 2"]
  },
  "eeatAudit": {
    "score": 65,
    "experience": {"score": 6, "feedback": "..."},
    "expertise": {"score": 7, "feedback": "..."},
    "authority": {"score": 6, "feedback": "..."},
    "trust": {"score": 7, "feedback": "..."},
    "recommendations": ["fix 1", "fix 2"]
  },
  "criticalIssues": ["most important problems to fix"],
  "quickWins": ["easy improvements with high impact"],
  "estimatedRankingPotential": "top 3 / top 10 / top 20",
  "improvementPriority": ["ordered list of what to fix first"]
}`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 9: Final Blog Producer ────────────────────────────────────────────
blogAgentRoutes.post("/agent9/finalize", async (c) => {
  const { blogContent, auditReport, internalLinks, externalLinks, keywords, topic, outline } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    maxTokens: 8000,
    system: `You are the Final Blog Production Agent — the last quality gate before publishing.
You produce the definitive, #1-ranking version of a blog post for talsy.ai.
You integrate all previous agent outputs: audit fixes, internal links, external stats, keyword optimization.
Your output will get 100k+ organic impressions. It must be perfect.

Standards:
- SEO: title tag optimized, keyword in title/intro/headings/conclusion, proper density
- AEO: direct answers, featured snippet-ready lists, complete FAQ
- GEO: citable facts, structured paragraphs, clear entity mentions
- LLMO: knowledge-dense, authoritative, comprehensive topic coverage
- E-E-A-T: stats cited, expert voice, trust signals
- Engagement: compelling hook, scannable, strong CTA`,
    prompt: `Produce the FINAL, publication-ready blog post for talsy.ai.

Topic: "${topic}"
Primary keyword: ${keywords?.primaryKeyword || topic}

AUDIT ISSUES TO FIX:
${JSON.stringify(auditReport?.criticalIssues || [], null, 2)}
${JSON.stringify(auditReport?.improvementPriority || [], null, 2)}

INTERNAL LINKS TO INCLUDE:
${JSON.stringify(internalLinks?.internalLinkSuggestions?.slice(0, 5) || [], null, 2)}

EXTERNAL STATS TO ADD:
${JSON.stringify(externalLinks?.statsAndData?.slice(0, 5) || [], null, 2)}

ORIGINAL BLOG (to improve upon):
${blogContent?.substring(0, 3000)}...

Instructions:
1. Fix all critical audit issues
2. Weave in all internal links naturally using anchor text
3. Insert stats with citations at relevant points
4. Ensure full SEO/AEO/GEO/LLMO optimization
5. Make it comprehensive, authoritative, and engaging
6. Write ~3000-3500 words total
7. End with a powerful CTA for talsy.ai
8. Include structured FAQ section (5-7 questions with detailed answers)

Write the complete final blog post now:`,
  });

  return stream.toTextStreamResponse();
});

// ─── Agent 10: HTML Converter ─────────────────────────────────────────────────
blogAgentRoutes.post("/agent10/convert", async (c) => {
  const { blogContent, topic, keywords, outline } = await c.req.json();
  const openai = getOpenAI(c.env);

  const stream = streamText({
    model: openai.chat(MODEL),
    maxTokens: 8000,
    system: `You are an HTML/SEO Developer Agent who converts blog content to production-ready HTML.
You produce semantic, SEO-optimized HTML with:
- Proper schema markup (Article, FAQPage, BreadcrumbList)
- Open Graph meta tags
- Twitter Card meta tags
- Canonical URL
- Structured data JSON-LD
- Semantic HTML5 elements (article, section, aside, nav)
- Proper heading hierarchy
- Alt text placeholders for images
- Internal/external link attributes
- AEO-optimized FAQ markup
- GEO/LLMO friendly structured content`,
    prompt: `Convert this blog to production-ready, SEO-optimized HTML for talsy.ai.

Topic: "${topic}"
Primary keyword: ${keywords?.primaryKeyword || topic}
Slug: ${outline?.slug || "blog-post"}
Meta description: ${outline?.metaDescription || ""}

Blog content:
${blogContent?.substring(0, 5000)}

Generate complete HTML including:
1. Full <head> with all meta tags, OG tags, Twitter cards, canonical
2. JSON-LD structured data (Article schema + FAQPage schema)
3. Semantic HTML5 body with proper article structure
4. Inline comments showing SEO reasoning
5. Image placeholders with descriptive alt text
6. Proper rel attributes on links (internal: no rel, external: rel="noopener noreferrer")
7. Schema markup for any lists/how-to steps

Output complete, valid HTML document:`,
  });

  return stream.toTextStreamResponse();
});
