import { useBlogStore } from '../store/blogStore';

const AGENTS = [
  { id: 1, name: 'Topic Intake', icon: '🎯', desc: 'B2B/B2C + audience' },
  { id: 2, name: 'Competitor Analysis', icon: '🔍', desc: 'Web + AI search analysis' },
  { id: 3, name: 'Keyword Extraction', icon: '🔑', desc: 'Primary, secondary, long-tail' },
  { id: 4, name: 'SEO Research & Outline', icon: '📋', desc: 'SEO + AEO + GEO + LLMO outline' },
  { id: 5, name: 'Blog Writer', icon: '✍️', desc: 'Full draft creation' },
  { id: 6, name: 'Internal Linking', icon: '🔗', desc: 'TOFU/MOFU/BOFU links' },
  { id: 7, name: 'External Linking', icon: '📊', desc: 'Stats + outbound links' },
  { id: 8, name: 'Content Auditor', icon: '🔬', desc: 'Full SEO/AEO/GEO/LLMO audit' },
  { id: 9, name: 'Final Publisher', icon: '🚀', desc: '#1 ranking final content' },
  { id: 10, name: 'HTML Converter', icon: '💻', desc: 'Production-ready HTML' },
];

export function AgentSidebar() {
  const { currentAgent, agents, setCurrentAgent } = useBlogStore();

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm font-display">T</span>
          </div>
          <div>
            <p className="font-display font-700 text-gray-900 text-sm leading-tight">talsy.ai</p>
            <p className="text-xs text-gray-500">Blog Writing Agent</p>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-xs font-600 text-gray-400 uppercase tracking-wider px-3 mb-3">Pipeline</p>
        <div className="space-y-1">
          {AGENTS.map((agent, idx) => {
            const state = agents[agent.id];
            const isActive = currentAgent === agent.id;
            const isDone = state?.status === 'done';
            const isRunning = state?.status === 'running';
            const isError = state?.status === 'error';
            const isPending = state?.status === 'idle';

            return (
              <div key={agent.id} className="relative">
                {idx < AGENTS.length - 1 && (
                  <div className={`pipeline-line ${isDone ? 'done' : isActive ? 'active' : ''}`} />
                )}
                <button
                  onClick={() => setCurrentAgent(agent.id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-all
                    ${isActive ? 'bg-blue-50 border border-blue-200' : ''}
                    ${isDone ? 'hover:bg-gray-50 cursor-pointer' : isPending && !isActive ? 'cursor-pointer hover:bg-gray-50 opacity-60' : 'cursor-pointer'}
                    ${isError ? 'bg-red-50 border border-red-200' : ''}
                  `}
                >
                  {/* Step indicator */}
                  <div className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5
                    ${isDone ? 'bg-green-100 text-green-700' : ''}
                    ${isRunning ? 'bg-blue-600 text-white animate-pulse' : ''}
                    ${isActive && !isRunning ? 'bg-blue-600 text-white' : ''}
                    ${isPending ? 'bg-gray-100 text-gray-400' : ''}
                    ${isError ? 'bg-red-100 text-red-600' : ''}
                  `}>
                    {isDone ? '✓' : isRunning ? '⟳' : isError ? '!' : agent.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-600 font-display ${isActive ? 'text-blue-700' : isDone ? 'text-gray-700' : 'text-gray-500'}`}>
                        {agent.id}. {agent.name}
                      </span>
                      {isRunning && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-500">Running</span>
                      )}
                      {isDone && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-500">Done</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{agent.desc}</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">Powered by Claude Sonnet</p>
      </div>
    </aside>
  );
}
