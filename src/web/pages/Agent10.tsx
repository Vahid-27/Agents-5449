import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { saveAgentOutput } from '../hooks/useSessionCache';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const CATEGORY_LABELS: Record<string, string> = {
  copyright: 'Copyright & Plagiarism',
  ftcCompliance: 'FTC / Advertising Law',
  defamationRisk: 'Defamation Risk',
  seoCompliance: 'SEO Compliance',
  aiContentDisclosure: 'AI Content Disclosure',
  trademarkIssues: 'Trademark Issues',
  claimsAccuracy: 'Claims Accuracy',
  privacyCompliance: 'Privacy & GDPR/CCPA',
  regulatoryDisclaimer: 'Regulatory Disclaimers',
  platformPolicies: 'Platform Policies (Google/Bing)',
};

function CategoryRow({ label, cat }: { label: string; cat: any }) {
  if (!cat) return null;
  const bg = cat.status === 'PASS' ? 'bg-green-50 border-green-100'
    : cat.status === 'WARNING' ? 'bg-yellow-50 border-yellow-100'
    : 'bg-red-50 border-red-100';
  const badge = cat.status === 'PASS' ? 'bg-green-100 text-green-700'
    : cat.status === 'WARNING' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';
  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-600 text-gray-800">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-600">{cat.score}/100</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-600 ${badge}`}>{cat.status}</span>
        </div>
      </div>
      {(cat.issues || []).filter(Boolean).length > 0 && (
        <ul className="space-y-1">
          {(cat.issues || []).filter(Boolean).map((issue: string, i: number) => (
            <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
              <span className="text-orange-400 mt-0.5 shrink-0">!</span>{issue}
            </li>
          ))}
        </ul>
      )}
      {(cat.fixes || []).filter(Boolean).length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {(cat.fixes || []).filter(Boolean).map((fix: string, i: number) => (
            <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
              <span className="text-blue-400 mt-0.5 shrink-0">→</span>{fix}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Agent10() {
  const store = useBlogStore();
  const state = store.agents[10];
  const data = store.legalData;

  const run = () => {
    const sid = store.sessionId;
    store.setCurrentAgent(10);
    store.setAgentStatus(10, 'running');
    store.setAgentOutput(10, '');

    streamAgentAPI(
      '/agent10/legal',
      {
        topic: store.topic,
        finalBlog: store.finalBlog,
        blogDraft: store.blogDraft,
        keywords: store.keywordData,
        outline: store.outlineData,
        productContext: store.productContext,
        externalLinks: store.externalLinksData,
      },
      (text) => store.setAgentOutput(10, text),
      (full) => {
        const parsed = tryParseJSON(full);
        if (parsed) {
          store.setLegalData(parsed);
          store.setAgentParsed(10, parsed);
          store.setAgentStatus(10, 'done');
          if (sid) saveAgentOutput(sid, 10, full, parsed);
        } else {
          store.setAgentStatus(10, 'error');
          store.setAgentOutput(10, 'Could not parse legal report output.\n\n' + full);
        }
      },
      (err) => { store.setAgentStatus(10, 'error'); store.setAgentOutput(10, `Error: ${err}`); }
    );
  };

  const clearanceColor = data?.publishingClearance === 'CLEAR' ? 'from-green-500 to-emerald-600'
    : data?.publishingClearance === 'CONDITIONAL' ? 'from-yellow-500 to-orange-500'
    : 'from-red-500 to-red-700';

  const cats = data?.categories || {};

  return (
    <div className="p-8 max-w-4xl">
      <AgentHeader
        agentNum={10}
        name="Legal Compliance Checker"
        description="Audits your content for copyright, FTC compliance, defamation risk, trademark issues, AI disclosure requirements, GDPR/CCPA, SEO/AEO/GEO/LLMO legal concerns, and platform policy adherence."
        icon="⚖️"
        status={state?.status || 'idle'}
        tags={['Copyright', 'FTC Law', 'Trademark', 'GDPR/CCPA', 'SEO Policy', 'AI Disclosure', 'Platform Policies']}
      />

      {/* Prerequisites */}
      {(!store.blogDraft && !store.finalBlog) && state?.status === 'idle' && (
        <Card className="p-4 bg-amber-50 border-amber-200 mb-4">
          <p className="text-amber-700 text-sm font-600">⚠️ Run Agent 5 (Blog Writer) first — needs content to audit.</p>
        </Card>
      )}

      {/* Legal disclaimer */}
      <Card className="p-3 bg-gray-50 border-gray-200 mb-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-600 text-gray-600">Disclaimer:</span> This is an AI-powered compliance guidance tool, not legal advice. 
          Results are informational only. Consult a qualified attorney for binding legal opinions before publishing commercial content.
        </p>
      </Card>

      {state?.status === 'idle' && (
        <Button
          onClick={run}
          disabled={!store.blogDraft && !store.finalBlog}
          className="w-full bg-slate-700 hover:bg-slate-800 text-white font-600 py-3"
        >
          Run Legal Compliance Audit →
        </Button>
      )}

      {state?.status === 'running' && (
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
            <span className="text-sm font-600 text-slate-600">Running legal compliance audit...</span>
          </div>
          <div className="space-y-1.5">
            {[
              'Scanning for copyright and plagiarism risks',
              'Checking FTC/advertising disclosure compliance',
              'Analyzing defamation and competitor claim risks',
              'Auditing SEO practices for policy violations',
              'Checking AI content disclosure requirements',
              'Verifying trademark usage and brand mention compliance',
              'Assessing unverified claims and factual accuracy',
              'Reviewing privacy and data collection references',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
                {step}
              </div>
            ))}
          </div>
        </Card>
      )}

      {state?.status === 'done' && data && (
        <div className="space-y-5">
          {/* Clearance banner */}
          <Card className={`bg-gradient-to-r ${clearanceColor} p-5 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-600 uppercase tracking-wider mb-1">Compliance Score</p>
                <p className="text-4xl font-800">{data.complianceScore}<span className="text-xl font-400">/100</span></p>
                <p className="text-white/80 text-sm mt-1">{data.summary}</p>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-700 bg-white/20 mb-1 mr-1`}>
                    {data.overallStatus}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-700 bg-white/30`}>
                    Risk: {data.riskLevel?.toUpperCase()}
                  </span>
                </div>
                <p className="text-white/70 text-xs">
                  Publishing: <span className="font-700 text-white">{data.publishingClearance}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Critical Issues */}
          {(data.criticalIssues || []).length > 0 && (
            <Card className="p-4">
              <p className="text-xs font-700 text-red-500 uppercase tracking-wider mb-3">
                Critical Legal Issues ({data.criticalIssues.length})
              </p>
              <div className="space-y-3">
                {(data.criticalIssues || []).map((issue: any, i: number) => (
                  <div key={i} className={`rounded-lg p-3 border ${
                    issue.urgency === 'must-fix-before-publish' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-600 text-gray-800">{issue.issue}</p>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-600 ${
                        issue.urgency === 'must-fix-before-publish' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>{issue.urgency === 'must-fix-before-publish' ? 'Must Fix' : 'Review'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="font-600">Category:</span> {issue.category} &nbsp;·&nbsp; 
                      <span className="font-600">Location:</span> {issue.location}
                    </p>
                    {issue.legalBasis && (
                      <p className="text-xs text-purple-700 mb-2">⚖ {issue.legalBasis}</p>
                    )}
                    <p className="text-xs text-blue-700 bg-blue-50 rounded p-1.5">→ {issue.requiredFix}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Category breakdown */}
          <Card className="p-4">
            <p className="text-xs font-700 text-gray-400 uppercase tracking-wider mb-3">Compliance Categories</p>
            <div className="space-y-3">
              {Object.entries(cats).map(([key, cat]) => (
                <CategoryRow key={key} label={CATEGORY_LABELS[key] || key} cat={cat} />
              ))}
            </div>
          </Card>

          {/* Required disclaimers */}
          {(data.recommendedDisclaimers || []).length > 0 && (
            <Card className="p-4">
              <p className="text-xs font-700 text-gray-400 uppercase tracking-wider mb-3">Recommended Disclaimers</p>
              <div className="space-y-3">
                {(data.recommendedDisclaimers || []).map((d: any, i: number) => (
                  <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-600 text-blue-800">{d.type}</p>
                      <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">{d.placement}</span>
                    </div>
                    <p className="text-xs text-gray-600 italic bg-white rounded p-2 border border-blue-100">"{d.suggestedText}"</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Legal required flags */}
          {data.legallyRequired && (
            <Card className="p-4">
              <p className="text-xs font-700 text-gray-400 uppercase tracking-wider mb-3">Legally Required Elements Check</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.legallyRequired).map(([key, required]) => (
                  <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${required ? 'bg-red-50' : 'bg-green-50'}`}>
                    <span className={required ? 'text-red-500' : 'text-green-500'}>
                      {required ? '✗' : '✓'}
                    </span>
                    <span className="text-xs text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {required && <span className="text-xs text-red-600 font-600 ml-auto">Required</span>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* SEO + LLMO Legal Notes */}
          <div className="grid grid-cols-2 gap-4">
            {(data.seoLegalNotes || []).length > 0 && (
              <Card className="p-4">
                <p className="text-xs font-700 text-gray-400 uppercase tracking-wider mb-2">SEO Legal Notes</p>
                <ul className="space-y-1.5">
                  {(data.seoLegalNotes || []).map((n: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-blue-400 shrink-0 mt-0.5">•</span>{n}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {(data.llmoAeoLegalNotes || []).length > 0 && (
              <Card className="p-4">
                <p className="text-xs font-700 text-gray-400 uppercase tracking-wider mb-2">AEO/GEO/LLMO Legal Notes</p>
                <ul className="space-y-1.5">
                  {(data.llmoAeoLegalNotes || []).map((n: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-purple-400 shrink-0 mt-0.5">•</span>{n}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Conditional clearance steps */}
          {data.publishingClearance !== 'CLEAR' && (data.conditionalClearanceSteps || []).length > 0 && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <p className="text-xs font-700 text-amber-600 uppercase tracking-wider mb-3">Steps to Achieve Full Clearance</p>
              <ol className="space-y-2">
                {(data.conditionalClearanceSteps || []).map((step: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-amber-500 font-700 shrink-0">{i + 1}.</span>{step}
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={run} className="text-xs">Re-audit</Button>
            <Button onClick={() => store.setCurrentAgent(11)} className="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-600">
              Next: Final Publisher →
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
