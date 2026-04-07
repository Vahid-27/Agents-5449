import { useEffect, useState } from 'react';
import { useBlogStore } from '../store/blogStore';
import { fetchSessions, fetchSession, deleteSession } from '../hooks/useSessionCache';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const AGENT_NAMES: Record<number, { name: string; icon: string }> = {
  1:  { name: 'Topic Intake',        icon: '🎯' },
  2:  { name: 'Competitor Analysis', icon: '🔍' },
  3:  { name: 'Keyword Extraction',  icon: '🔑' },
  4:  { name: 'SEO Outline',         icon: '📋' },
  5:  { name: 'Blog Writer',         icon: '✍️' },
  6:  { name: 'Internal Links',      icon: '🔗' },
  7:  { name: 'External Links',      icon: '📊' },
  8:  { name: 'Content Audit',       icon: '🔬' },
  9:  { name: 'Final Blog',          icon: '🚀' },
  10: { name: 'HTML Export',         icon: '💻' },
};

function AgentSteps({ outputs }: { outputs: any[] }) {
  const doneSet = new Set(outputs.map((o: any) => o.agentNum));
  return (
    <div className="flex gap-1 flex-wrap mt-3">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
        const done = doneSet.has(n);
        const a = AGENT_NAMES[n];
        return (
          <div
            key={n}
            title={a.name}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-500 border transition-all ${
              done
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
          >
            <span>{a.icon}</span>
            <span>{n}. {a.name}</span>
            {done && <span className="text-green-500">✓</span>}
          </div>
        );
      })}
    </div>
  );
}

export function History() {
  const store = useBlogStore();
  const { activeProduct } = useBlogStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionOutputs, setSessionOutputs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [resuming, setResuming] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions().then(async (allList: any[]) => {
      const list = allList.filter((s: any) => s.product === activeProduct.name || !s.product);
      setSessions(list);
      setLoading(false);
      // Pre-fetch outputs for all sessions
      const outputMap: Record<string, any[]> = {};
      await Promise.all(list.map(async (s: any) => {
        const data = await fetchSession(s.id);
        if (data?.outputs) outputMap[s.id] = data.outputs;
      }));
      setSessionOutputs(outputMap);
    });
  }, [activeProduct.name]);

  const resume = async (id: string) => {
    setResuming(id);
    const data = await fetchSession(id);
    if (!data) return setResuming(null);
    store.loadSession(data.session, data.outputs || []);
    // Go to the agent they were on (or 1 if none)
    store.setCurrentAgent(data.session.currentAgent || 1);
    setResuming(null);
  };

  const remove = async (id: string) => {
    await deleteSession(id);
    setSessions(s => s.filter(x => x.id !== id));
    setSessionOutputs(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-800 font-display text-gray-900">Blog History</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved · Resume any draft where you left off
          </p>
        </div>
        <Button
          onClick={() => { store.resetPipeline(); store.setCurrentAgent(1); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-600"
        >
          + New Blog
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" /> Loading sessions...
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <Card className="p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-600 text-gray-600">No blog sessions yet</p>
          <p className="text-sm mt-1">Start your first pipeline — every step auto-saves</p>
          <Button onClick={() => store.setCurrentAgent(1)} className="mt-4 bg-blue-600 text-white font-600">
            Start Now →
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {sessions.map(s => {
          // API returns camelCase
          const outputs = sessionOutputs[s.id] || [];
          const agentsDone = outputs.length;
          const pct = Math.round((agentsDone / 10) * 100);
          const isExpanded = expanded === s.id;

          return (
            <Card key={s.id} className={`transition-all ${isExpanded ? 'border-blue-200' : 'hover:border-gray-300'}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status + meta row */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded font-600 ${
                        s.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {s.status === 'done' ? '✓ Done' : '⟳ In Progress'}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(s.updatedAt)}</span>
                      {s.blogType && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.blogType}</span>
                      )}
                      {s.funnelStage && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">{s.funnelStage}</span>
                      )}
                      <code className="text-xs text-gray-300 font-mono">{s.id.slice(0, 8)}…</code>
                    </div>

                    {/* Topic */}
                    <p className="font-700 font-display text-gray-900 text-base truncate">{s.topic}</p>
                    {s.product && (
                      <p className="text-xs text-gray-500 mt-0.5">{s.product}</p>
                    )}

                    {/* Progress bar */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{agentsDone}/10 agents</span>
                    </div>

                    {/* Last position */}
                    {s.currentAgent > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last position: Agent {s.currentAgent} — {AGENT_NAMES[s.currentAgent]?.name}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      onClick={() => resume(s.id)}
                      disabled={resuming === s.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 font-600"
                    >
                      {resuming === s.id ? 'Loading…' : 'Resume →'}
                    </Button>
                    <Button
                      onClick={() => setExpanded(isExpanded ? null : s.id)}
                      variant="outline"
                      className="text-xs h-8 px-3 text-gray-600"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </Button>
                    <Button
                      onClick={() => remove(s.id)}
                      variant="outline"
                      className="text-xs h-8 px-3 text-red-500 hover:text-red-700 hover:border-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Expanded: Agent Steps */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-600 text-gray-500 uppercase tracking-wider mb-2">Pipeline Steps</p>
                    <AgentSteps outputs={outputs} />

                    {/* Audience + details */}
                    {(s.targetAudience || s.funnelStage) && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {s.targetAudience && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Target Audience</p>
                            <p className="text-xs font-500 text-gray-700">{s.targetAudience}</p>
                          </div>
                        )}
                        {s.funnelStage && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Funnel Stage</p>
                            <p className="text-xs font-500 text-gray-700">{s.funnelStage}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => resume(s.id)}
                      disabled={resuming === s.id}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-600"
                    >
                      {resuming === s.id ? 'Loading…' : `Resume at Agent ${s.currentAgent || 1} →`}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
