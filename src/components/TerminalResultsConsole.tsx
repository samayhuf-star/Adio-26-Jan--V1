import { useState, useEffect } from 'react';
import { Download, Save, RefreshCw, ArrowLeft, Check, Copy, Plus } from 'lucide-react';
import { Button } from './ui/button';

export interface ResultStat {
  label: string;
  value: string | number;
  color?: 'green' | 'cyan' | 'yellow' | 'purple' | 'white';
}

interface TerminalResultsConsoleProps {
  title: string;
  isVisible: boolean;
  stats: ResultStat[];
  onDownloadCSV?: () => void;
  onSave?: () => void;
  onGenerateAnother?: () => void;
  onCopy?: () => void;
  onAppendMore?: () => void;
  showDownload?: boolean;
  showSave?: boolean;
  showCopy?: boolean;
  showAppendMore?: boolean;
  downloadButtonText?: string;
  saveButtonText?: string;
  copyButtonText?: string;
  appendMoreButtonText?: string;
  isSaving?: boolean;
}

const formatTimestamp = (): string => {
  const now = new Date();
  return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
};

const getColorClass = (color?: string): string => {
  switch (color) {
    case 'green': return 'text-green-400';
    case 'cyan': return 'text-cyan-400';
    case 'yellow': return 'text-yellow-400';
    case 'purple': return 'text-purple-400';
    default: return 'text-white';
  }
};

export function TerminalResultsConsole({
  title,
  isVisible,
  stats,
  onDownloadCSV,
  onSave,
  onGenerateAnother,
  onCopy,
  onAppendMore,
  showDownload = true,
  showSave = true,
  showCopy = false,
  showAppendMore = false,
  downloadButtonText = 'Download CSV for Google Ads',
  saveButtonText = 'Save to Saved Lists',
  copyButtonText = 'Copy Keywords',
  appendMoreButtonText = 'Append More',
  isSaving = false,
}: TerminalResultsConsoleProps) {
  const [displayedStats, setDisplayedStats] = useState<{ stat: ResultStat; timestamp: string }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setDisplayedStats([]);
      setIsComplete(false);
      setCurrentIndex(0);
      return;
    }

    setDisplayedStats([]);
    setIsComplete(false);
    setCurrentIndex(0);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || currentIndex >= stats.length) return;

    const timer = setTimeout(() => {
      setDisplayedStats((prev) => [
        ...prev,
        {
          stat: stats[currentIndex],
          timestamp: formatTimestamp(),
        },
      ]);
      setCurrentIndex((prev) => prev + 1);
    }, 150);

    return () => clearTimeout(timer);
  }, [isVisible, currentIndex, stats]);

  useEffect(() => {
    if (currentIndex >= stats.length && displayedStats.length > 0) {
      const completeTimer = setTimeout(() => {
        setIsComplete(true);
      }, 300);
      return () => clearTimeout(completeTimer);
    }
  }, [currentIndex, stats.length, displayedStats.length]);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
          <span className="text-sm font-medium text-slate-200">{title}</span>
        </div>
        {isComplete && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium text-green-400">Ready to Export</span>
          </div>
        )}
      </div>

      <div className="p-4 font-mono text-sm bg-slate-900 min-h-[180px]">
        {displayedStats.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 py-0.5 animate-fadeIn ${getColorClass(item.stat.color)}`}
          >
            <span className="text-slate-500 shrink-0">{item.timestamp}</span>
            <span className="shrink-0 text-slate-400">→</span>
            <span className="text-slate-300">{item.stat.label}:</span>
            <span className={getColorClass(item.stat.color)}>{item.stat.value}</span>
          </div>
        ))}
        
        {isComplete && (
          <>
            <div className="flex items-start gap-2 py-0.5 text-green-400 animate-fadeIn">
              <span className="text-slate-500 shrink-0">{formatTimestamp()}</span>
              <span className="shrink-0">✓</span>
              <span>Generation complete! Ready for export.</span>
            </div>
            <div className="flex items-start gap-2 py-0.5 text-slate-400 animate-fadeIn">
              <span className="text-slate-500 shrink-0">{formatTimestamp()}</span>
              <span className="shrink-0">{'>'}</span>
              <span>Awaiting export command...</span>
            </div>
          </>
        )}
      </div>

      {isComplete && (
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex flex-wrap gap-3">
          {showDownload && onDownloadCSV && (
            <Button
              onClick={onDownloadCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {downloadButtonText}
            </Button>
          )}
          {showSave && onSave && (
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : saveButtonText}
            </Button>
          )}
          {showCopy && onCopy && (
            <Button
              onClick={handleCopy}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : copyButtonText}
            </Button>
          )}
          {showAppendMore && onAppendMore && (
            <Button
              onClick={onAppendMore}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {appendMoreButtonText}
            </Button>
          )}
          {onGenerateAnother && (
            <Button
              onClick={onGenerateAnother}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 font-medium px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Generate Another
            </Button>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
