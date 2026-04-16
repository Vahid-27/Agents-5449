import { create } from 'zustand';
import { updateSessionAgent } from '../hooks/useSessionCache';

export type AgentStatus = 'idle' | 'running' | 'done' | 'error';

export interface AgentVersion {
  version: number;
  created_at: string;
  is_active: number;
}

export interface AgentState {
  status: AgentStatus;
  output: string;
  parsedData: any;
  error?: string;
  versions?: AgentVersion[];
  activeVersion?: number;
}

export interface ProductContext {
  name: string;
  url: string;
  tagline: string;
  description: string;
  coreFeatures: string[];
  usp: string[];
  targetMarket: string;
  primaryPersona: string;
  businessModel: string;
  tone: string;
  contentAngles: string[];
  competitors: string[];
  keyPainPointsSolved: string[];
  industry: string;
  pricingModel: string;
  confidence: string;
}

export interface ActiveProduct {
  name: string;
  url: string;
}

export const PRODUCTS: ActiveProduct[] = [
  { name: 'talsy.ai', url: 'https://www.talsy.ai/' },
  { name: 'MockWin.ai', url: 'https://www.mockwin.ai/' },
  { name: 'yashvini.in', url: 'https://www.yashvini.in/' },
];

export interface BlogStore {
  // Product state
  activeProduct: ActiveProduct;
  productContext: ProductContext | null;
  prdFileContent: string | null;

  // Session state
  currentAgent: number;
  sessionId: string | null;
  agents: Record<number, AgentState>;

  // Blog pipeline data
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
  intentData: any;
  legalData: any;

  // Actions
  setActiveProduct: (p: ActiveProduct) => void;
  setProductContext: (ctx: ProductContext | null) => void;
  setPrdFileContent: (content: string | null) => void;
  setCurrentAgent: (n: number) => void;
  setSessionId: (id: string) => void;
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
  setIntentData: (d: any) => void;
  setLegalData: (d: any) => void;
  loadSession: (session: any, outputs: any[]) => void;
  resetPipeline: () => void;
  switchProduct: (p: ActiveProduct) => void;
}

const defaultAgentState = (): AgentState => ({ status: 'idle', output: '', parsedData: null });

const LS_KEY = 'talsy_active_session';
const LS_PRODUCT_KEY = 'talsy_active_product';

function persistSession(sessionId: string | null, currentAgent: number) {
  try {
    if (sessionId) {
      localStorage.setItem(LS_KEY, JSON.stringify({ sessionId, currentAgent }));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  } catch { /* ignore */ }
}

function persistProduct(product: ActiveProduct) {
  try {
    localStorage.setItem(LS_PRODUCT_KEY, JSON.stringify(product));
  } catch { /* ignore */ }
}

export function getPersistedSession(): { sessionId: string; currentAgent: number } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function getPersistedProduct(): ActiveProduct | null {
  try {
    const raw = localStorage.getItem(LS_PRODUCT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

const defaultAgents = () => Object.fromEntries(
  Array.from({ length: 14 }, (_, i) => [i, defaultAgentState()])
);

export const useBlogStore = create<BlogStore>((set, get) => ({
  // Product
  activeProduct: PRODUCTS[0],
  productContext: null,
  prdFileContent: null,

  // Session
  currentAgent: 0,
  sessionId: null,
  agents: defaultAgents(),

  // Pipeline data
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
  intentData: null,
  legalData: null,

  setActiveProduct: (p) => {
    persistProduct(p);
    set({ activeProduct: p });
  },

  setProductContext: (ctx) => set({ productContext: ctx }),
  setPrdFileContent: (content) => set({ prdFileContent: content }),

  // Switch product: clear session, reset pipeline, navigate to agent 0
  switchProduct: (p) => {
    persistProduct(p);
    persistSession(null, 0);
    set({
      activeProduct: p,
      productContext: null,
      prdFileContent: null,
      currentAgent: 0,
      sessionId: null,
      agents: defaultAgents(),
      topic: '',
      product: p.name,
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
      intentData: null,
      legalData: null,
    });
  },

  setCurrentAgent: (n) => {
    set({ currentAgent: n });
    const { sessionId } = get();
    persistSession(sessionId, n);
    if (sessionId && n > 0) updateSessionAgent(sessionId, n);
  },

  setSessionId: (id) => {
    set({ sessionId: id });
    const { currentAgent } = get();
    persistSession(id, currentAgent);
  },

  setAgentStatus: (agent, status) =>
    set((s) => ({ agents: { ...s.agents, [agent]: { ...s.agents[agent], status } } })),

  setAgentOutput: (agent, output) =>
    set((s) => ({ agents: { ...s.agents, [agent]: { ...s.agents[agent], output } } })),

  setAgentParsed: (agent, parsedData) =>
    set((s) => ({ agents: { ...s.agents, [agent]: { ...s.agents[agent], parsedData } } })),

  setTopic: (topic) => set({ topic }),
  setProduct: (product) => set({ product }),

  setIntakeData: (intakeData) => set({
    intakeData,
    blogType: intakeData?.blogType,
    targetAudience: intakeData?.targetAudience?.primary,
    funnelStage: intakeData?.funnelStage,
  }),
  setCompetitorData: (competitorData) => set({ competitorData }),
  setKeywordData: (keywordData) => set({ keywordData }),
  setOutlineData: (outlineData) => set({ outlineData }),
  setBlogDraft: (blogDraft) => set({ blogDraft }),
  setInternalLinksData: (internalLinksData) => set({ internalLinksData }),
  setExternalLinksData: (externalLinksData) => set({ externalLinksData }),
  setAuditData: (auditData) => set({ auditData }),
  setFinalBlog: (finalBlog) => set({ finalBlog }),
  setHtmlOutput: (htmlOutput) => set({ htmlOutput }),
  setIntentData: (intentData) => set({ intentData }),
  setLegalData: (legalData) => set({ legalData }),

  loadSession: (session, outputs) => {
    const agents = defaultAgents();
    const patch: Partial<BlogStore> = {
      sessionId: session.id,
      topic: session.topic,
      product: session.product,
      blogType: session.blog_type || session.blogType || '',
      targetAudience: session.target_audience || session.targetAudience || '',
      funnelStage: session.funnel_stage || session.funnelStage || '',
      currentAgent: session.current_agent || session.currentAgent || 1,
    };
    // Restore productContext if stored in session
    if (session.product_context || session.productContext) {
      try {
        const raw = session.product_context || session.productContext;
        patch.productContext = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch { /* ignore */ }
    }
    for (const row of outputs) {
      const n = row.agentNum ?? row.agent_num;
      const parsed = row.parsedData
        ? (typeof row.parsedData === 'string' ? JSON.parse(row.parsedData) : row.parsedData)
        : row.parsed_data
          ? JSON.parse(row.parsed_data)
          : null;
      const status = (row.status === 'running' ? 'idle' : row.status) as AgentStatus;
      agents[n] = { status, output: row.output || '', parsedData: parsed };
      if (n === 0 && parsed) patch.productContext = parsed;
      if (n === 1 && parsed) patch.intakeData = parsed;
      if (n === 2 && parsed) patch.competitorData = parsed;
      if (n === 3 && parsed) patch.keywordData = parsed;
      if (n === 4 && parsed) patch.outlineData = parsed;
      if (n === 5) patch.blogDraft = row.output || '';
      if (n === 6 && parsed) patch.internalLinksData = parsed;
      if (n === 7 && parsed) patch.externalLinksData = parsed;
      if (n === 8 && parsed) patch.auditData = parsed;
      if (n === 9 && parsed) patch.intentData = parsed;
      if (n === 10 && parsed) patch.legalData = parsed;
      if (n === 11) patch.finalBlog = row.output || '';
      if (n === 12) patch.htmlOutput = row.output || '';
    }
    set({ ...patch, agents } as any);
    persistSession(session.id, patch.currentAgent as number);
  },

  resetPipeline: () => {
    persistSession(null, 0);
    const { activeProduct } = get();
    set({
      currentAgent: 0,
      sessionId: null,
      agents: defaultAgents(),
      topic: '',
      product: activeProduct.name,
      blogType: '',
      targetAudience: '',
      funnelStage: '',
      productContext: null,
      prdFileContent: null,
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
      intentData: null,
      legalData: null,
    });
  },
}));
