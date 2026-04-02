import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';

function KwBadge({ kw, color = 'blue' }: { kw: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full border font-500 mr-1.5 mb-1.5 ${colors[color]}`}>
      {kw}
    </span>
  );
}

export function Agent3() {
  const store = useBlogStore();
  const state = store.agents[3];
  const parsed = state?.parsedData;

  const run = () => {
    store.setCurrentAgent(3);
    store.setAgentStatus(3, 'running');
    store.setAgentOutput(3, '');

    streamAgentAPI(
      '/agent3/extract',
      { topic: store.topic, competitorData: store.competitorData, audience: store.targetAudience, blogType: store.blogType },
      (text) => store.setAgentOutput(3, text),
      (full) => {
        const p = tryParseJSON(full);
        store.setAgentParsed(3, p);
        if (p) store.setKeywordData(p);
        store.setAgentStatus(3, 'done');
      },
      (err) => { store.setAgentStatus(3, 'error'); store.setAgentOutput(3, `Error: ${err}`); }
    );
  };

  return (
    <div className="p-8 max-w-4xl">
      <AgentHeader
        agentNum={3}
        name="Keyword Extraction Agent"
        description="Extracts primary, secondary, long-tail, LSI, voice search, AEO, GEO, and LLMO keywords from competitor insights."
        icon="🔑"
        status={state?.status || 'idle'}
        tags={['SEO', 'AEO', 'GEO', 'LLMO', 'Voice Search']}
      />

      {state?.status === 'idle' && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">Extract comprehensive keywords across all search paradigms.</p>
          <Button onClick={run} className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6">
            Extract Keywords →
          </Button>
        </Card>
      )}

      {state?.status === 'running' && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-sm font-600 text-blue-700">Extracting keywords...</span>
          </div>
          <ScrollArea className="max-h-64">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{state.output}</pre>
          </ScrollArea>
        </Card>
      )}

      {parsed && (
        <div className="space-y-5">
          {/* Primary Keyword */}
          <Card className="p-5 border-blue-200 bg-blue-50">
            <p className="text-xs text-blue-500 font-600 uppercase tracking-wider mb-1">Primary Keyword</p>
            <p className="text-2xl font-800 font-display text-blue-800">{parsed.primaryKeyword}</p>
            <p className="text-xs text-blue-600 mt-1">Target density: {parsed.keywordDensityTargets?.primaryKeyword}</p>
          </Card>

          {/* Keyword Groups */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-4">
              <h4 className="text-sm font-700 font-display text-gray-800 mb-2">Secondary Keywords</h4>
              <div>{parsed.secondaryKeywords?.map((k: string) => <KwBadge key={k} kw={k} color="blue" />)}</div>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-700 font-display text-gray-800 mb-2">Long-Tail Keywords</h4>
              <div>{parsed.longTailKeywords?.map((k: string) => <KwBadge key={k} kw={k} color="purple" />)}</div>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-700 font-display text-gray-800 mb-2">LSI / Semantic Keywords</h4>
              <div>{parsed.lsiKeywords?.map((k: string) => <KwBadge key={k} kw={k} color="green" />)}</div>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-700 font-display text-gray-800 mb-2">Question Keywords</h4>
              <div>{parsed.questionKeywords?.map((k: string) => <KwBadge key={k} kw={k} color="orange" />)}</div>
            </Card>
          </div>

          {/* AEO / GEO / LLMO */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-xs font-600 text-orange-600 mb-2 uppercase">AEO Keywords</p>
              <div>{parsed.aeoKeywords?.map((k: string) => <KwBadge key={k} kw={k} color="orange" />)}</div>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-600 text-pink-600 mb-2 uppercase">Voice Search</p>
              <div>{parsed.voiceSearchKeywords?.map((k: string) => <KwBadge key={k} kw={k} color="pink" />)}</div>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-600 text-purple-600 mb-2 uppercase">LLMO Keywords</p>
              <div>{parsed.llmoKeywords?.map((k: string) => <KwBadge key={k} kw={k} color="purple" />)}</div>
            </Card>
          </div>

          {/* Intent Mapping */}
          <Card className="p-4">
            <h4 className="text-sm font-700 font-display text-gray-800 mb-3">Search Intent Mapping</h4>
            <div className="grid grid-cols-3 gap-3">
              {['informational', 'commercial', 'transactional'].map(intent => (
                <div key={intent}>
                  <p className="text-xs font-600 text-gray-500 capitalize mb-1">{intent}</p>
                  {parsed.intentMapping?.[intent]?.map((k: string) => (
                    <p key={k} className="text-xs text-gray-700">• {k}</p>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">✓ Keywords extracted — ready for outline</p>
            <Button onClick={() => store.setCurrentAgent(4)} className="bg-blue-600 hover:bg-blue-700 text-white font-600">
              Next: SEO Outline →
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
