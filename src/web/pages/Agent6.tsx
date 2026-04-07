import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { saveAgentOutput } from '../hooks/useSessionCache';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { AgentRunningCard } from '../components/AgentRunningCard';

export function Agent6() {
  const store = useBlogStore();
  const state = store.agents[6];
  const parsed = state?.parsedData;

  const run = () => {
    const sid = store.sessionId;
    store.setCurrentAgent(6);
    store.setAgentStatus(6, 'running');
    store.setAgentOutput(6, '');

    streamAgentAPI(
      '/agent6/internal-links',
      { blogContent: store.blogDraft, topic: store.topic, product: store.product, funnelStage: store.funnelStage, productContext: store.productContext },
      (text) => store.setAgentOutput(6, text),
      (full) => {
        const p = tryParseJSON(full);
        store.setAgentParsed(6, p);
        if (p) store.setInternalLinksData(p);
        store.setAgentStatus(6, 'done');
        if (sid) saveAgentOutput(sid, 6, full, p);
      },
      (err) => { store.setAgentStatus(6, 'error'); store.setAgentOutput(6, `Error: ${err}`); }
    );
  };

  const funnelColors: Record<string, string> = {
    TOFU: 'bg-blue-50 text-blue-700 border-blue-200',
    MOFU: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    BOFU: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className="p-8 max-w-4xl">
      <AgentHeader
        agentNum={6}
        name="Internal Linking Agent"
        description="Maps blog content to talsy.ai's sitemap, assigns TOFU/MOFU/BOFU funnel stages, and suggests strategic internal links for SEO/AEO/GEO/LLMO."
        icon="🔗"
        status={state?.status || 'idle'}
        tags={['TOFU', 'MOFU', 'BOFU', 'Internal Links', 'Funnel']}
      />

      {/* Sitemap reference */}
      <Card className="p-4 mb-5 bg-gray-50 border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-sm font-600 text-gray-700">Sitemap:</span>
          <a href="https://talsy.ai/sitemap.xml" target="_blank" rel="noopener noreferrer"
             className="text-sm text-blue-600 hover:underline">talsy.ai/sitemap.xml</a>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">15 pages indexed</span>
        </div>
      </Card>

      {state?.status === 'idle' && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">Analyze the blog and map internal linking opportunities across the talsy.ai site.</p>
          <Button onClick={run} className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6">
            Analyze Internal Links →
          </Button>
        </Card>
      )}

      {state?.status === 'running' && (
        <AgentRunningCard
          label="Mapping internal link strategy…"
          accent="emerald"
          outputLength={state.output?.length || 0}
          steps={[
            'Analysing funnel stage & content type',
            'Identifying TOFU supporting content',
            'Finding MOFU comparison pages',
            'Mapping BOFU conversion pages',
            'Generating anchor text suggestions',
            'Prioritising link placement positions',
          ]}
        />
      )}

      {parsed && (
        <div className="space-y-4">
          {/* Funnel Stage */}
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-xl border font-700 font-display text-lg ${funnelColors[parsed.funnelStageAnalysis?.stage] || 'bg-gray-100 text-gray-700'}`}>
                {parsed.funnelStageAnalysis?.stage}
              </div>
              <div>
                <p className="font-600 text-gray-800">{parsed.funnelStageAnalysis?.contentIntent}</p>
                <p className="text-sm text-gray-500">{parsed.funnelStageAnalysis?.reasoning}</p>
              </div>
            </div>
          </Card>

          {/* Internal Links */}
          <div>
            <h3 className="font-700 font-display text-gray-900 mb-3">Internal Link Suggestions</h3>
            <div className="space-y-3">
              {parsed.internalLinkSuggestions?.map((link: any, i: number) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">"{link.anchorText}"</code>
                    <span className={`text-xs px-2 py-0.5 rounded font-500 border ${funnelColors[link.funnelPurpose?.split(' ')[0]] || 'bg-gray-100 text-gray-600'}`}>
                      {link.funnelPurpose?.split(' ')[0]}
                    </span>
                  </div>
                  <a href={link.targetUrl} target="_blank" rel="noopener noreferrer"
                     className="text-sm text-blue-600 hover:underline block mb-1">{link.targetUrl}</a>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <p className="text-xs text-gray-600"><span className="text-gray-400">Placement:</span> {link.placement}</p>
                    <p className="text-xs text-gray-600"><span className="text-gray-400">SEO reason:</span> {link.seoReason}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Product Mentions */}
          {parsed.talsyProductMentions?.length > 0 && (
            <Card className="p-4">
              <h4 className="font-600 font-display text-gray-800 mb-2">Product Mentions in Blog</h4>
              <div className="space-y-2">
                {parsed.talsyProductMentions?.map((m: any, i: number) => (
                  <div key={i} className="text-sm">
                    <span className="font-600 text-blue-700">{m.mention}</span>
                    <span className="text-gray-500 mx-2">→</span>
                    <span className="text-gray-700">{m.suggestion}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Missing mentions */}
          {parsed.missingProductMentions?.length > 0 && (
            <Card className="p-4 bg-yellow-50 border-yellow-100">
              <h4 className="font-600 text-yellow-800 mb-2 text-sm">Missing Product Coverage</h4>
              <div className="flex flex-wrap gap-2">
                {parsed.missingProductMentions?.map((m: string, i: number) => (
                  <span key={i} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{m}</span>
                ))}
              </div>
            </Card>
          )}

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">✓ Internal links mapped</p>
            <Button onClick={() => store.setCurrentAgent(7)} className="bg-blue-600 hover:bg-blue-700 text-white font-600">
              Next: External Links →
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
