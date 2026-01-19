import { useState, useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

export interface TerminalMessage {
  text: string;
  type: 'progress' | 'success' | 'info';
  delay?: number;
}

interface TerminalProgressConsoleProps {
  title: string;
  messages: TerminalMessage[];
  isVisible: boolean;
  onComplete?: () => void;
  nextButtonText?: string;
  onNextClick?: () => void;
  minDuration?: number;
}

const formatTimestamp = (): string => {
  const now = new Date();
  return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
};

export const KEYWORD_PLANNER_MESSAGES: TerminalMessage[] = [
  { text: 'Initializing keyword research engine...', type: 'progress', delay: 400 },
  { text: 'Connected to keyword database', type: 'success', delay: 300 },
  { text: 'Analyzing seed keywords and URL context...', type: 'progress', delay: 500 },
  { text: 'Extracted 12 semantic themes from website', type: 'success', delay: 350 },
  { text: 'Generating keyword variations...', type: 'progress', delay: 400 },
  { text: 'Created broad match keywords', type: 'success', delay: 300 },
  { text: 'Created phrase match keywords', type: 'success', delay: 250 },
  { text: 'Created exact match keywords', type: 'success', delay: 250 },
  { text: 'Fetching search volume data for selected country...', type: 'progress', delay: 450 },
  { text: 'Retrieved volume metrics for 500+ keywords', type: 'success', delay: 350 },
  { text: 'Calculating keyword difficulty scores...', type: 'progress', delay: 400 },
  { text: 'Difficulty analysis complete', type: 'success', delay: 300 },
  { text: 'Organizing keywords by intent category...', type: 'progress', delay: 350 },
  { text: 'Keywords organized into 8 ad groups', type: 'success', delay: 300 },
  { text: 'Keyword generation complete! Ready to proceed.', type: 'success', delay: 200 },
];

export const LONG_TAIL_MESSAGES: TerminalMessage[] = [
  { text: 'Initializing long-tail keyword generator...', type: 'progress', delay: 400 },
  { text: 'Connected to autocomplete API', type: 'success', delay: 300 },
  { text: 'Processing seed keywords...', type: 'progress', delay: 350 },
  { text: 'Parsed 5 seed keywords for expansion', type: 'success', delay: 300 },
  { text: 'Generating autocomplete suggestions...', type: 'progress', delay: 500 },
  { text: 'Applied prefix patterns (how, what, best, etc.)', type: 'success', delay: 300 },
  { text: 'Applied suffix patterns (near me, cost, reviews)', type: 'success', delay: 300 },
  { text: 'Generated question-based variations', type: 'success', delay: 350 },
  { text: 'Invoking AI for semantic expansions...', type: 'progress', delay: 500 },
  { text: 'AI generated 50+ contextual variations', type: 'success', delay: 400 },
  { text: 'Deduplicating and filtering results...', type: 'progress', delay: 350 },
  { text: 'Removed 23 duplicate entries', type: 'success', delay: 250 },
  { text: 'Ranking keywords by relevance...', type: 'progress', delay: 300 },
  { text: 'Long-tail keywords ready! Found 200+ variations.', type: 'success', delay: 200 },
];

export const NEGATIVE_KEYWORDS_MESSAGES: TerminalMessage[] = [
  { text: 'Initializing negative keyword analyzer...', type: 'progress', delay: 400 },
  { text: 'Connected to AI analysis engine', type: 'success', delay: 300 },
  { text: 'Analyzing target URL and business context...', type: 'progress', delay: 500 },
  { text: 'Identified business vertical: Service Provider', type: 'success', delay: 350 },
  { text: 'Extracting core service offerings...', type: 'progress', delay: 400 },
  { text: 'Found 8 primary services to protect', type: 'success', delay: 300 },
  { text: 'Generating irrelevant search terms...', type: 'progress', delay: 450 },
  { text: 'Added DIY/tutorial exclusions', type: 'success', delay: 280 },
  { text: 'Added job/career related exclusions', type: 'success', delay: 280 },
  { text: 'Added free/cheap intent exclusions', type: 'success', delay: 280 },
  { text: 'Added competitor brand exclusions', type: 'success', delay: 280 },
  { text: 'Processing category-based negatives...', type: 'progress', delay: 400 },
  { text: 'Generated 500+ negative keywords', type: 'success', delay: 350 },
  { text: 'Applying exact match formatting...', type: 'progress', delay: 300 },
  { text: 'Negative keywords ready! Protect your budget.', type: 'success', delay: 200 },
];

export const KEYWORD_MIXER_MESSAGES: TerminalMessage[] = [
  { text: 'Initializing keyword mixer engine...', type: 'progress', delay: 400 },
  { text: 'Mixer engine ready', type: 'success', delay: 300 },
  { text: 'Parsing keyword lists...', type: 'progress', delay: 350 },
  { text: 'List A: Parsed 12 keywords', type: 'success', delay: 250 },
  { text: 'List B: Parsed 8 keywords', type: 'success', delay: 250 },
  { text: 'List C: Parsed 5 keywords (optional)', type: 'success', delay: 250 },
  { text: 'Calculating all possible combinations...', type: 'progress', delay: 500 },
  { text: 'Generated 480 unique combinations', type: 'success', delay: 350 },
  { text: 'Applying match type formatting...', type: 'progress', delay: 400 },
  { text: 'Created broad match variations', type: 'success', delay: 280 },
  { text: 'Created phrase match variations', type: 'success', delay: 280 },
  { text: 'Created exact match variations', type: 'success', delay: 280 },
  { text: 'Validating keyword length limits...', type: 'progress', delay: 350 },
  { text: 'All keywords within 80 character limit', type: 'success', delay: 300 },
  { text: 'Keyword mixing complete! Ready to export.', type: 'success', delay: 200 },
];

export function TerminalProgressConsole({
  title,
  messages,
  isVisible,
  onComplete,
  nextButtonText = 'Next: View Results',
  onNextClick,
  minDuration = 4000,
}: TerminalProgressConsoleProps) {
  const [displayedMessages, setDisplayedMessages] = useState<{ text: string; timestamp: string; type: string }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isVisible) {
      setDisplayedMessages([]);
      setIsComplete(false);
      setCurrentIndex(0);
      return;
    }

    startTimeRef.current = Date.now();
    setDisplayedMessages([]);
    setIsComplete(false);
    setCurrentIndex(0);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || currentIndex >= messages.length) return;

    const message = messages[currentIndex];
    const delay = message.delay || 300;

    const timer = setTimeout(() => {
      setDisplayedMessages((prev) => [
        ...prev,
        {
          text: message.text,
          timestamp: formatTimestamp(),
          type: message.type,
        },
      ]);
      setCurrentIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, currentIndex, messages]);

  useEffect(() => {
    if (currentIndex >= messages.length && displayedMessages.length > 0) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minDuration - elapsed);

      const completeTimer = setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, remaining);

      return () => clearTimeout(completeTimer);
    }
  }, [currentIndex, messages.length, displayedMessages.length, minDuration, onComplete]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedMessages]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
            <span className="text-sm font-medium text-slate-200">{title}</span>
          </div>
          {isComplete ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-medium text-green-400">Complete</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span className="text-xs font-medium text-blue-400">Processing...</span>
            </div>
          )}
        </div>

        <div
          ref={containerRef}
          className="p-4 h-80 overflow-y-auto font-mono text-sm bg-slate-900 scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          {displayedMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 py-1 animate-fadeIn ${
                msg.type === 'success' ? 'text-green-400' : msg.type === 'info' ? 'text-blue-400' : 'text-slate-300'
              }`}
            >
              <span className="text-slate-500 shrink-0">{msg.timestamp}</span>
              <span className="shrink-0">
                {msg.type === 'success' ? '✓' : '>'}
              </span>
              <span>{msg.text}</span>
            </div>
          ))}
          {!isComplete && currentIndex < messages.length && (
            <div className="flex items-center gap-2 py-1 text-slate-400">
              <span className="text-slate-500">{formatTimestamp()}</span>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="animate-pulse">Processing...</span>
            </div>
          )}
        </div>

        {isComplete && onNextClick && (
          <div className="p-4 border-t border-slate-700 bg-slate-800">
            <Button
              onClick={onNextClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {nextButtonText}
              <span>→</span>
            </Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
