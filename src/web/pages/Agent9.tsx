import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { saveAgentOutput } from '../hooks/useSessionCache';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-green-100 text-green-700 border-green-200'
    : score >= 70 ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-red-100 text-red-700 border-red-200';
  return <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-700 text-sm ${color}`}>{score}</span>;
}

function StatusChip({ status }: { status: string }) {
  const color = status === 'PASS' ? 'bg-green-100 text-green-700'
    : status === 'DRIFT' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';
  return <span className={`text-xs px-2 py-0.5 rounded-full font-600 ${color}`}>{status}</span>;
}

export function Agent9() {
  const store = useBlogStore();
  const state = store.agents[9];
  const data = store.intentData;

  const run = () => {
    const sid = store.sessionId;
    store.setCurrentAgent(9);
    store.setAgentStatus(9, 'running');
    store.setAgentOutput(9, '');

    streamAgentAPI(
      '/agent9/check',
      {
        topic: store.topic,
        intakeData: store.intakeData,
        keywords: store.keywordData,
        outline: store.outlineData,
        blogDraft: store.blogDraft,
        finalBlog: store.finalBlog,
        productContext: store.productContext,
      },
      (text) => store.setAgentOutput(9, text),
      (full) => {
        const parsed = tryParseJSON(full);
        if (parsed) {
          store.setIntentData(parsed);
          store.setAgentParsed(9, parsed);
          store.setAgentStatus(9, 'done');
          if (sid) saveAgentOutput(sid, 9, full, parsed);
        } else {
          store.setAgentStatus(9, 'error');
          store.setAgentOutput(9, 'Could not parse intent check output.\n\n' + full);
        }
      },
      (err) => { store.setAgentStatus(9, 'error'); store.setAgentOutput(9, `Error: ${err}`); }
    );
  };

  const verdictColor = data?.overallVerdict === 'PASS' ? 'from-green-500 to-green-600'
    : data?.overallVerdict === 'DRIFT' ? 'from-yellow-500 to-orange-500'
    : 'from-red-500 to-red-600';

  const dims = data?.dimensionScores || {};

  return (
    <div className="p-8 max-w-4xl">
      <AgentHeader
        agentNum={9}
        name="Intent Consistency Checker"
        description="Verifies the original blog intent flows faithfully through every pipeline stage — detecting audience drift, funnel misalignment, tone shifts, and CTA mismatches."
        icon="🎯"
        status={state?.status || 'idle'}
        tags={['Intent Audit', 'Audience Alignment', 'Funnel Check', 'Tone Consistency', 'CTA Validation']}
      />

      {/* Prerequisites */}
      {(!store.blogDraft && !store.finalBlog) && (state?.status === 'idle') && (
        <Card className="p-4 bg-amber-50 border-amber-200 mb-4">
          <p className="text-amber-700 text-sm font-600">⚠️ Run Agent 5 (Blog Writer) first — needs a draft to analyze.</p>
        </Card>
      )}

      {state?.status === 'idle' && (
        <Button
          onClick={run}
          disabled={!store.blogDraft && !store.finalBlog}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-600 py-3"
        >
          Check Intent Consistency →
        </Button>
      )}

      {state?.status === 'running' && (
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-600 text-indigo-600">Analyzing intent flow across pipeline stages...</span>
          </div>
          <div className="space-y-1.5">
            {['Comparing original topic intent vs. outline strategy', 'Checking audience alignment in content', 'Verifying funnel stage consistency', 'Analyzing CTA alignment', 'Detecting tone drift'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                {step}
              </div>
            ))}
          </div>
        </Card>
      )}

      {state?.status === 'done' && data && (
        <div className="space-y-5">
          {/* Overall verdict banner */}
          <Card className={`bg-gradient-to-r ${verdictColor} p-5 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-600 uppercase tracking-wider mb-1">Intent Consistency Score</p>
                <p className="text-4xl font-800">{data.intentConsistencyScore}<span className="text-xl font-400">/100</span></p>
                <p className="text-white/80 text-sm mt-1">{data.intentSummary?.driftSeverity === 'none' ? 'No intent drift detected' : `${data.intentSummary?.driftSeverity} drift detected`}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-700 ${
                  data.overallVerdict === 'PASS' ? 'bg-white/20' : 'bg-white/30'
                }`}>{data.overallVerdict}</span>
                <p className="text-white/60 text-xs mt-2">
                  {data.approvedForPublishing ? '✓ Approved for publishing' : '✗ Revisions needed'}
                </p>
              </div>
            </div>
          </Card>

          {/* Intent Summary */}
          <Card className="p-4">
            <p className="text-xs font-700 text-gray-400 uppercase tracking-wider mb-3">Intent Summary</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500 font-600 mb-1">Original Intent</p>
                <p className="text-sm text-gray-800">{data.intentSummary?.originalIntent}</p>
              </div>
              <div className={`rounded-lg p-3 ${data.intentSummary?.driftSeverity === 'none' ? 'bg-green-50' : 'bg-orange-50'}`}>
                <p className={`text-xs font-600 mb-1 ${data.intentSummary?.driftSeverity === 'none' ? 'text-green-500' : 'text-orange-500'}`}>Delivered Intent</p>
                <p className="text-sm text-gray-800">{data.intentSummary?.deliveredIntent}</p>
              </div>
            </div>
          </Card>

          {/* Dimension Scores */}
          <Card className="p-4">
            <p className="text-xs font-700 text-gray-400 uppercase tracking-wider mb-4">Dimension Analysis</p>
            <div className="space-y-4">
              {Object.entries(dims).map(([key, dim]: [string, any]) => (
                <div key={key} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={dim.score} />
                      <div>
                        <p className="text-sm font-600 text-gray-800 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <StatusChip status={dim.status} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 ml-12">{dim.finding}</p>
                  {dim.evidence && (
                    <blockquote className="ml-12 mt-1.5 text-xs text-gray-400 italic border-l-2 border-gray-200 pl-2">
                      "{dim.evidence}"
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Drift Instances */}
          {(data.driftInstances || []).length > 0 && (
            <Card className="p-4">
              <p className="text-xs font-700 text-gray-400 uppercase tracking-wider mb-3">Drift Instances Found</p>
              <div className="space-y-3">
                {(data.driftInstances || []).map((d: any, i: number) => (
                  <div key={i} className={`rounded-lg p-3 border ${
                    d.severity === 'major' ? 'bg-red-50 border-red-200' : 
                    d.severity === 'moderate' ? 'bg-orange-50 border-orange-200' : 
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-700 text-gray-700">{d.location}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-600 ${
                        d.severity === 'major' ? 'bg-red-100 text-red-700' :
                        d.severity === 'moderate' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{d.severity}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1"><span className="font-600">Expected:</span> {d.originalIntent}</p>
                    <p className="text-xs text-gray-600 mb-2"><span className="font-600">Found:</span> {d.actualContent}</p>
                    <p className="text-xs text-blue-700 bg-blue-50 rounded p-1.5">→ Fix: {d.fix}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Critical Fixes + Strengths */}
          <div className="grid grid-cols-2 gap-4">
            {(data.criticalFixes || []).length > 0 && (
              <Card className="p-4">
                <p className="text-xs font-700 text-red-500 uppercase tracking-wider mb-3">Critical Fixes</p>
                <ul className="space-y-1.5">
                  {(data.criticalFixes || []).map((f: string, i: number) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5 shrink-0">⚠</span>{f}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {(data.intentStrengths || []).length > 0 && (
              <Card className="p-4">
                <p className="text-xs font-700 text-green-500 uppercase tracking-wider mb-3">Intent Strengths</p>
                <ul className="space-y-1.5">
                  {(data.intentStrengths || []).map((s: string, i: number) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Nav */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={run} className="text-xs">Re-check</Button>
            <Button onClick={() => store.setCurrentAgent(10)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-600">
              Continue: Legal Compliance →
            </Button>
          </div>
        </div>
      )}

      {state?.status === 'error' && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700 text-sm mb-3 font-mono text-xs">{state.output?.substring(0, 300)}</p>
          <Button onClick={run} className="bg-red-600 text-white text-sm">Retry</Button>
        </Card>
      )}
    </div>
  );
}
