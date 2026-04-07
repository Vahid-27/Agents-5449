import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { saveAgentOutput } from '../hooks/useSessionCache';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { AgentRunningCard } from '../components/AgentRunningCard';

export function Agent7() {
  const store = useBlogStore();
  const state = store.agents[7];
  const parsed = state?.parsedData;

  const run = () => {
    const sid = store.sessionId;
    store.setCurrentAgent(7);
    store.setAgentStatus(7, 'running');
    store.setAgentOutput(7, '');

    streamAgentAPI(
      '/agent7/external-links',
      { topic: store.topic, blogContent: store.blogDraft, audience: store.targetAudience, keywords: store.keywordData, productContext: store.productContext },
      (text) => store.setAgentOutput(7, text),
      (full) => {
        const p = tryParseJSON(full);
        store.setAgentParsed(7, p);
        if (p) store.setExternalLinksData(p);
        store.setAgentStatus(7, 'done');
        if (sid) saveAgentOutput(sid, 7, full, p);
      },
      (err) => { store.setAgentStatus(7, 'error'); store.setAgentOutput(7, `Error: ${err}`); }
    );
  };

  return (
    <div className="p-8 max-w-4xl">
      <AgentHeader
        agentNum={7}
        name="External Linking & Stats Agent"
        description="Finds authoritative statistics, studies, and credible outbound linking opportunities from DA 70+ sources to boost E-E-A-T and rankings."
        icon="📊"
        status={state?.status || 'idle'}
        tags={['E-E-A-T', 'Outbound Links', 'Stats & Data', 'Authority']}
      />

      {state?.status === 'idle' && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-2">Find stats from Gartner, McKinsey, LinkedIn, Statista, SHRM, and more.</p>
          <p className="text-sm text-gray-400 mb-4">Outbound links to DA 70+ sources signal authority to all search engines.</p>
          <Button onClick={run} className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6">
            Find Stats & Links →
          </Button>
        </Card>
      )}

      {state?.status === 'running' && (
        <AgentRunningCard
          label="Researching external stats & authority sources…"
          accent="emerald"
          outputLength={state.output?.length || 0}
          steps={[
            'Identifying citation-worthy statistics',
            'Finding industry reports & studies',
            'Sourcing authority site backlink targets',
            'Validating data credibility & recency',
            'Mapping stats to content sections',
            'Generating citation-ready references',
          ]}
        />
      )}

      {parsed && (
        <div className="space-y-4">
          {/* Stats */}
          <div>
            <h3 className="font-700 font-display text-gray-900 mb-3">Stats & Data to Include</h3>
            <div className="space-y-3">
              {parsed.statsAndData?.map((stat: any, i: number) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl font-800 font-display text-blue-600 shrink-0">#{i + 1}</span>
                    <div>
                      <p className="font-600 text-gray-800 mb-1 text-sm">{stat.stat}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <a href={stat.url} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-blue-600 hover:underline">{stat.source}</a>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">DA: {stat.domainAuthority}</span>
                        <span className="text-xs text-gray-500">→ {stat.placement}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">SEO: {stat.seoValue}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Authority Links */}
          <div>
            <h3 className="font-700 font-display text-gray-900 mb-3">Authority Outbound Links</h3>
            <div className="space-y-2">
              {parsed.authorityLinks?.map((link: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-500">{link.linkType}</span>
                  <code className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">"{link.anchorText}"</code>
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-gray-600 hover:underline truncate">{link.source}</a>
                </div>
              ))}
            </div>
          </div>

          {/* E-E-A-T Signals */}
          <Card className="p-5">
            <h3 className="font-700 font-display text-gray-900 mb-3">E-E-A-T Signals</h3>
            <div className="grid grid-cols-2 gap-4">
              {['experienceSignals', 'expertiseSignals', 'authoritySignals', 'trustSignals'].map((key) => (
                <div key={key}>
                  <p className="text-xs font-600 text-gray-500 capitalize mb-1">
                    {key.replace('Signals', '')}
                  </p>
                  {parsed.eeatSignals?.[key]?.map((s: string, i: number) => (
                    <p key={i} className="text-xs text-gray-700">• {s}</p>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">✓ External links & stats ready</p>
            <Button onClick={() => store.setCurrentAgent(8)} className="bg-blue-600 hover:bg-blue-700 text-white font-600">
              Next: Content Audit →
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
