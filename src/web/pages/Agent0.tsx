import { useState, useRef } from 'react';
import mammoth from 'mammoth';
import { useBlogStore } from '../store/blogStore';
import { streamAgentAPI, tryParseJSON } from '../lib/streaming';
import { createSession, saveAgentOutput } from '../hooks/useSessionCache';
import { AgentHeader } from '../components/AgentHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
];

function FileIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

async function extractTextFromFile(file: File): Promise<string> {
  // Plain text / markdown
  if (
    file.type === 'text/plain' || file.type === 'text/markdown' ||
    file.type === 'text/x-markdown' || file.name.endsWith('.md') || file.name.endsWith('.txt')
  ) {
    return file.text();
  }

  // PDF — use pdfjs-dist
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    try {
      // Dynamic import to avoid SSR issues
      const pdfjsLib = await import('pdfjs-dist');
      // Use local worker from node_modules to avoid version mismatch
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = (content.items as any[]).map((item) => item.str || '').join(' ');
        pages.push(text);
      }
      const extracted = pages.join('\n\n').trim();
      return extracted.substring(0, 10000) ||
        `[PDF: ${file.name} — no extractable text found]`;
    } catch {
      // Fallback: binary string extraction
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string || '';
          const readable = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, '\n').trim();
          resolve(readable.substring(0, 5000) || `[PDF: ${file.name} — extraction limited]`);
        };
        reader.readAsBinaryString(file);
      });
    }
  }

  // DOCX — use mammoth for proper extraction
  if (file.name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToMarkdown({ arrayBuffer });
      return result.value.substring(0, 10000) ||
        `[DOCX: ${file.name} — no extractable text]`;
    } catch {
      return `[DOCX: ${file.name} — ${Math.round(file.size / 1024)}KB — extraction failed]`;
    }
  }

  return file.text().catch(() => `[File: ${file.name}]`);
}

export function Agent0() {
  const store = useBlogStore();
  const state = store.agents[0];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prdFile, setPrdFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const productUrl = store.activeProduct.url;
  const productName = store.activeProduct.name;

  const handleFile = (file: File) => {
    if (ACCEPTED_TYPES.includes(file.type) || /\.(pdf|docx|doc|txt|md)$/i.test(file.name)) {
      setPrdFile(file);
    }
  };

  const run = async () => {
    store.setAgentStatus(0, 'running');
    store.setAgentOutput(0, '');
    store.setProductContext(null);

    let prdContent = '';
    if (prdFile) {
      try {
        prdContent = await extractTextFromFile(prdFile);
        store.setPrdFileContent(prdContent);
      } catch { /* ignore */ }
    }

    // Create session in DB
    const sid = await createSession(store.topic || '__product_intel__', productName);
    if (sid) store.setSessionId(sid);

    streamAgentAPI(
      '/agent0/scrape',
      { productUrl, productName, prdContent },
      (text) => store.setAgentOutput(0, text),
      (full) => {
        const parsed = tryParseJSON(full);
        if (parsed) {
          store.setProductContext(parsed);
          store.setAgentParsed(0, parsed);
          store.setAgentStatus(0, 'done');
          if (sid) saveAgentOutput(sid, 0, full, parsed, { productContext: parsed });
          // Advance to topic intake
          store.setCurrentAgent(1);
        } else {
          store.setAgentStatus(0, 'error');
          store.setAgentOutput(0, 'Could not parse product intelligence. Raw output saved.\n\n' + full);
        }
      },
      (err) => {
        store.setAgentStatus(0, 'error');
        store.setAgentOutput(0, `Error: ${err}`);
      }
    );
  };

  const ctx = store.productContext;

  return (
    <div className="p-8 max-w-3xl">
      <AgentHeader
        agentNum={0}
        name="Product Intelligence Agent"
        description="Scrapes the product website and reads your PRD to extract features, USP, target market, and tone — powering every agent downstream."
        icon="🔍"
        status={state?.status || 'idle'}
        tags={['Website Scrape', 'PRD Analysis', 'USP Extraction', 'Market Positioning']}
      />

      {/* Product URL display */}
      <div className="mb-5 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-700">
          {productName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-600 text-gray-900">{productName}</p>
          <p className="text-xs text-blue-600">{productUrl}</p>
        </div>
        <span className="ml-auto text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Active product</span>
      </div>

      {/* PRD Upload */}
      {(state?.status === 'idle' || state?.status === 'error') && (
        <div className="mb-5">
          <p className="text-sm font-600 text-gray-700 mb-2">PRD / Product Doc <span className="text-gray-400 font-400">(optional)</span></p>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragOver ? 'border-blue-400 bg-blue-50' : prdFile ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {prdFile ? (
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckIcon />
                <span className="text-sm font-600">{prdFile.name}</span>
                <span className="text-xs text-green-500">({Math.round(prdFile.size / 1024)}KB)</span>
                <button
                  className="ml-2 text-xs text-red-400 hover:text-red-600"
                  onClick={(e) => { e.stopPropagation(); setPrdFile(null); store.setPrdFileContent(null); }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-center mb-2 text-gray-400"><FileIcon /></div>
                <p className="text-sm text-gray-500">Drop your PRD here or <span className="text-blue-600">browse</span></p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, Markdown</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Run button */}
      {state?.status === 'idle' && (
        <Button onClick={run} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-600 py-3">
          Analyze {productName} →
        </Button>
      )}

      {/* Running state */}
      {state?.status === 'running' && (
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-600 text-blue-600">Scraping {productUrl}...</span>
          </div>
          <div className="space-y-2">
            {['Fetching website content', 'Analyzing features & USP', 'Identifying target market', 'Extracting content angles'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                {step}
              </div>
            ))}
          </div>
          {prdFile && (
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
              + Integrating PRD: {prdFile.name}
            </p>
          )}
        </Card>
      )}

      {/* Done — show product card */}
      {state?.status === 'done' && ctx && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-700 text-base">{ctx.name}</p>
              <p className="text-blue-200 text-xs mt-0.5">{ctx.tagline}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-600 ${
                ctx.businessModel === 'B2B' ? 'bg-orange-400 text-white' :
                ctx.businessModel === 'B2C' ? 'bg-green-400 text-white' :
                'bg-purple-400 text-white'
              }`}>
                {ctx.businessModel}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500 text-white">
                {ctx.confidence} confidence
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed">{ctx.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-700 text-gray-500 uppercase tracking-wide mb-2">Core Features</p>
                <ul className="space-y-1">
                  {(ctx.coreFeatures || []).slice(0, 5).map((f, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span className="text-blue-500 mt-0.5">•</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-700 text-gray-500 uppercase tracking-wide mb-2">USP</p>
                <ul className="space-y-1">
                  {(ctx.usp || []).slice(0, 4).map((u, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">★</span>{u}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Industry</p>
                <p className="text-sm font-600 text-gray-800">{ctx.industry}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tone</p>
                <p className="text-sm font-600 text-gray-800 capitalize">{ctx.tone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Pricing</p>
                <p className="text-sm font-600 text-gray-800 capitalize">{ctx.pricingModel}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-700 text-gray-500 uppercase tracking-wide mb-2">Content Angles</p>
              <div className="flex flex-wrap gap-1.5">
                {(ctx.contentAngles || []).slice(0, 4).map((a, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 pb-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => { store.setAgentStatus(0, 'idle'); store.setProductContext(null); }}
            >
              Re-analyze
            </Button>
            <Button
              onClick={() => store.setCurrentAgent(1)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-600 text-sm"
            >
              Continue: Enter Blog Topic →
            </Button>
          </div>
        </Card>
      )}

      {/* Error state */}
      {state?.status === 'error' && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700 text-sm mb-3">{state.output?.substring(0, 200)}</p>
          <Button onClick={run} className="bg-red-600 text-white text-sm">Retry Analysis</Button>
        </Card>
      )}
    </div>
  );
}
