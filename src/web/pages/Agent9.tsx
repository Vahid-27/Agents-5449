import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI } from '../lib/streaming';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function Agent9() {
  const store = useBlogStore();
  const state = store.agents[9];

  const run = () => {
    store.setCurrentAgent(9);
    store.setAgentStatus(9, 'running');
    store.setAgentOutput(9, '');
    store.setFinalBlog('');

    streamAgentAPI(
      '/agent9/finalize',
      {
        blogContent: store.blogDraft,
        auditReport: store.auditData,
        internalLinks: store.internalLinksData,
        externalLinks: store.externalLinksData,
        keywords: store.keywordData,
        topic: store.topic,
        outline: store.outlineData,
      },
      (text) => { store.setAgentOutput(9, text); store.setFinalBlog(text); },
      (full) => {
        store.setAgentParsed(9, { content: full });
        store.setFinalBlog(full);
        store.setAgentStatus(9, 'done');
      },
      (err) => { store.setAgentStatus(9, 'error'); store.setAgentOutput(9, `Error: ${err}`); }
    );
  };

  const wordCount = store.finalBlog?.split(/\s+/).filter(Boolean).length || 0;

  return (
    <div className="p-8 max-w-5xl">
      <AgentHeader
        agentNum={9}
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
        <div className="flex items-center gap-3 mb-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
          <span className="text-sm font-600 text-gray-700">{wordCount.toLocaleString()} words</span>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (wordCount / 3500) * 100)}%` }} />
          </div>
          <span className="text-xs text-gray-500">Target: ~3,500</span>
          {state?.status === 'running' && <span className="text-xs text-blue-600 animate-pulse">Finalizing...</span>}
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
                <div
                  className={`blog-content p-6 text-sm leading-relaxed ${state?.status === 'running' ? 'streaming-cursor' : ''}`}
                  dangerouslySetInnerHTML={{
                    __html: store.finalBlog
                      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/^- (.+)$/gm, '<li>$1</li>')
                      .replace(/\n\n/g, '</p><p>')
                  }}
                />
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

      {state?.status === 'done' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-700 text-green-800 font-display">🎉 Publication-ready blog complete!</p>
              <p className="text-sm text-green-700 mt-0.5">
                {wordCount.toLocaleString()} words · Optimized for SEO, AEO, GEO, LLMO · Targeting 100k+ impressions
              </p>
            </div>
            <Button onClick={() => store.setCurrentAgent(10)} className="bg-blue-600 hover:bg-blue-700 text-white font-600">
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
