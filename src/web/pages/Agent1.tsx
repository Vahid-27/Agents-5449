import { useState } from 'react';
import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';

const PRODUCTS = [
  'talsy.ai (General)',
  'Free ATS',
  'AI Technical Screening',
  'Internal Recruitment',
  'Vendor Management',
  'Talent Acquisition',
  'Job Seeker Platform',
  'Freelancer Marketplace',
];

export function Agent1() {
  const store = useBlogStore();
  const state = store.agents[1];
  const [topicInput, setTopicInput] = useState(store.topic || '');
  const [selectedProduct, setSelectedProduct] = useState(store.product || 'talsy.ai (General)');

  const run = () => {
    if (!topicInput.trim()) return;
    store.setTopic(topicInput);
    store.setProduct(selectedProduct);
    store.setCurrentAgent(1);
    store.setAgentStatus(1, 'running');
    store.setAgentOutput(1, '');

    streamAgentAPI(
      '/agent1/analyze',
      { topic: topicInput, product: selectedProduct },
      (text) => store.setAgentOutput(1, text),
      (full) => {
        const parsed = tryParseJSON(full);
        store.setAgentParsed(1, parsed);
        if (parsed) store.setIntakeData(parsed);
        store.setAgentStatus(1, 'done');
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
        description="Analyzes your blog topic, determines B2B/B2C type, identifies target audience, and maps to talsy.ai products."
        icon="🎯"
        status={state?.status || 'idle'}
        tags={['Topic Analysis', 'B2B/B2C Detection', 'Audience Mapping']}
      />

      {/* Input Form */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-600 text-gray-700 mb-2">Blog Topic</label>
            <Input
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              placeholder="e.g. How AI is transforming technical hiring in 2025"
              className="text-base"
              onKeyDown={e => e.key === 'Enter' && run()}
            />
          </div>
          <div>
            <label className="block text-sm font-600 text-gray-700 mb-2">Product / Feature Focus</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRODUCTS.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedProduct(p)}
                  className={`text-xs px-3 py-2 rounded-lg border text-left transition-all ${
                    selectedProduct === p
                      ? 'bg-blue-600 text-white border-blue-600 font-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={run}
            disabled={state?.status === 'running' || !topicInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6"
          >
            {state?.status === 'running' ? 'Analyzing...' : 'Analyze Topic →'}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {parsed && (
        <div className="space-y-4">
          {/* Summary Cards */}
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

          {/* Audience */}
          <Card className="p-5">
            <h3 className="font-700 font-display text-gray-900 mb-3">Target Audience</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Primary</p>
                <p className="font-600 text-gray-800">{parsed.targetAudience?.primary}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Secondary</p>
                <p className="font-600 text-gray-800">{parsed.targetAudience?.secondary}</p>
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

          {/* Talsy Angle */}
          <Card className="p-5 border-blue-100 bg-blue-50">
            <p className="text-xs font-600 text-blue-500 uppercase tracking-wider mb-1">Talsy.ai Angle</p>
            <p className="text-gray-800 font-500">{parsed.talsyAngle}</p>
          </Card>

          {/* Next Agent Button */}
          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">✓ Intake complete — ready for competitor analysis</p>
            <Button
              onClick={() => store.setCurrentAgent(2)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-600"
            >
              Next: Competitor Analysis →
            </Button>
          </div>
        </div>
      )}

      {/* Raw streaming output when no parsed yet */}
      {state?.status === 'running' && !parsed && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-sm font-600 text-blue-700">Analyzing topic...</span>
          </div>
          <ScrollArea className="max-h-64">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
              {state.output}
            </pre>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
