import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';

export function Agent4() {
  const store = useBlogStore();
  const state = store.agents[4];
  const parsed = state?.parsedData;

  const run = () => {
    store.setCurrentAgent(4);
    store.setAgentStatus(4, 'running');
    store.setAgentOutput(4, '');

    streamAgentAPI(
      '/agent4/outline',
      { topic: store.topic, keywords: store.keywordData, competitorData: store.competitorData, audience: store.targetAudience, blogType: store.blogType },
      (text) => store.setAgentOutput(4, text),
      (full) => {
        const p = tryParseJSON(full);
        store.setAgentParsed(4, p);
        if (p) store.setOutlineData(p);
        store.setAgentStatus(4, 'done');
      },
      (err) => { store.setAgentStatus(4, 'error'); store.setAgentOutput(4, `Error: ${err}`); }
    );
  };

  return (
    <div className="p-8 max-w-4xl">
      <AgentHeader
        agentNum={4}
        name="SEO Research & Outline Agent"
        description="Simulates GSC + Keyword Planner data, extracts top queries and PAA questions, builds a complete SEO/AEO/GEO/LLMO-optimized blog outline."
        icon="📋"
        status={state?.status || 'idle'}
        tags={['GSC Simulation', 'PAA Questions', 'Featured Snippets', 'Schema Markup']}
      />

      {state?.status === 'idle' && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">Generate a comprehensive, search-optimized blog outline with structured data recommendations.</p>
          <Button onClick={run} className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6">
            Generate Outline →
          </Button>
        </Card>
      )}

      {state?.status === 'running' && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-sm font-600 text-blue-700">Building SEO outline...</span>
          </div>
          <ScrollArea className="max-h-64">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{state.output}</pre>
          </ScrollArea>
        </Card>
      )}

      {parsed && (
        <div className="space-y-4">
          {/* Title & Meta */}
          <Card className="p-5">
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">SEO Title ({parsed.title?.length} chars)</p>
              <p className="text-lg font-700 font-display text-gray-900">{parsed.title}</p>
            </div>
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Meta Description ({parsed.metaDescription?.length} chars)</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{parsed.metaDescription}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-gray-500">Slug: <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-700">/blog/{parsed.slug}</code></span>
              <span className="text-gray-500">~{parsed.estimatedWordCount?.toLocaleString()} words</span>
              <span className="text-gray-500">{parsed.targetReadingTime}</span>
            </div>
          </Card>

          {/* Top Queries + PAA */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="text-sm font-700 font-display text-gray-800 mb-2">Top Ranking Queries</h4>
              {parsed.topRankingQueries?.map((q: string, i: number) => (
                <p key={i} className="text-xs text-gray-700 py-1 border-b border-gray-100 last:border-0">🔍 {q}</p>
              ))}
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-700 font-display text-gray-800 mb-2">People Also Ask</h4>
              {parsed.topPAA?.map((q: string, i: number) => (
                <p key={i} className="text-xs text-gray-700 py-1 border-b border-gray-100 last:border-0">❓ {q}</p>
              ))}
            </Card>
          </div>

          {/* Blog Outline */}
          <Card className="p-5">
            <h3 className="font-700 font-display text-gray-900 mb-4">Blog Outline</h3>
            <div className="space-y-3">
              {parsed.outline?.map((section: any, i: number) => (
                <div key={i} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-500 mr-2">
                        {section.type === 'intro' ? 'INTRO' : `H2`}
                      </span>
                      <span className="font-600 text-gray-800">{section.heading}</span>
                      <span className="text-xs text-gray-400 ml-2">~{section.wordCount}w</span>
                    </div>
                    {section.contentType && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{section.contentType}</span>
                    )}
                  </div>
                  {section.subheadings?.length > 0 && (
                    <div className="mt-2 ml-4 space-y-1">
                      {section.subheadings.map((sub: any, j: number) => (
                        <p key={j} className="text-xs text-gray-600">
                          <span className="text-gray-400 mr-1">H3:</span>{sub.h3}
                          {sub.notes && <span className="text-gray-400 ml-1">— {sub.notes}</span>}
                        </p>
                      ))}
                    </div>
                  )}
                  {section.seoNotes && (
                    <p className="text-xs text-blue-600 mt-1">💡 {section.seoNotes}</p>
                  )}
                  {section.aeoNotes && (
                    <p className="text-xs text-orange-600 mt-0.5">🎯 {section.aeoNotes}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Schema + FAQ */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="text-sm font-700 text-gray-800 mb-2">Recommended Schema</h4>
              <div className="flex flex-wrap gap-1.5">
                {parsed.schemaMarkupRecommended?.map((s: string) => (
                  <span key={s} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-500">{s}</span>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-700 text-gray-800 mb-2">Content Differentiators</h4>
              {parsed.contentDifferentiators?.map((d: string, i: number) => (
                <p key={i} className="text-xs text-gray-700">⭐ {d}</p>
              ))}
            </Card>
          </div>

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">✓ Outline ready — time to write</p>
            <Button onClick={() => store.setCurrentAgent(5)} className="bg-blue-600 hover:bg-blue-700 text-white font-600">
              Next: Write Blog →
            </Button>
          </div>
        </div>
      )}

      {state?.status === 'error' && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700 text-sm">{state.output}</p>
          <Button onClick={run} className="mt-3 bg-red-600 text-white">Retry</Button>
        </Card>
      )}
    </div>
  );
}
