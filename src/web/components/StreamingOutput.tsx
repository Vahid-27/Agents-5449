import { ScrollArea } from './ui/scroll-area';

interface Props {
  text: string;
  isStreaming?: boolean;
  className?: string;
  type?: 'json' | 'markdown' | 'html';
}

export function StreamingOutput({ text, isStreaming, className = '', type = 'markdown' }: Props) {
  if (!text) return null;

  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white rounded-t-lg">
        <span className="text-xs font-500 text-gray-500 uppercase tracking-wider">
          {type === 'json' ? 'JSON Output' : type === 'html' ? 'HTML Output' : 'Output'}
        </span>
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs text-blue-600 font-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Generating...
          </span>
        )}
      </div>
      <ScrollArea className="max-h-[500px]">
        <div className={`p-4 text-sm leading-relaxed ${type !== 'markdown' ? 'font-mono text-xs' : ''} whitespace-pre-wrap text-gray-700 ${isStreaming ? 'streaming-cursor' : ''}`}>
          {text}
        </div>
      </ScrollArea>
    </div>
  );
}
