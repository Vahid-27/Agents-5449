import { useBlogStore } from '../store/blogStore';
import { fetchSessions } from '../hooks/useSessionCache';
import { useEffect, useState } from 'react';
import { ProductSwitcher } from './ProductSwitcher';

// Pipeline phases for visual grouping
const PHASES = [
  {
    label: 'Research',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    dot: 'bg-violet-400',
    agents: [
      { id: 0,  name: 'Product Intelligence', icon: '🔍', desc: 'Scrape & parse product context' },
      { id: 1,  name: 'Topic Intake',          icon: '🎯', desc: 'Audience, funnel & content goal' },
      { id: 2,  name: 'Competitor Analysis',   icon: '🕵️', desc: 'SERP + real competitor content' },
      { id: 3,  name: 'Keyword Extraction',    icon: '🔑', desc: 'Primary, LSI, long-tail, NLP' },
    ],
  },
  {
    label: 'Strategy',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    dot: 'bg-blue-400',
    agents: [
      { id: 4,  name: 'SEO Outline',           icon: '📋', desc: 'Structure, headings & schema plan' },
    ],
  },
  {
    label: 'Creation',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    dot: 'bg-emerald-400',
    agents: [
      { id: 5,  name: 'Blog Writer',           icon: '✍️', desc: 'Full 3000+ word optimised draft' },
      { id: 6,  name: 'Internal Linking',      icon: '🔗', desc: 'TOFU/MOFU/BOFU link strategy' },
      { id: 7,  name: 'External Linking',      icon: '📊', desc: 'Stats, citations & authority links' },
    ],
  },
  {
    label: 'Quality & Compliance',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    dot: 'bg-orange-400',
    agents: [
      { id: 8,  name: 'Content Auditor',       icon: '🔬', desc: 'SEO / AEO / GEO / LLMO / E-E-A-T' },
      { id: 9,  name: 'Intent Checker',        icon: '🧭', desc: 'Verify intent flows through pipeline' },
      { id: 10, name: 'Legal Compliance',      icon: '⚖️', desc: 'FTC · copyright · trademark · GDPR' },
    ],
  },
  {
    label: 'Publish',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    dot: 'bg-rose-400',
    agents: [
      { id: 11, name: 'Final Publisher',       icon: '🚀', desc: 'Publication-ready final content' },
      { id: 12, name: 'HTML Converter',        icon: '💻', desc: 'Schema markup + production HTML' },
    ],
  },
];

// Flat list for progress calc
const ALL_AGENTS = PHASES.flatMap(p => p.agents);
const TOTAL = ALL_AGENTS.length;

export function AgentSidebar() {
  const { currentAgent, agents, setCurrentAgent, resetPipeline, sessionId, activeProduct } = useBlogStore();
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    fetchSessions().then((s: any[]) => setHistoryCount(s.filter((x: any) => x.product === activeProduct.name).length));
  }, [sessionId, activeProduct.name]);

  const doneCount = ALL_AGENTS.filter(a => agents[a.id]?.status === 'done').length;
  const progressPct = Math.round((doneCount / TOTAL) * 100);

  return (
    <aside className="w-[272px] bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shadow-sm">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm font-display">B</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-700 text-gray-900 text-sm leading-tight">Blog Agent</p>
            <p className="text-[11px] text-gray-400 truncate">AI-powered SEO pipeline</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-400 font-600 uppercase tracking-wider">Pipeline progress</span>
            <span className="text-[10px] font-700 text-gray-500">{doneCount}/{TOTAL} done</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Product Switcher ── */}
      <div className="border-b border-gray-100 pt-2 pb-1">
        <ProductSwitcher />
      </div>

      {/* ── Pipeline Phases ── */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {PHASES.map((phase) => (
          <div key={phase.label} className="mb-1">
            {/* Phase label */}
            <div className={`flex items-center gap-1.5 px-1 mb-1`}>
              <div className={`w-1.5 h-1.5 rounded-full ${phase.dot}`} />
              <span className={`text-[10px] font-700 uppercase tracking-widest ${phase.color}`}>
                {phase.label}
              </span>
            </div>

            {/* Agents in phase */}
            <div className="space-y-0.5">
              {phase.agents.map((agent) => {
                const state = agents[agent.id];
                const isActive  = currentAgent === agent.id;
                const isDone    = state?.status === 'done';
                const isRunning = state?.status === 'running';
                const isError   = state?.status === 'error';

                return (
                  <button
                    key={agent.id}
                    onClick={() => setCurrentAgent(agent.id)}
                    className={`
                      w-full text-left rounded-lg flex items-center gap-2.5 px-2.5 py-2 transition-all group
                      ${isActive
                        ? `${phase.bg} border ${phase.border} shadow-sm`
                        : 'hover:bg-gray-50 border border-transparent'}
                      ${isError ? 'bg-red-50 border-red-200' : ''}
                    `}
                  >
                    {/* Step circle */}
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-700 transition-all
                      ${isDone    ? 'bg-green-100 text-green-600' : ''}
                      ${isRunning ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : ''}
                      ${isActive && !isRunning && !isDone ? `bg-white border-2 ${phase.border} ${phase.color} shadow-sm` : ''}
                      ${!isActive && !isDone && !isRunning && !isError ? 'bg-gray-100 text-gray-400' : ''}
                      ${isError   ? 'bg-red-100 text-red-500' : ''}
                    `}>
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isRunning ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      ) : isError ? (
                        <span className="text-xs">!</span>
                      ) : (
                        <span className="text-sm leading-none">{agent.icon}</span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-600 font-display truncate leading-tight ${
                          isActive   ? phase.color.replace('text-', 'text-') :
                          isDone     ? 'text-gray-700' :
                          'text-gray-500 group-hover:text-gray-700'
                        }`}>
                          {agent.name}
                        </span>
                        {isRunning && (
                          <span className="shrink-0 text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-700 leading-none">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate">{agent.desc}</p>
                    </div>

                    {/* Agent number badge */}
                    <span className={`shrink-0 text-[9px] font-700 px-1 py-0.5 rounded leading-none ${
                      isActive ? `${phase.bg} ${phase.color}` : 'text-gray-300'
                    }`}>
                      {agent.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer actions ── */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-1">
        <button
          onClick={() => setCurrentAgent(-1)}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-600 flex items-center gap-2 transition-all ${
            currentAgent === -1
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'text-gray-500 hover:bg-gray-50 border border-transparent'
          }`}
        >
          <span className="text-base leading-none">🕐</span>
          <span>Session History</span>
          {historyCount > 0 && (
            <span className="ml-auto bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full font-700">
              {historyCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { resetPipeline(); setCurrentAgent(0); }}
          className="w-full text-left px-3 py-2 rounded-lg text-xs font-600 text-gray-500 hover:bg-gray-50 border border-transparent flex items-center gap-2 transition-all"
        >
          <span className="text-base leading-none">＋</span>
          <span>New Blog</span>
        </button>
      </div>
    </aside>
  );
}
