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

const TARGET_WORDS = 3000;

export function Agent5() {
  const store = useBlogStore();
  const state = store.agents[5];
  const [versions, setVersions] = useState<{ version: number; created_at: string; is_active: number }[]>([]);
  const [loadingVersion, setLoadingVersion] = useState<number | null>(null);

  // Load versions on mount / when done
  useEffect(() => {
    if (!store.sessionId || state?.status !== 'done') return;
    fetchAgentVersions(store.sessionId, 5).then(setVersions);
  }, [store.sessionId, state?.status]);

  const switchVersion = async (version: number) => {
    if (!store.sessionId) return;
    setLoadingVersion(version);
    const ok = await activateVersion(store.sessionId, 5, version);
    if (ok) {
      // Reload session outputs from DB
      const res = await fetch(`/api/sessions/${store.sessionId}`);
      if (res.ok) {
        const { session, outputs } = await res.json();
        store.loadSession(session, outputs);
      }
      await fetchAgentVersions(store.sessionId, 5).then(setVersions);
    }
    setLoadingVersion(null);
  };

  const run = () => {
    const sid = store.sessionId;
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
        if (sid) {
          saveAgentOutput(sid, 5, full, null);
          fetchAgentVersions(sid, 5).then(setVersions);
        }
      },
      (err) => { store.setAgentStatus(5, 'error'); store.setAgentOutput(5, `Error: ${err}`); },
      { onCheckpoint: (text) => { if (sid) saveCheckpoint(sid, 5, text); } }
    );
  };

  const wordCount = store.blogDraft?.split(/\s+/).filter(Boolean).length || 0;
  // Cap bar at 100%, show actual count
  const barPct = Math.min(100, Math.round((wordCount / TARGET_WORDS) * 100));
  const isOver = wordCount > TARGET_WORDS;

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
        <div className="flex items-center gap-3 mb-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <span className={`text-sm font-600 ${isOver ? 'text-green-600' : 'text-gray-700'}`}>
            {wordCount.toLocaleString()} words
          </span>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-green-500' : 'bg-blue-600'}`}
              style={{ width: `${barPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">Target: {TARGET_WORDS.toLocaleString()}</span>
          {state?.status === 'running' && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Writing...
            </span>
          )}
          {isOver && state?.status === 'done' && (
            <span className="text-xs text-green-600 font-500">+{(wordCount - TARGET_WORDS).toLocaleString()} extra</span>
          )}
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(store.blogDraft)} className="text-xs">
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const blob = new Blob([store.blogDraft], { type: 'text/markdown' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                    a.download = 'blog-draft.md'; a.click();
                  }} className="text-xs">
                    Download
                  </Button>
                </div>
              )}
            </div>
            <TabsContent value="rendered" className="m-0">
              <ScrollArea className="max-h-[620px]">
                <div className="p-6">
                  <MarkdownRenderer
                    content={store.blogDraft}
                    isStreaming={state?.status === 'running'}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="raw" className="m-0">
              <ScrollArea className="max-h-[620px]">
                <pre className={`p-6 text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed ${state?.status === 'running' ? 'streaming-cursor' : ''}`}>
                  {store.blogDraft}
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
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-3">
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
