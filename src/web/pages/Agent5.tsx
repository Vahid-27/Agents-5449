import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI } from '../lib/streaming';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function Agent5() {
  const store = useBlogStore();
  const state = store.agents[5];

  const run = () => {
    store.setCurrentAgent(5);
    store.setAgentStatus(5, 'running');
    store.setAgentOutput(5, '');
    store.setBlogDraft('');

    streamAgentAPI(
      '/agent5/write',
      {
        topic: store.topic,
        outline: store.outlineData,
        keywords: store.keywordData,
        audience: store.targetAudience,
        blogType: store.blogType,
        product: store.product,
      },
      (text) => { store.setAgentOutput(5, text); store.setBlogDraft(text); },
      (full) => {
        store.setAgentParsed(5, { content: full });
        store.setBlogDraft(full);
        store.setAgentStatus(5, 'done');
      },
      (err) => { store.setAgentStatus(5, 'error'); store.setAgentOutput(5, `Error: ${err}`); }
    );
  };

  const wordCount = store.blogDraft?.split(/\s+/).filter(Boolean).length || 0;

  return (
    <div className="p-8 max-w-5xl">
      <AgentHeader
        agentNum={5}
        name="Blog Writer Agent"
        description="Writes the full, #1-ranking blog draft with proper keyword density, E-E-A-T signals, and optimized structure for SEO, AEO, GEO, and LLMO."
        icon="✍️"
        status={state?.status || 'idle'}
        tags={['E-E-A-T', 'Semantic SEO', 'Featured Snippets', 'AI Citations']}
      />

      {/* Word count bar */}
      {store.blogDraft && (
        <div className="flex items-center gap-3 mb-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
          <span className="text-sm font-600 text-gray-700">{wordCount.toLocaleString()} words</span>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (wordCount / 3000) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">Target: ~3,000</span>
          {state?.status === 'running' && <span className="text-xs text-blue-600 animate-pulse">Writing...</span>}
        </div>
      )}

      {state?.status === 'idle' && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-2">Ready to write the full blog post based on the outline and keywords.</p>
          <p className="text-sm text-gray-400 mb-4">This will generate ~3,000 words optimized for all search engines.</p>
          <Button onClick={run} className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6">
            Write Blog Draft →
          </Button>
        </Card>
      )}

      {(state?.status === 'running' || state?.status === 'done') && store.blogDraft && (
        <Card className="overflow-hidden">
          <Tabs defaultValue="rendered">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="rendered" className="text-xs">Rendered</TabsTrigger>
                <TabsTrigger value="raw" className="text-xs">Raw Markdown</TabsTrigger>
              </TabsList>
              {state?.status === 'done' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(store.blogDraft)}
                  className="text-xs"
                >
                  Copy
                </Button>
              )}
            </div>
            <TabsContent value="rendered" className="m-0">
              <ScrollArea className="max-h-[600px]">
                <div
                  className={`blog-content p-6 text-sm leading-relaxed ${state?.status === 'running' ? 'streaming-cursor' : ''}`}
                  dangerouslySetInnerHTML={{
                    __html: store.blogDraft
                      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/^- (.+)$/gm, '<li>$1</li>')
                      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
                      .replace(/\n\n/g, '</p><p>')
                      .replace(/^(?!<[hlu])/gm, '')
                  }}
                />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="raw" className="m-0">
              <ScrollArea className="max-h-[600px]">
                <pre className={`p-6 text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed ${state?.status === 'running' ? 'streaming-cursor' : ''}`}>
                  {store.blogDraft}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {state?.status === 'done' && (
        <div className="flex justify-between items-center pt-4">
          <div className="flex gap-3">
            <span className="text-sm text-gray-500">✓ {wordCount.toLocaleString()} words written</span>
            <Button variant="outline" onClick={run} className="text-xs h-7 px-3">Regenerate</Button>
          </div>
          <Button onClick={() => store.setCurrentAgent(6)} className="bg-blue-600 hover:bg-blue-700 text-white font-600">
            Next: Internal Links →
          </Button>
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
