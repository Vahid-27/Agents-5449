import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI } from '../lib/streaming';
import { saveAgentOutput } from '../hooks/useSessionCache';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function Agent12() {
  const store = useBlogStore();
  const state = store.agents[12];

  const run = () => {
    const sid = store.sessionId;
    store.setCurrentAgent(12);
    store.setAgentStatus(12, 'running');
    store.setAgentOutput(12, '');
    store.setHtmlOutput('');

    streamAgentAPI(
      '/agent12/convert',
      {
        blogContent: store.finalBlog || store.blogDraft,
        topic: store.topic,
        keywords: store.keywordData,
        outline: store.outlineData,
        productContext: store.productContext,
      },
      (text) => { store.setAgentOutput(12, text); store.setHtmlOutput(text); },
      (full) => {
        store.setAgentParsed(12, { html: full });
        store.setHtmlOutput(full);
        store.setAgentStatus(12, 'done');
        if (sid) saveAgentOutput(sid, 12, full, null);
      },
      (err) => { store.setAgentStatus(12, 'error'); store.setAgentOutput(12, `Error: ${err}`); }
    );
  };

  const htmlLines = store.htmlOutput?.split('\n').length || 0;

  return (
    <div className="p-8 max-w-5xl">
      <AgentHeader
        agentNum={12}
        name="HTML Converter Agent"
        description="Converts the final blog into production-ready, semantic HTML5 with full schema markup, Open Graph tags, JSON-LD, and all SEO/AEO/GEO/LLMO optimizations."
        icon="💻"
        status={state?.status || 'idle'}
        tags={['Schema Markup', 'JSON-LD', 'Open Graph', 'Semantic HTML5', 'FAQPage Schema']}
      />

      {/* What gets generated */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: '📄', label: 'Article Schema', desc: 'JSON-LD structured data' },
          { icon: '❓', label: 'FAQPage Schema', desc: 'Answer engine ready' },
          { icon: '🔗', label: 'Open Graph', desc: 'Social sharing optimized' },
          { icon: '🐦', label: 'Twitter Cards', desc: 'Twitter/X optimized' },
          { icon: '🔍', label: 'Canonical URL', desc: 'Duplicate prevention' },
          { icon: '📱', label: 'Semantic HTML5', desc: 'article, section, nav' },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-lg">{f.icon}</span>
            <div>
              <p className="text-xs font-600 text-gray-800">{f.label}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {state?.status === 'idle' && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">Convert the final blog to production-ready HTML with all SEO/AEO/GEO/LLMO meta tags and schema.</p>
          <Button onClick={run} className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6">
            Generate HTML →
          </Button>
        </Card>
      )}

      {store.htmlOutput && (
        <div className="mb-3 flex items-center gap-3 text-sm text-gray-500">
          <span>{htmlLines} lines of HTML</span>
          {state?.status === 'running' && <span className="text-blue-600 animate-pulse">Generating...</span>}
        </div>
      )}

      {(state?.status === 'running' || state?.status === 'done') && store.htmlOutput && (
        <Card className="overflow-hidden">
          <Tabs defaultValue="code">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="code" className="text-xs">HTML Code</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">Live Preview</TabsTrigger>
              </TabsList>
              {state?.status === 'done' && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(store.htmlOutput)} className="text-xs">
                    Copy HTML
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const blob = new Blob([store.htmlOutput], { type: 'text/html' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                    a.download = 'blog-post.html'; a.click();
                  }} className="text-xs">
                    Download HTML
                  </Button>
                </div>
              )}
            </div>
            <TabsContent value="code" className="m-0">
              <ScrollArea className="max-h-[700px]">
                <pre className={`p-4 text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-950 text-green-400 ${state?.status === 'running' ? 'streaming-cursor' : ''}`}>
                  {store.htmlOutput}
                </pre>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="preview" className="m-0">
              <div className="h-[700px]">
                <iframe
                  srcDoc={store.htmlOutput}
                  className="w-full h-full border-0"
                  title="Blog Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {state?.status === 'done' && (
        <div className="mt-4 p-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white">
          <p className="font-800 font-display text-lg mb-1">🎊 Blog Production Complete!</p>
          <p className="text-blue-100 text-sm mb-4">
            Your SEO/AEO/GEO/LLMO-optimized blog for talsy.ai is ready for publishing.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                const blob = new Blob([store.htmlOutput], { type: 'text/html' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = 'talsy-blog-post.html'; a.click();
              }}
              className="bg-white text-blue-700 hover:bg-blue-50 font-600 text-sm"
            >
              Download HTML
            </Button>
            <Button
              onClick={() => {
                const blob = new Blob([store.finalBlog || store.blogDraft], { type: 'text/markdown' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = 'talsy-blog-post.md'; a.click();
              }}
              className="bg-blue-500 text-white hover:bg-blue-400 font-600 text-sm"
            >
              Download Markdown
            </Button>
            <Button
              onClick={() => store.resetPipeline()}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-sm"
            >
              New Blog
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
