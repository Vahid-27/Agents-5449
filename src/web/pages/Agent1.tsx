import { useState } from 'react';
import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { AgentRunningCard } from '../components/AgentRunningCard';
import { createSession, saveAgentOutput } from '../hooks/useSessionCache';

export function Agent1() {
  const store = useBlogStore();
  const state = store.agents[1];
  const [topicInput, setTopicInput] = useState(store.topic || '');

  const ctx = store.productContext;

  const run = async () => {
    if (!topicInput.trim()) return;

    // Guard: must have product context
    if (!ctx) {
      store.setCurrentAgent(0);
      return;
    }

    store.setTopic(topicInput);
    store.setProduct(ctx.name);
    store.setCurrentAgent(1);
    store.setAgentStatus(1, 'running');
    store.setAgentOutput(1, '');

    // Create or reuse session
    let sid = store.sessionId;
    if (!sid) {
      sid = await createSession(topicInput, ctx.name);
      if (sid) store.setSessionId(sid);
    }

    streamAgentAPI(
      '/agent1/analyze',
      { topic: topicInput, productContext: ctx },
      (text) => store.setAgentOutput(1, text),
      async (full) => {
        const parsed = tryParseJSON(full);
        store.setAgentParsed(1, parsed);
        if (parsed) store.setIntakeData(parsed);
        store.setAgentStatus(1, 'done');
        if (sid) await saveAgentOutput(sid, 1, full, parsed, {
          blogType: parsed?.blogType,
          targetAudience: parsed?.targetAudience?.primary,
          funnelStage: parsed?.funnelStage,
        });
      },
      (err) => { store.setAgentStatus(1, 'error'); store.setAgentOutput(1, `Error: ${err}`); }
    );
  };

  const parsed = state?.parsedData;

  return (
    <div className="p-8 max-w-4xl">
      <AgentHeader
        agentNum={1}
        name="Topic Intake Agent"
        description="Analyzes your blog topic in context of the product, determines B2B/B2C positioning, identifies target audience, and maps the content angle."
        icon="🎯"
        status={state?.status || 'idle'}
        tags={['Topic Analysis', 'B2B/B2C Detection', 'Audience Mapping', 'Content Angle']}
      />

      {/* No product context warning */}
      {!ctx && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-600 text-amber-800">Product not analyzed yet</p>
            <p className="text-xs text-amber-700 mt-0.5">Run the Product Intelligence Agent first so this agent knows what product to write for.</p>
            <Button
              size="sm"
              className="mt-2 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => store.setCurrentAgent(0)}
            >
              Go to Product Intelligence →
            </Button>
          </div>
        </div>
      )}

      {/* Product context badge */}
      {ctx && (
        <div className="mb-5 flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-700 flex-shrink-0">
            {ctx.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-600 text-gray-900">{ctx.name}</p>
            <p className="text-xs text-gray-500 truncate">{ctx.tagline || ctx.description?.slice(0, 80)}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-600 flex-shrink-0 ${
            ctx.businessModel === 'B2B' ? 'bg-orange-100 text-orange-700' :
            ctx.businessModel === 'B2C' ? 'bg-green-100 text-green-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {ctx.businessModel}
          </span>
        </div>
      )}

      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-600 text-gray-700 mb-2">Blog Topic</label>
            <Input
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              placeholder={ctx ? `e.g. How ${ctx.name} helps with ${ctx.coreFeatures?.[0] || 'hiring'}` : 'Enter your blog topic...'}
              className="text-base"
              onKeyDown={e => e.key === 'Enter' && run()}
              disabled={!ctx}
            />
          </div>

          {/* Content angle suggestions from productContext */}
          {ctx?.contentAngles && ctx.contentAngles.length > 0 && (
            <div>
              <p className="text-xs font-600 text-gray-500 mb-2">Suggested angles for {ctx.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {ctx.contentAngles.slice(0, 5).map((angle: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setTopicInput(angle)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    {angle}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={run}
            disabled={state?.status === 'running' || !topicInput.trim() || !ctx}
            className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6"
          >
            {state?.status === 'running' ? 'Analyzing...' : 'Analyze Topic →'}
          </Button>
        </div>
      </Card>

      {parsed && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs text-blue-500 font-600 uppercase tracking-wider mb-1">Blog Type</p>
              <p className="text-2xl font-800 font-display text-blue-700">{parsed.blogType}</p>
              <p className="text-xs text-blue-600 mt-1">{parsed.reasoning?.slice(0, 60)}...</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-xs text-purple-500 font-600 uppercase tracking-wider mb-1">Funnel Stage</p>
              <p className="text-2xl font-800 font-display text-purple-700">{parsed.funnelStage}</p>
              <p className="text-xs text-purple-600 mt-1">{parsed.contentGoal}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs text-green-500 font-600 uppercase tracking-wider mb-1">Competitiveness</p>
              <p className="text-2xl font-800 font-display text-green-700 capitalize">{parsed.competitiveness}</p>
              <p className="text-xs text-green-600 mt-1">Search Vol: {parsed.estimatedSearchVolume}</p>
            </div>
          </div>

          <Card className="p-5">
            <h3 className="font-700 font-display text-gray-900 mb-3">Target Audience</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Primary</p>
                <p className="font-600 text-gray-800 text-sm">{parsed.targetAudience?.primary}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Secondary</p>
                <p className="font-600 text-gray-800 text-sm">{parsed.targetAudience?.secondary}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Pain Points</p>
              <div className="space-y-1">
                {parsed.targetAudience?.painPoints?.map((p: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-0.5">•</span> {p}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {parsed.productAngle && (
            <Card className="p-5 border-blue-100 bg-blue-50">
              <p className="text-xs font-600 text-blue-500 uppercase tracking-wider mb-1">{ctx?.name || 'Product'} Angle</p>
              <p className="text-gray-800 font-500 text-sm">{parsed.productAngle}</p>
            </Card>
          )}

          {parsed.uniqueContentHook && (
            <Card className="p-4 border-green-100 bg-green-50">
              <p className="text-xs font-600 text-green-600 uppercase tracking-wider mb-1">Unique Content Hook</p>
              <p className="text-gray-800 text-sm">{parsed.uniqueContentHook}</p>
            </Card>
          )}

          {store.sessionId && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Saved · Session <code className="font-mono">{store.sessionId.slice(0, 8)}…</code>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">✓ Intake complete</p>
            <Button onClick={() => store.setCurrentAgent(2)} className="bg-blue-600 hover:bg-blue-700 text-white font-600">
              Next: Competitor Analysis →
            </Button>
          </div>
        </div>
      )}

      {state?.status === 'running' && !parsed && (
        <AgentRunningCard
          label={`Analyzing topic for ${ctx?.name || 'product'}…`}
          accent="blue"
          outputLength={state.output?.length || 0}
          steps={[
            'Reading product context & USP',
            'Determining B2B/B2C classification',
            'Identifying target audience & pain points',
            'Mapping funnel stage & search intent',
            'Defining content goal & product angle',
            'Finalising topic strategy',
          ]}
        />
      )}

      {state?.status === 'error' && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700 text-sm">{state.output}</p>
          <Button onClick={run} className="mt-3 bg-red-600 text-white text-sm">Retry</Button>
        </Card>
      )}
    </div>
  );
}
