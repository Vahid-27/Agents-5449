/**
 * Clean animated "running" state card — shown during streaming JSON agents.
 * Never shows raw JSON/code to the user.
 */
interface Props {
  label: string;
  steps: string[];
  accent?: 'blue' | 'violet' | 'emerald' | 'orange' | 'rose';
  /** Optional live character count from output */
  outputLength?: number;
}

const ACCENT = {
  blue:    { dot: 'bg-blue-500',   text: 'text-blue-600',   bar: 'bg-blue-500',   step: 'bg-blue-100 text-blue-600',   ping: 'bg-blue-400'   },
  violet:  { dot: 'bg-violet-500', text: 'text-violet-600', bar: 'bg-violet-500', step: 'bg-violet-100 text-violet-600', ping: 'bg-violet-400' },
  emerald: { dot: 'bg-emerald-500', text: 'text-emerald-600', bar: 'bg-emerald-500', step: 'bg-emerald-100 text-emerald-600', ping: 'bg-emerald-400' },
  orange:  { dot: 'bg-orange-500', text: 'text-orange-600', bar: 'bg-orange-500', step: 'bg-orange-100 text-orange-600', ping: 'bg-orange-400' },
  rose:    { dot: 'bg-rose-500',   text: 'text-rose-600',   bar: 'bg-rose-500',   step: 'bg-rose-100 text-rose-600',   ping: 'bg-rose-400'   },
};

export function AgentRunningCard({ label, steps, accent = 'blue', outputLength = 0 }: Props) {
  const c = ACCENT[accent];
  // Estimate progress based on output length — crude but better than nothing
  const estProgress = Math.min(95, Math.round((outputLength / 1200) * 100));
  // Which step to "highlight" based on progress
  const activeStep = Math.min(steps.length - 1, Math.floor((estProgress / 100) * steps.length));

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.ping} opacity-60`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${c.dot}`} />
        </span>
        <span className={`text-sm font-600 ${c.text}`}>{label}</span>
        <span className="ml-auto text-xs text-gray-400 tabular-nums">
          {outputLength > 0 ? `${(outputLength / 1000).toFixed(1)}k chars` : 'Starting…'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100">
        <div
          className={`h-full ${c.bar} transition-all duration-700 ease-out`}
          style={{ width: `${estProgress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="px-5 py-4 space-y-2">
        {steps.map((step, i) => {
          const isDone    = i < activeStep;
          const isActive  = i === activeStep;
          const isPending = i > activeStep;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isDone   ? 'bg-green-100' :
                isActive ? c.step :
                'bg-gray-50'
              }`}>
                {isDone ? (
                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <svg className={`w-2.5 h-2.5 animate-spin ${c.text}`} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                )}
              </div>
              <span className={`text-xs transition-all duration-300 ${
                isDone   ? 'text-gray-500 line-through' :
                isActive ? `font-600 ${c.text}` :
                isPending ? 'text-gray-300' :
                'text-gray-400'
              }`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
