import { useBlogStore } from '../store/blogStore';
import { Button } from '../components/ui/button';

const PIPELINE_STEPS = [
  { n: 1, icon: '🎯', name: 'Topic Intake', desc: 'B2B/B2C + Audience' },
  { n: 2, icon: '🔍', name: 'Competitor Analysis', desc: '6 platforms' },
  { n: 3, icon: '🔑', name: 'Keywords', desc: 'Primary + LSI + LLMO' },
  { n: 4, icon: '📋', name: 'SEO Outline', desc: 'Schema + PAA' },
  { n: 5, icon: '✍️', name: 'Blog Writer', desc: '3,000+ words' },
  { n: 6, icon: '🔗', name: 'Internal Links', desc: 'TOFU/MOFU/BOFU' },
  { n: 7, icon: '📊', name: 'External Links', desc: 'Stats + Authority' },
  { n: 8, icon: '🔬', name: 'Full Audit', desc: 'SEO/AEO/GEO/LLMO' },
  { n: 9, icon: '🚀', name: 'Final Blog', desc: '#1 Ranking Ready' },
  { n: 10, icon: '💻', name: 'HTML Export', desc: 'Production HTML' },
];

export function Welcome() {
  const store = useBlogStore();

  return (
    <div className="p-8 max-w-4xl">
      {/* Hero */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-sm font-600 text-blue-700">10-Agent Blog Writing Pipeline</span>
        </div>
        <h1 className="text-4xl font-800 font-display text-gray-900 leading-tight mb-3">
          Write blogs that rank<br />
          <span className="text-blue-600">#1 on every search engine</span>
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed max-w-2xl">
          An end-to-end AI pipeline that produces SEO, AEO, GEO, and LLMO-optimized blog content for talsy.ai — designed for 100k+ impressions and top organic rankings.
        </p>
      </div>

      {/* Pipeline visual */}
      <div className="grid grid-cols-5 gap-3 mb-10">
        {PIPELINE_STEPS.map((step, idx) => (
          <div key={step.n} className="relative">
            {idx < PIPELINE_STEPS.length - 1 && idx % 5 !== 4 && (
              <div className="absolute top-5 left-[calc(100%+2px)] w-[calc(100%-16px)] h-0.5 bg-blue-100 z-0" />
            )}
            <div className="relative z-10 bg-white border border-gray-200 rounded-xl p-3 text-center hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="text-xl mb-1">{step.icon}</div>
              <p className="text-xs font-700 text-gray-800 leading-tight">{step.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mx-auto mt-2 font-700">
                {step.n}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Optimization pillars */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { abbr: 'SEO', name: 'Search Engine Opt.', color: 'blue', desc: 'Ranks on Google, Bing, and traditional search' },
          { abbr: 'AEO', name: 'Answer Engine Opt.', color: 'orange', desc: 'Featured snippets, PAA, voice search' },
          { abbr: 'GEO', name: 'Generative Engine Opt.', color: 'purple', desc: 'AI-generated answers in ChatGPT, Gemini, Perplexity' },
          { abbr: 'LLMO', name: 'LLM Optimization', color: 'pink', desc: 'Cited by Claude, GPT, Grok, and other LLMs' },
        ].map(p => {
          const colors: Record<string, string> = {
            blue: 'bg-blue-50 border-blue-100 text-blue-700',
            orange: 'bg-orange-50 border-orange-100 text-orange-700',
            purple: 'bg-purple-50 border-purple-100 text-purple-700',
            pink: 'bg-pink-50 border-pink-100 text-pink-700',
          };
          return (
            <div key={p.abbr} className={`rounded-xl border p-4 ${colors[p.color]}`}>
              <p className="text-2xl font-800 font-display mb-1">{p.abbr}</p>
              <p className="text-xs font-600 mb-1">{p.name}</p>
              <p className="text-xs opacity-75">{p.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Start CTA */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => store.setCurrentAgent(1)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-700 px-8 py-3 text-base h-auto"
        >
          Start Blog Pipeline →
        </Button>
        <p className="text-sm text-gray-400">Powered by Claude Sonnet · Built for talsy.ai</p>
      </div>
    </div>
  );
}
