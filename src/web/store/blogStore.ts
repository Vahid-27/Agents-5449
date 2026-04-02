import { create } from 'zustand';

export type AgentStatus = 'idle' | 'running' | 'done' | 'error';

export interface AgentState {
  status: AgentStatus;
  output: string;
  parsedData: any;
  error?: string;
}

export interface BlogStore {
  // Pipeline state
  currentAgent: number; // 1-10, 0 = not started
  agents: Record<number, AgentState>;

  // Collected data across pipeline
  topic: string;
  product: string;
  blogType: string;
  targetAudience: string;
  funnelStage: string;
  intakeData: any;
  competitorData: any;
  keywordData: any;
  outlineData: any;
  blogDraft: string;
  internalLinksData: any;
  externalLinksData: any;
  auditData: any;
  finalBlog: string;
  htmlOutput: string;

  // Actions
  setCurrentAgent: (n: number) => void;
  setAgentStatus: (agent: number, status: AgentStatus) => void;
  setAgentOutput: (agent: number, output: string) => void;
  setAgentParsed: (agent: number, data: any) => void;
  setTopic: (t: string) => void;
  setProduct: (p: string) => void;
  setIntakeData: (d: any) => void;
  setCompetitorData: (d: any) => void;
  setKeywordData: (d: any) => void;
  setOutlineData: (d: any) => void;
  setBlogDraft: (s: string) => void;
  setInternalLinksData: (d: any) => void;
  setExternalLinksData: (d: any) => void;
  setAuditData: (d: any) => void;
  setFinalBlog: (s: string) => void;
  setHtmlOutput: (s: string) => void;
  resetPipeline: () => void;
}

const defaultAgentState = (): AgentState => ({ status: 'idle', output: '', parsedData: null });

export const useBlogStore = create<BlogStore>((set) => ({
  currentAgent: 0,
  agents: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, defaultAgentState()])),
  topic: '',
  product: 'talsy.ai',
  blogType: '',
  targetAudience: '',
  funnelStage: '',
  intakeData: null,
  competitorData: null,
  keywordData: null,
  outlineData: null,
  blogDraft: '',
  internalLinksData: null,
  externalLinksData: null,
  auditData: null,
  finalBlog: '',
  htmlOutput: '',

  setCurrentAgent: (n) => set({ currentAgent: n }),
  setAgentStatus: (agent, status) =>
    set((s) => ({ agents: { ...s.agents, [agent]: { ...s.agents[agent], status } } })),
  setAgentOutput: (agent, output) =>
    set((s) => ({ agents: { ...s.agents, [agent]: { ...s.agents[agent], output } } })),
  setAgentParsed: (agent, parsedData) =>
    set((s) => ({ agents: { ...s.agents, [agent]: { ...s.agents[agent], parsedData } } })),
  setTopic: (topic) => set({ topic }),
  setProduct: (product) => set({ product }),
  setIntakeData: (intakeData) => set({ intakeData, blogType: intakeData?.blogType, targetAudience: intakeData?.targetAudience?.primary, funnelStage: intakeData?.funnelStage }),
  setCompetitorData: (competitorData) => set({ competitorData }),
  setKeywordData: (keywordData) => set({ keywordData }),
  setOutlineData: (outlineData) => set({ outlineData }),
  setBlogDraft: (blogDraft) => set({ blogDraft }),
  setInternalLinksData: (internalLinksData) => set({ internalLinksData }),
  setExternalLinksData: (externalLinksData) => set({ externalLinksData }),
  setAuditData: (auditData) => set({ auditData }),
  setFinalBlog: (finalBlog) => set({ finalBlog }),
  setHtmlOutput: (htmlOutput) => set({ htmlOutput }),
  resetPipeline: () => set({
    currentAgent: 0,
    agents: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, defaultAgentState()])),
    topic: '', product: 'talsy.ai', blogType: '', targetAudience: '', funnelStage: '',
    intakeData: null, competitorData: null, keywordData: null, outlineData: null,
    blogDraft: '', internalLinksData: null, externalLinksData: null,
    auditData: null, finalBlog: '', htmlOutput: '',
  }),
}));
