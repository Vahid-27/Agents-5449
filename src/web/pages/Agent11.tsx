import { useState, useEffect } from 'react';
import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI } from '../lib/streaming';
import { saveAgentOutput, saveCheckpoint, fetchAgentVersions, activateVersion } from '../hooks/useSessionCache';
import { AgentHeader } from '../components/AgentHeader';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function Agent11() {
  const store = useBlogStore();
  const state = store.agents[11];
  const [versions, setVersions] = useState<{ version: number; created_at: string; is_active: number }[]>([]);
  const [loadingVersion, setLoadingVersion] = useState<number | null>(null);

  useEffect(() => {
    if (!store.sessionId || state?.status !== 'done') return;
    fetchAgentVersions(store.sessionId, 9).then(setVersions);
  }, [store.sessionId, state?.status]);

  const switchVersion = async (version: number) => {
    if (!store.sessionId) return;
    setLoadingVersion(version);
    const ok = await activateVersion(store.sessionId, 9, version);
    if (ok) {
      const res = await fetch(`/api/sessions/${store.sessionId}`);
      if (res.ok) {
        const { session, outputs } = await res.json();
        store.loadSession(session, outputs);
      }
      await fetchAgentVersions(store.sessionId, 9).then(setVersions);
    }
    setLoadingVersion(null);
  };

  const run = () => {
    const sid = store.sessionId;
    store.setCurrentAgent(11);
    store.setAgentStatus(11, 'running');
    store.setAgentOutput(11, '');
    store.setFinalBlog('');

    streamAgentAPI(
      '/agent11/finalize',
      {
        blogContent: store.blogDraft,
        auditReport: store.auditData,
        internalLinks: store.internalLinksData,
        externalLinks: store.externalLinksData,
        keywords: store.keywordData,
        topic: store.topic,
        outline: store.outlineData,
        productContext: store.productContext,
      },
      (text) => { store.setAgentOutput(11, text); store.setFinalBlog(text); },
      (full) => {
        store.setAgentParsed(11, { content: full });
        store.setFinalBlog(full);
        store.setAgentStatus(11, 'done');
        if (sid) {
          saveAgentOutput(sid, 11, full, null);
          fetchAgentVersions(sid, 9).then(setVersions);
        }
      },
      (err) => { store.setAgentStatus(11, 'error'); store.setAgentOutput(11, `Error: ${err}`); },
      { onCheckpoint: (text) => { if (sid) saveCheckpoint(sid, 9, text); } }
    );
  };

  const wordCount = store.finalBlog?.split(/\s+/).filter(Boolean).length || 0;

  return (
    <div className="p-8 max-w-5xl">
      <AgentHeader
        agentNum={11}
        name="Final Publisher Agent"
        description="Produces the definitive, publication-ready #1 blog post — integrating all audit fixes, internal/external links, and full SEO/AEO/GEO/LLMO optimization."
        icon="🚀"
        status={state?.status || 'idle'}
        tags={['Final Output', '#1 Ranking', '100k Impressions', 'Publication Ready']}
      />

      {/* Improvements applied */}
      {store.auditData && (
        <div className="flex gap-2 flex-wrap mb-5">
          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-500">
            ✓ {store.auditData.criticalIssues?.length || 0} issues fixed
          </span>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-500">
            ✓ {store.internalLinksData?.internalLinkSuggestions?.length || 0} internal links added
          </span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-500">
            ✓ {store.externalLinksData?.statsAndData?.length || 0} stats integrated
          </span>
          <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-500">
            ✓ SEO + AEO + GEO + LLMO optimized
          </span>
        </div>
      )}

      {store.finalBlog && (
        <div className="flex items-center gap-3 mb-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <span className={`text-sm font-600 ${wordCount >= 3000 ? 'text-green-600' : 'text-gray-700'}`}>
            {wordCount.toLocaleString()} words
          </span>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${wordCount >= 3000 ? 'bg-green-500' : 'bg-blue-600'}`}
              style={{ width: `${Math.min(100, Math.round((wordCount / 3500) * 100))}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">Target: 3,500</span>
          {state?.status === 'running' && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Finalizing...
            </span>
          )}
        </div>
      )}

      {state?.status === 'idle' && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-2">Produce the final, fully-optimized publication-ready blog post.</p>
          <p className="text-sm text-gray-400 mb-4">All previous agent outputs are merged into the definitive version.</p>
          <Button onClick={run} className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6">
            Generate Final Blog →
          </Button>
        </Card>
      )}

      {(state?.status === 'running' || state?.status === 'done') && store.finalBlog && (
        <Card className="overflow-hidden">
          <Tabs defaultValue="rendered">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="rendered" className="text-xs">Rendered</TabsTrigger>
                <TabsTrigger value="raw" className="text-xs">Raw Markdown</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                {state?.status === 'done' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(store.finalBlog)} className="text-xs">
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const blob = new Blob([store.finalBlog], { type: 'text/markdown' });
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                      a.download = 'blog-post.md'; a.click();
                    }} className="text-xs">
                      Download MD
                    </Button>
                  </>
                )}
              </div>
            </div>
            <TabsContent value="rendered" className="m-0">
              <ScrollArea className="max-h-[700px]">
                <div className="p-6">
                  <MarkdownRenderer
                    content={store.finalBlog}
                    isStreaming={state?.status === 'running'}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="raw" className="m-0">
              <ScrollArea className="max-h-[700px]">
                <pre className={`p-6 text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed ${state?.status === 'running' ? 'streaming-cursor' : ''}`}>
                  {store.finalBlog}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Version switcher */}
      {versions.length > 1 && (
        <div className="flex items-center gap-2 pt-2 pb-1">
          <span className="text-xs text-gray-400 font-500">Versions:</span>
          {versions.map((v) => (
            <button
              key={v.version}
              onClick={() => switchVersion(v.version)}
              disabled={loadingVersion !== null}
              className={`text-xs px-2.5 py-1 rounded-full border font-500 transition-colors ${
                v.is_active
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              } ${loadingVersion === v.version ? 'opacity-50' : ''}`}
            >
              {loadingVersion === v.version ? '...' : `v${v.version}`}
            </button>
          ))}
        </div>
      )}

      {state?.status === 'done' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-700 text-green-800 font-display">🎉 Publication-ready blog complete!</p>
              <p className="text-sm text-green-700 mt-0.5">
                {wordCount.toLocaleString()} words · Optimized for SEO, AEO, GEO, LLMO · Targeting 100k+ impressions
              </p>
            </div>
            <Button onClick={() => store.setCurrentAgent(12)} className="bg-blue-600 hover:bg-blue-700 text-white font-600">
                Convert to HTML →
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
