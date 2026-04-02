import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';

export function Agent2() {
  const store = useBlogStore();
  const state = store.agents[2];
  const parsed = state?.parsedData;

  const run = () => {
    store.setCurrentAgent(2);
    store.setAgentStatus(2, 'running');
    store.setAgentOutput(2, '');

    streamAgentAPI(
      '/agent2/analyze',
      { topic: store.topic, audience: store.targetAudience, blogType: store.blogType },
      (text) => store.setAgentOutput(2, text),
      (full) => {
        const p = tryParseJSON(full);
        store.setAgentParsed(2, p);
        if (p) store.setCompetitorData(p);
        store.setAgentStatus(2, 'done');
      },
      (err) => { store.setAgentStatus(2, 'error'); store.setAgentOutput(2, `Error: ${err}`); }
    );
  };

  return (
    <div className="p-8 max-w-4xl">
      <AgentHeader
        agentNum={2}
        name="Competitor Analysis Agent"
        description="Deep-searches Google, ChatGPT, Grok, Perplexity, Gemini & Claude to analyze top-ranking content, find gaps, and identify what it takes to rank #1."
        icon="🔍"
        status={state?.status || 'idle'}
        tags={['Google', 'ChatGPT', 'Grok', 'Perplexity', 'Gemini', 'Claude']}
      />

      {/* Context from Agent 1 */}
      {store.topic && (
        <Card className="p-4 mb-5 bg-gray-50 border-gray-200">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Topic: <strong className="text-gray-800">{store.topic}</strong></span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">Type: <strong className="text-gray-800">{store.blogType || '—'}</strong></span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">Audience: <strong className="text-gray-800">{store.targetAudience || '—'}</strong></span>
          </div>
        </Card>
      )}

      {state?.status === 'idle' && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">Simulate deep competitor research across all major search engines and AI tools.</p>
          <Button onClick={run} className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6">
            Run Competitor Analysis →
          </Button>
        </Card>
      )}

      {state?.status === 'running' && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-sm font-600 text-blue-700">Searching across 6 platforms...</span>
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            {['Google', 'ChatGPT', 'Grok', 'Perplexity', 'Gemini', 'Claude'].map(e => (
              <span key={e} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded animate-pulse">{e}</span>
            ))}
          </div>
          <ScrollArea className="max-h-64">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">{state.output}</pre>
          </ScrollArea>
        </Card>
      )}

      {parsed && (
        <div className="space-y-4">
          {/* Platforms Analyzed */}
          <div className="flex gap-2">
            {parsed.searchEnginesAnalyzed?.map((e: string) => (
              <span key={e} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-500">✓ {e}</span>
            ))}
          </div>

          {/* Top Competitors */}
          <div className="space-y-3">
            <h3 className="font-700 font-display text-gray-900">Top Competitors</h3>
            {parsed.topCompetitors?.map((c: any, i: number) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-600 mr-2">#{c.rank}</span>
                    <span className="font-600 text-gray-800">{c.domain}</span>
                    <span className="text-xs text-gray-500 ml-2">~{c.estimatedWordCount?.toLocaleString()} words</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-500 ${
                    c.seoScore === 'high' ? 'bg-red-100 text-red-600' :
                    c.seoScore === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                  }`}>{c.seoScore} competition</span>
                </div>
                <p className="text-sm text-gray-700 font-500 mb-2">"{c.title}"</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-600 font-600 mb-1">✓ Strengths</p>
                    {c.strengths?.map((s: string, j: number) => (
                      <p key={j} className="text-xs text-gray-600">• {s}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-red-500 font-600 mb-1">✗ Weaknesses</p>
                    {c.weaknesses?.map((w: string, j: number) => (
                      <p key={j} className="text-xs text-gray-600">• {w}</p>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Gaps & Strategy */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-600 font-display text-gray-900 mb-2 text-sm">Content Gaps to Fill</h4>
              {parsed.contentGaps?.map((g: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700 mb-1">
                  <span className="text-blue-500 mt-0.5">🎯</span> {g}
                </div>
              ))}
            </Card>
            <Card className="p-4">
              <h4 className="font-600 font-display text-gray-900 mb-2 text-sm">People Also Ask</h4>
              {parsed.peopleAlsoAsk?.map((q: string, i: number) => (
                <div key={i} className="text-xs text-gray-700 mb-1 flex gap-1">
                  <span className="text-gray-400">Q:</span> {q}
                </div>
              ))}
            </Card>
          </div>

          {/* Winning Strategy */}
          <Card className="p-4 bg-blue-50 border-blue-100">
            <h4 className="font-600 font-display text-blue-900 mb-2">Winning Strategy</h4>
            <p className="text-sm text-blue-800">{parsed.winningStrategy}</p>
          </Card>

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">✓ Competitor analysis complete</p>
            <Button onClick={() => store.setCurrentAgent(3)} className="bg-blue-600 hover:bg-blue-700 text-white font-600">
              Next: Keyword Extraction →
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
