import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { saveAgentOutput } from '../hooks/useSessionCache';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { AgentRunningCard } from '../components/AgentRunningCard';

function ScoreBar({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-600 ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {score}/{max}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AuditCard({ title, data, color = 'blue' }: { title: string; data: any; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50',
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50',
    green: 'border-green-200 bg-green-50',
    pink: 'border-pink-200 bg-pink-50',
  };
  if (!data) return null;
  const score = data.score;
  const pct = (score / 100) * 100;

  return (
    <Card className={`p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-700 font-display text-gray-800 text-sm">{title}</h4>
        <span className={`text-lg font-800 font-display ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {score}
        </span>
      </div>
      {/* Sub scores */}
      {Object.entries(data).filter(([k]) => !['score','issues','recommendations'].includes(k)).map(([k, v]: [string, any]) => (
        v?.score !== undefined && (
          <ScoreBar key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} score={v.score} />
        )
      ))}
      {data.issues?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-600 text-red-600 mb-1">Issues</p>
          {data.issues.map((issue: string, i: number) => (
            <p key={i} className="text-xs text-gray-700">⚠ {issue}</p>
          ))}
        </div>
      )}
      {data.recommendations?.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-600 text-green-600 mb-1">Fixes</p>
          {data.recommendations.map((r: string, i: number) => (
            <p key={i} className="text-xs text-gray-700">✓ {r}</p>
          ))}
        </div>
      )}
    </Card>
  );
}

export function Agent8() {
  const store = useBlogStore();
  const state = store.agents[8];
  const parsed = state?.parsedData;

  const run = () => {
    const sid = store.sessionId;
    store.setCurrentAgent(8);
    store.setAgentStatus(8, 'running');
    store.setAgentOutput(8, '');

    streamAgentAPI(
      '/agent8/audit',
      { blogContent: store.blogDraft, topic: store.topic, keywords: store.keywordData, outline: store.outlineData, audience: store.targetAudience, blogType: store.blogType, productContext: store.productContext },
      (text) => store.setAgentOutput(8, text),
      (full) => {
        const p = tryParseJSON(full);
        store.setAgentParsed(8, p);
        if (p) store.setAuditData(p);
        store.setAgentStatus(8, 'done');
        if (sid) saveAgentOutput(sid, 8, full, p);
      },
      (err) => { store.setAgentStatus(8, 'error'); store.setAgentOutput(8, `Error: ${err}`); }
    );
  };

  return (
    <div className="p-8 max-w-4xl">
      <AgentHeader
        agentNum={8}
        name="Content Auditor Agent"
        description="Ruthlessly audits the blog across SEO, AEO, GEO, LLMO, E-E-A-T — scores every dimension and provides prioritized improvement recommendations."
        icon="🔬"
        status={state?.status || 'idle'}
        tags={['SEO Audit', 'AEO Audit', 'GEO Audit', 'LLMO Audit', 'E-E-A-T']}
      />

      {state?.status === 'idle' && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">Run a comprehensive audit. No sugarcoating — every weakness gets flagged.</p>
          <Button onClick={run} className="bg-blue-600 hover:bg-blue-700 text-white font-600 px-6">
            Run Full Audit →
          </Button>
        </Card>
      )}

      {state?.status === 'running' && (
        <AgentRunningCard
          label="Running full content audit…"
          accent="orange"
          outputLength={state.output?.length || 0}
          steps={[
            'Scoring SEO: keyword density & headings',
            'Auditing AEO: featured snippet readiness',
            'Checking GEO: local & voice search signals',
            'Evaluating LLMO: AI citation readiness',
            'Assessing E-E-A-T signals',
            'Analysing readability & conversion',
          ]}
        />
      )}

      {parsed && (
        <div className="space-y-4">
          {/* Overall Score */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Overall Content Score</p>
                <p className={`text-5xl font-800 font-display ${
                  parsed.overallScore >= 80 ? 'text-green-600' :
                  parsed.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>{parsed.overallScore}<span className="text-lg text-gray-400">/100</span></p>
                <p className="text-sm font-600 text-gray-700 mt-1 capitalize">{parsed.verdict}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Ranking Potential</p>
                <p className="font-700 text-gray-800">{parsed.estimatedRankingPotential}</p>
              </div>
            </div>
            {/* Score breakdown bars */}
            <div className="mt-4 grid grid-cols-5 gap-3">
              {['seoAudit', 'aeoAudit', 'geoAudit', 'llmoAudit', 'eeatAudit'].map((k) => {
                const labels: Record<string, string> = { seoAudit: 'SEO', aeoAudit: 'AEO', geoAudit: 'GEO', llmoAudit: 'LLMO', eeatAudit: 'E-E-A-T' };
                const score = parsed[k]?.score || 0;
                const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div key={k} className="text-center">
                    <div className="h-16 bg-gray-100 rounded-lg flex items-end overflow-hidden mb-1">
                      <div className={`w-full ${color} rounded-b-lg transition-all`} style={{ height: `${score}%` }} />
                    </div>
                    <p className="text-xs font-600 text-gray-600">{labels[k]}</p>
                    <p className="text-xs text-gray-500">{score}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Audit Cards */}
          <div className="grid grid-cols-1 gap-4">
            <AuditCard title="SEO Audit" data={parsed.seoAudit} color="blue" />
            <AuditCard title="AEO Audit" data={parsed.aeoAudit} color="orange" />
            <AuditCard title="GEO Audit" data={parsed.geoAudit} color="purple" />
            <AuditCard title="LLMO Audit" data={parsed.llmoAudit} color="pink" />
            <AuditCard title="E-E-A-T Audit" data={parsed.eeatAudit} color="green" />
          </div>

          {/* Priority Fixes */}
          <Card className="p-5">
            <h3 className="font-700 font-display text-gray-900 mb-3">Priority Improvement Order</h3>
            <ol className="space-y-2">
              {parsed.improvementPriority?.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 font-700 mt-0.5">{i + 1}</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ol>
          </Card>

          {/* Quick Wins */}
          <Card className="p-4 bg-green-50 border-green-100">
            <h4 className="font-600 font-display text-green-800 mb-2">Quick Wins (High Impact, Easy)</h4>
            {parsed.quickWins?.map((w: string, i: number) => (
              <p key={i} className="text-sm text-green-800">⚡ {w}</p>
            ))}
          </Card>

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">✓ Audit complete — {parsed.criticalIssues?.length} critical issues found</p>
            <Button onClick={() => store.setCurrentAgent(9)} className="bg-blue-600 hover:bg-blue-700 text-white font-600">
              Next: Intent Check →
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
