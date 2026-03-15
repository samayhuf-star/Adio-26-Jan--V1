import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Shield, Search, Globe, Zap, TrendingUp, Layers,
  MapPin, Filter, Sparkles, Smartphone, Users, Clock, Rocket,
  Check, Activity, Lock, BarChart3, Eye
} from 'lucide-react';

type Theme = 'dark-emerald' | 'light' | 'dark-amber';

interface Props {
  theme?: Theme;
}

const TABS = [
  { id: 'campaign', label: 'Campaign Builder', icon: Target },
  { id: 'clickguard', label: 'Click Guard', icon: Shield },
  { id: 'keywords', label: 'Keyword Planner', icon: Search },
  { id: 'domains', label: 'Domain Monitor', icon: Globe },
];

function CampaignBuilderDemo({ theme }: { theme: Theme }) {
  const accent = theme === 'light' ? 'violet' : theme === 'dark-amber' ? 'amber' : 'emerald';
  const structures = [
    { name: 'SKAG', desc: 'Single Keyword Ad Groups', icon: Zap },
    { name: 'STAG', desc: 'Single Theme Ad Groups', icon: TrendingUp },
    { name: 'Intent-Based', desc: 'Search intent clustering', icon: Target },
    { name: 'Alpha-Beta', desc: 'Broad & exact split', icon: Layers },
    { name: 'Geo-Targeted', desc: '30K+ ZIP locations', icon: MapPin },
    { name: 'Funnel-Based', desc: 'Awareness to conversion', icon: Filter },
    { name: 'Brand Split', desc: 'Brand vs non-brand', icon: Sparkles },
    { name: 'Device-Split', desc: 'Mobile, desktop, tablet', icon: Smartphone },
    { name: 'Audience-Based', desc: 'Demographic targeting', icon: Users },
    { name: 'Long-Tail Master', desc: 'Low-competition KWs', icon: Search },
    { name: 'Seasonal Sprint', desc: 'Time-sensitive ads', icon: Clock },
    { name: 'Performance Max', desc: 'AI-optimized reach', icon: Rocket },
  ];

  const colors: Record<string, { text: string; bg: string; border: string }> = {
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    violet: { text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    amber: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  };
  const c = colors[accent];
  const isDark = theme !== 'light';

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between px-1 mb-1`}>
        <div>
          <p className={`text-xs font-semibold ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Step 2 of 7 — Choose Campaign Structure</p>
          <div className={`flex gap-1 mt-1`}>
            {[1,2,3,4,5,6,7].map(n => (
              <div key={n} className={`h-1 w-6 rounded-full ${n <= 2 ? (accent === 'emerald' ? 'bg-emerald-500' : accent === 'amber' ? 'bg-amber-500' : 'bg-violet-500') : isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-500'}`}>13 structures</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {structures.slice(0, 6).map((s, i) => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
              i === 0
                ? accent === 'emerald' ? 'bg-emerald-500/15 border-emerald-500/50' : accent === 'amber' ? 'bg-amber-500/15 border-amber-500/50' : 'bg-violet-100 border-violet-300'
                : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              i === 0 ? (accent === 'emerald' ? 'bg-emerald-500/30' : accent === 'amber' ? 'bg-amber-500/30' : 'bg-violet-200') : isDark ? 'bg-white/10' : 'bg-slate-100'
            }`}>
              <s.icon className={`w-3.5 h-3.5 ${i === 0 ? c.text : isDark ? 'text-white/50' : 'text-slate-400'}`} />
            </div>
            <div className="min-w-0">
              <div className={`text-xs font-bold truncate ${i === 0 ? c.text : isDark ? 'text-white/80' : 'text-slate-700'}`}>{s.name}</div>
              <div className={`text-[10px] truncate ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{s.desc}</div>
            </div>
            {i === 0 && <Check className={`w-3.5 h-3.5 flex-shrink-0 ml-auto ${c.text}`} />}
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${isDark ? 'bg-white/5 text-white/60' : 'bg-slate-50 text-slate-500'} border ${isDark ? 'border-white/10' : 'border-slate-200'}`}
      >
        <Sparkles className={`w-3.5 h-3.5 flex-shrink-0 ${c.text}`} />
        AI will generate <strong className={isDark ? 'text-white' : 'text-slate-800'}>1,600+ keywords</strong> + RSA, DKI & Call-Only ads for SKAG structure
      </motion.div>
    </div>
  );
}

function ClickGuardDemo({ theme }: { theme: Theme }) {
  const isDark = theme !== 'light';
  const rows = [
    { ip: '185.220.101.47', country: '🇷🇺 RU', clicks: 47, score: 94, status: 'Blocked' },
    { ip: '45.83.64.12',    country: '🇨🇳 CN', clicks: 31, score: 88, status: 'Blocked' },
    { ip: '77.88.55.60',    country: '🇧🇷 BR', clicks: 29, score: 76, status: 'Flagged' },
    { ip: '103.21.244.0',   country: '🇩🇪 DE', clicks: 12, score: 41, status: 'Allowed' },
    { ip: '198.51.100.22',  country: '🇺🇸 US', clicks: 3,  score: 9,  status: 'Allowed' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-1">
        {[
          { label: 'Blocked Today', value: '1,284', color: 'red' },
          { label: 'Flagged', value: '347', color: 'amber' },
          { label: 'Clean', value: '8,921', color: 'green' },
        ].map(stat => (
          <div key={stat.label} className={`flex-1 rounded-xl p-2.5 text-center ${
            isDark
              ? stat.color === 'red' ? 'bg-red-500/10 border border-red-500/20' : stat.color === 'amber' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-green-500/10 border border-green-500/20'
              : stat.color === 'red' ? 'bg-red-50 border border-red-100' : stat.color === 'amber' ? 'bg-amber-50 border border-amber-100' : 'bg-green-50 border border-green-100'
          }`}>
            <div className={`text-sm font-black ${stat.color === 'red' ? 'text-red-400' : stat.color === 'amber' ? 'text-amber-400' : 'text-green-400'}`}>{stat.value}</div>
            <div className={`text-[9px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div className={`grid grid-cols-5 text-[9px] font-bold uppercase tracking-wide px-2 pb-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
        <span className="col-span-2">IP Address</span>
        <span className="text-center">Clicks</span>
        <span className="text-center">Bot Score</span>
        <span className="text-right">Status</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <motion.div key={row.ip} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className={`grid grid-cols-5 items-center px-2 py-2 rounded-lg ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}
          >
            <div className="col-span-2">
              <div className={`text-[10px] font-mono ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{row.ip}</div>
              <div className={`text-[9px] ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{row.country}</div>
            </div>
            <div className={`text-center text-[10px] font-bold ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{row.clicks}</div>
            <div className="text-center">
              <span className={`text-[10px] font-black ${row.score >= 75 ? 'text-red-400' : row.score >= 50 ? 'text-amber-400' : 'text-green-400'}`}>{row.score}</span>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                row.status === 'Blocked' ? 'bg-red-500/20 text-red-400' :
                row.status === 'Flagged' ? 'bg-amber-500/20 text-amber-400' :
                isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
              }`}>{row.status}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        Live monitoring · Refreshing in 7s · 40+ bot detection signals
      </div>
    </div>
  );
}

function KeywordPlannerDemo({ theme }: { theme: Theme }) {
  const isDark = theme !== 'light';
  const accent = theme === 'light' ? 'violet' : theme === 'dark-amber' ? 'amber' : 'emerald';
  const keywords = [
    { kw: 'plumber near me',          vol: '40.5K', cpc: '$12.40', comp: 'High',   match: 'Exact' },
    { kw: 'emergency plumber',        vol: '22.1K', cpc: '$18.70', comp: 'High',   match: 'Phrase' },
    { kw: 'drain cleaning service',   vol: '9.8K',  cpc: '$8.20',  comp: 'Med',    match: 'Exact' },
    { kw: 'water heater repair',      vol: '6.3K',  cpc: '$14.50', comp: 'Med',    match: 'Phrase' },
    { kw: 'plumbing company',         vol: '5.1K',  cpc: '$9.80',  comp: 'Low',    match: 'Broad' },
    { kw: 'local plumber reviews',    vol: '3.2K',  cpc: '$5.40',  comp: 'Low',    match: 'Exact' },
  ];
  const accentColor = accent === 'emerald' ? 'text-emerald-400' : accent === 'amber' ? 'text-amber-400' : 'text-violet-500';
  const tagColor = accent === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' : accent === 'amber' ? 'bg-amber-500/15 text-amber-400' : 'bg-violet-100 text-violet-600';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono ${isDark ? 'bg-white/5 border border-white/10 text-white/70' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
          plumber {'{city}'}
        </div>
        <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${accent === 'emerald' ? 'bg-emerald-500 text-white' : accent === 'amber' ? 'bg-amber-500 text-black' : 'bg-violet-600 text-white'}`}>
          Generate
        </div>
      </div>
      <div className={`grid grid-cols-4 text-[9px] font-bold uppercase tracking-wide px-2 pb-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
        <span className="col-span-2">Keyword</span>
        <span className="text-center">Vol / CPC</span>
        <span className="text-right">Match</span>
      </div>
      <div className="space-y-1.5">
        {keywords.map((k, i) => (
          <motion.div key={k.kw} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className={`grid grid-cols-4 items-center px-2 py-2 rounded-lg ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}
          >
            <div className={`col-span-2 text-[10px] font-medium truncate pr-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{k.kw}</div>
            <div className="text-center">
              <div className={`text-[10px] font-bold ${accentColor}`}>{k.vol}</div>
              <div className={`text-[9px] ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{k.cpc}</div>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tagColor}`}>{k.match}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className={`text-[10px] font-semibold ${accentColor}`}>✓ 1,600+ keywords generated with all match types</div>
    </div>
  );
}

function DomainMonitorDemo({ theme }: { theme: Theme }) {
  const isDark = theme !== 'light';
  const domains = [
    { name: 'mystore.com',     ssl: 'Valid',    sslDays: 82,  expiry: '210 days', dns: 'OK',    status: 'Healthy' },
    { name: 'clientsite.io',   ssl: 'Expiring', sslDays: 12,  expiry: '44 days',  dns: 'OK',    status: 'Warning' },
    { name: 'agencysite.co',   ssl: 'Valid',    sslDays: 165, expiry: '310 days', dns: 'OK',    status: 'Healthy' },
    { name: 'promopage.net',   ssl: 'Expired',  sslDays: 0,   expiry: '6 days',   dns: 'Alert', status: 'Critical' },
  ];

  return (
    <div className="space-y-2.5">
      {domains.map((d, i) => (
        <motion.div key={d.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
          className={`rounded-xl border p-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.status === 'Healthy' ? 'bg-green-400' : d.status === 'Warning' ? 'bg-amber-400 animate-pulse' : 'bg-red-400 animate-pulse'}`} />
              <span className={`text-xs font-semibold ${isDark ? 'text-white/80' : 'text-slate-800'}`}>{d.name}</span>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              d.status === 'Healthy' ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700' :
              d.status === 'Warning' ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700' :
              isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
            }`}>{d.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'SSL', value: d.ssl, extra: d.sslDays > 0 ? `${d.sslDays}d left` : 'Expired', warn: d.ssl !== 'Valid' },
              { label: 'Domain', value: d.expiry, extra: 'Expiry', warn: parseInt(d.expiry) < 30 },
              { label: 'DNS', value: d.dns, extra: 'Records', warn: d.dns !== 'OK' },
            ].map(cell => (
              <div key={cell.label} className={`text-center p-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white border border-slate-100'}`}>
                <div className={`text-[10px] font-bold ${cell.warn ? 'text-red-400' : isDark ? 'text-white/80' : 'text-slate-700'}`}>{cell.value}</div>
                <div className={`text-[9px] ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{cell.extra}</div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function LTDProductDemo({ theme = 'dark-emerald' }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const isDark = theme !== 'light';
  const accent = theme === 'light' ? 'violet' : theme === 'dark-amber' ? 'amber' : 'emerald';

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prev => (prev + 1) % TABS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const tabActive = accent === 'emerald'
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    : accent === 'amber'
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    : 'bg-violet-100 text-violet-700 border-violet-300';

  const tabInactive = isDark
    ? 'text-white/40 hover:text-white/60 border-transparent hover:border-white/10'
    : 'text-slate-400 hover:text-slate-600 border-transparent hover:border-slate-200';

  return (
    <div className={`rounded-2xl overflow-hidden border shadow-2xl ${isDark ? 'bg-[#0f1117] border-white/10' : 'bg-white border-slate-200'}`}>
      {/* Browser chrome */}
      <div className={`px-4 py-3 border-b flex items-center gap-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-amber-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
        </div>
        <div className={`flex-1 text-center text-xs font-mono px-3 py-1 rounded-lg ${isDark ? 'bg-white/5 text-white/40' : 'bg-white border border-slate-200 text-slate-400'}`}>
          app.adiology.io
        </div>
        <div className={`w-2 h-2 rounded-full ${accent === 'emerald' ? 'bg-emerald-400' : accent === 'amber' ? 'bg-amber-400' : 'bg-violet-500'} animate-pulse`} />
      </div>

      {/* Tab bar */}
      <div className={`flex overflow-x-auto px-3 pt-2 gap-1 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === i ? tabActive : tabInactive}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 min-h-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 0 && <CampaignBuilderDemo theme={theme} />}
            {activeTab === 1 && <ClickGuardDemo theme={theme} />}
            {activeTab === 2 && <KeywordPlannerDemo theme={theme} />}
            {activeTab === 3 && <DomainMonitorDemo theme={theme} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className={`flex items-center justify-center gap-1.5 pb-3`}>
        {TABS.map((_, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`rounded-full transition-all ${i === activeTab
              ? `w-5 h-1.5 ${accent === 'emerald' ? 'bg-emerald-400' : accent === 'amber' ? 'bg-amber-400' : 'bg-violet-500'}`
              : `w-1.5 h-1.5 ${isDark ? 'bg-white/20' : 'bg-slate-300'}`}`}
          />
        ))}
      </div>
    </div>
  );
}
