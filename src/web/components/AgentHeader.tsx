import { Badge } from './ui/badge';

interface Props {
  agentNum: number;
  name: string;
  description: string;
  icon: string;
  status: 'idle' | 'running' | 'done' | 'error';
  tags?: string[];
}

export function AgentHeader({ agentNum, name, description, icon, status, tags = [] }: Props) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shrink-0">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-600 text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-display">
              Agent {agentNum}
            </span>
            {status === 'running' && <Badge className="bg-blue-600 text-white text-xs animate-pulse">Running</Badge>}
            {status === 'done' && <Badge className="bg-green-100 text-green-700 text-xs border-green-200">Complete</Badge>}
            {status === 'error' && <Badge className="bg-red-100 text-red-700 text-xs border-red-200">Error</Badge>}
          </div>
          <h2 className="text-xl font-700 font-display text-gray-900">{name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          {tags.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {tags.map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-500">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
