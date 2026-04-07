import { useMemo } from 'react';
import { marked } from 'marked';

// Configure marked for clean output
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface Props {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function MarkdownRenderer({ content, isStreaming, className = '' }: Props) {
  const html = useMemo(() => {
    if (!content) return '';
    try {
      return marked.parse(content) as string;
    } catch {
      return `<pre>${content}</pre>`;
    }
  }, [content]);

  return (
    <div
      className={`blog-content prose max-w-none ${isStreaming ? 'streaming-cursor' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
