import { useState, useMemo, useEffect } from "react";

const COLORS: Record<string, string> = {
  organic: "#6366f1",
  paid: "#f59e0b",
  direct: "#10b981",
  referral: "#3b82f6",
  email: "#ec4899",
  social: "#8b5cf6",
  error: "#ef4444",
  exit: "#64748b",
  convert: "#10b981",
  bounce: "#f59e0b",
};

const EXIT_REASONS = ["Bounced", "Converted", "Idle Timeout", "Closed Tab", "Navigation Away"];
const DEVICES = ["Desktop", "Mobile", "Tablet"];

export interface JourneyStep {
  page: string;
  duration: number;
  isError: boolean;
  errorMsg: string | null;
  event: string;
}

export interface Journey {
  id: string;
  source: string;
  landingPage: string;
  steps: JourneyStep[];
  totalTime: number;
  device: string;
  country: string;
  converted: boolean;
  hasError: boolean;
  error: string | null;
  exitReason: string;
  pageCount: number;
  startTs: number;
}

function getSrcKey(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("google ads") || s.includes("cpc") || s.includes("paid")) return "paid";
  if (s.includes("google")) return "organic";
  if (s.includes("direct") || s === "") return "direct";
  if (s.includes("email") || s.includes("newsletter")) return "email";
  if (s.includes("reddit") || s.includes("linkedin") || s.includes("twitter") || s.includes("facebook") || s.includes("instagram") || s.includes("producthunt")) return "social";
  return "referral";
}

function FlowDiagram({ journeys }: { journeys: Journey[] }) {
  const flowData = useMemo(() => {
    const pageMap: Record<string, { visits: number; exits: number; errors: number; converts: number }> = {};
    journeys.forEach(j => {
      j.steps.forEach((step, idx) => {
        if (!pageMap[step.page]) pageMap[step.page] = { visits: 0, exits: 0, errors: 0, converts: 0 };
        pageMap[step.page].visits++;
        if (idx === j.steps.length - 1) {
          pageMap[step.page].exits++;
          if (j.hasError) pageMap[step.page].errors++;
          if (j.converted) pageMap[step.page].converts++;
        }
      });
    });
    return pageMap;
  }, [journeys]);

  const nodes = useMemo(() => {
    return Object.entries(flowData).sort((a, b) => b[1].visits - a[1].visits).slice(0, 8);
  }, [flowData]);

  const transitions = useMemo(() => {
    const t: Record<string, number> = {};
    journeys.forEach(j => {
      for (let i = 0; i < j.steps.length - 1; i++) {
        const key = `${j.steps[i].page}||${j.steps[i + 1].page}`;
        t[key] = (t[key] || 0) + 1;
      }
    });
    return t;
  }, [journeys]);

  const sourceBreakdown = useMemo(() => {
    const sb: Record<string, number> = {};
    journeys.forEach(j => { sb[j.source] = (sb[j.source] || 0) + 1; });
    return Object.entries(sb).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [journeys]);

  const pageNodes = nodes.map(([page, data], i) => {
    const cols = 4;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 60 + col * 200;
    const y = 60 + row * 130;
    return { page, data, x, y };
  });

  const nodeByPage: Record<string, typeof pageNodes[0]> = {};
  pageNodes.forEach(n => { nodeByPage[n.page] = n; });

  const edges = Object.entries(transitions)
    .map(([key, count]) => {
      const [from, to] = key.split("||");
      if (nodeByPage[from] && nodeByPage[to] && from !== to) return { from, to, count };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.count ?? 0) - (a?.count ?? 0))
    .slice(0, 12) as { from: string; to: string; count: number }[];

  const maxVisits = Math.max(...pageNodes.map(n => n.data.visits), 1);

  if (journeys.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#475569", fontSize: "13px" }}>
        No journey data for selected filters
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <svg width="100%" viewBox="0 0 860 310" style={{ overflow: "visible" }}>
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#334155" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const fn = nodeByPage[e.from];
          const tn = nodeByPage[e.to];
          if (!fn || !tn) return null;
          const x1 = fn.x + 80, y1 = fn.y + 28;
          const x2 = tn.x, y2 = tn.y + 28;
          const thickness = Math.max(1, Math.floor((e.count / journeys.length) * 18));
          const mx = (x1 + x2) / 2;
          return (
            <g key={i}>
              <path
                d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                fill="none"
                stroke="#334155"
                strokeWidth={thickness}
                strokeOpacity="0.5"
                markerEnd="url(#arrow)"
              />
              <text x={mx} y={(y1 + y2) / 2 - 4} textAnchor="middle" fontSize="9" fill="#64748b">{e.count}</text>
            </g>
          );
        })}

        {pageNodes.map((n, i) => {
          const w = 80 + (n.data.visits / maxVisits) * 30;
          const errorRate = n.data.errors / (n.data.exits || 1);
          const convertRate = n.data.converts / (n.data.exits || 1);
          const fill = errorRate > 0.3 ? "#1e1b2e" : convertRate > 0.2 ? "#0f1f14" : "#0f172a";
          const stroke = errorRate > 0.3 ? "#ef4444" : convertRate > 0.2 ? "#10b981" : "#334155";

          return (
            <g key={i} transform={`translate(${n.x},${n.y})`}>
              <rect width={w + 20} height={56} rx="8" fill={fill} stroke={stroke} strokeWidth="1.5" />
              <text x={(w + 20) / 2} y="16" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="500">
                {n.page.replace("/", "") || "home"}
              </text>
              <text x={(w + 20) / 2} y="32" textAnchor="middle" fontSize="14" fill="#f8fafc" fontWeight="700">
                {n.data.visits}
              </text>
              <text x={(w + 20) / 2} y="47" textAnchor="middle" fontSize="9" fill={errorRate > 0.2 ? "#ef4444" : "#64748b"}>
                {n.data.errors > 0 ? `⚠ ${n.data.errors} err` : n.data.converts > 0 ? `✓ ${n.data.converts} conv` : `${n.data.exits} exits`}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        {sourceBreakdown.map(([src, count]) => {
          const srcKey = getSrcKey(src);
          return (
            <div key={src} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "4px 10px", fontSize: "12px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS[srcKey] || "#64748b", display: "inline-block" }} />
              <span style={{ color: "#94a3b8" }}>{src}</span>
              <span style={{ color: "#f8fafc", fontWeight: "600" }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JourneyTimeline({ journey, onClose }: { journey: Journey; onClose: () => void }) {
  const totalTime = journey.totalTime;
  const srcKey = getSrcKey(journey.source);

  return (
    <div style={{ background: "#070d1a", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "12px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>{journey.id}</span>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: journey.converted ? "#052e16" : journey.hasError ? "#1e0a0a" : "#0c1a2e", color: journey.converted ? "#4ade80" : journey.hasError ? "#f87171" : "#7dd3fc", border: `1px solid ${journey.converted ? "#166534" : journey.hasError ? "#7f1d1d" : "#1e3a5f"}` }}>
              {journey.exitReason}
            </span>
            <span style={{ fontSize: "11px", color: "#64748b" }}>{journey.device} · {journey.country || "Unknown"}</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            <span style={{ color: COLORS[srcKey] || "#64748b", marginRight: "8px" }}>↗ {journey.source || "Direct"}</span>
            {new Date(journey.startTs).toLocaleString("en-IN")} · {Math.floor(totalTime / 60)}m {totalTime % 60}s total
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "18px", lineHeight: "1" }}>×</button>
      </div>

      <div style={{ position: "relative", paddingLeft: "16px" }}>
        <div style={{ position: "absolute", left: "7px", top: "8px", bottom: "8px", width: "1px", background: "linear-gradient(to bottom, #334155, transparent)" }} />

        {journey.steps.map((step, i) => {
          const isLast = i === journey.steps.length - 1;
          const dotColor = step.isError ? "#ef4444" : isLast && journey.converted ? "#4ade80" : "#334155";
          const pct = totalTime > 0 ? Math.round((step.duration / totalTime) * 100) : 0;

          return (
            <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "flex-start" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: dotColor, border: `2px solid ${dotColor}40`, flexShrink: 0, marginTop: "3px", zIndex: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: "500", fontFamily: "monospace" }}>{step.page || "/"}</span>
                    <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "3px", background: "#0f172a", color: step.event === "Landing" ? "#6366f1" : step.event === "Conversion" ? "#4ade80" : "#64748b", border: "1px solid #1e293b" }}>
                      {step.event}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#475569" }}>{step.duration}s · {pct}%</span>
                </div>
                <div style={{ height: "4px", background: "#0f172a", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: step.isError ? "#ef4444" : isLast && journey.converted ? "#4ade80" : "#334155", borderRadius: "2px", transition: "width 0.5s ease" }} />
                </div>
                {step.isError && (
                  <div style={{ marginTop: "6px", padding: "6px 10px", background: "#1e0a0a", border: "1px solid #7f1d1d", borderRadius: "6px", fontSize: "11px", color: "#fca5a5" }}>
                    ⚠ Error: {step.errorMsg}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#070d1a", border: "1px solid #1e293b", borderRadius: "10px", padding: "16px 18px" }}>
      <div style={{ fontSize: "12px", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: "700", color: color || "#f8fafc", lineHeight: "1" }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

interface UserJourneyDashboardProps {
  token: string;
}

export function UserJourneyDashboard({ token }: UserJourneyDashboardProps) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState("30d");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [landingFilter, setLandingFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [exitFilter, setExitFilter] = useState("all");
  const [errorFilter, setErrorFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [view, setView] = useState("flow");
  const [sortBy, setSortBy] = useState("time");

  const dateMs: Record<string, number> = { "7d": 7, "14d": 14, "30d": 30, "60d": 60, "90d": 90 };

  useEffect(() => {
    const days = dateMs[dateRange] || 30;
    setLoading(true);
    setError(null);
    fetch(`/api/superadmin/journeys?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setJourneys(data.journeys || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [dateRange, token]);

  const allSources = useMemo(() => Array.from(new Set(journeys.map(j => j.source).filter(Boolean))).sort(), [journeys]);
  const allLandingPages = useMemo(() => Array.from(new Set(journeys.map(j => j.landingPage).filter(Boolean))).sort(), [journeys]);
  const allExitReasons = useMemo(() => Array.from(new Set(journeys.map(j => j.exitReason).filter(Boolean))).sort(), [journeys]);

  const filtered = useMemo(() => {
    return journeys.filter(j => {
      if (sourceFilter !== "all" && j.source !== sourceFilter) return false;
      if (landingFilter !== "all" && j.landingPage !== landingFilter) return false;
      if (deviceFilter !== "all" && j.device.toLowerCase() !== deviceFilter.toLowerCase()) return false;
      if (exitFilter !== "all" && j.exitReason !== exitFilter) return false;
      if (errorFilter === "errors" && !j.hasError) return false;
      if (errorFilter === "clean" && j.hasError) return false;
      if (search && !j.id.toLowerCase().includes(search.toLowerCase()) && !j.source.toLowerCase().includes(search.toLowerCase()) && !(j.country || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "time") return b.startTs - a.startTs;
      if (sortBy === "duration") return b.totalTime - a.totalTime;
      if (sortBy === "pages") return b.pageCount - a.pageCount;
      return 0;
    });
  }, [journeys, sourceFilter, landingFilter, deviceFilter, exitFilter, errorFilter, search, sortBy]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const errors = filtered.filter(j => j.hasError).length;
    const converts = filtered.filter(j => j.converted).length;
    const avgTime = total ? Math.round(filtered.reduce((a, j) => a + j.totalTime, 0) / total) : 0;
    const avgPages = total ? (filtered.reduce((a, j) => a + j.pageCount, 0) / total).toFixed(1) : "0";
    const bounces = filtered.filter(j => j.pageCount === 1).length;
    return { total, errors, converts, avgTime, avgPages, bounces };
  }, [filtered]);

  const hasActiveFilters = sourceFilter !== "all" || landingFilter !== "all" || deviceFilter !== "all" || exitFilter !== "all" || errorFilter !== "all" || search;

  const selectStyle: React.CSSProperties = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "7px",
    color: "#cbd5e1",
    fontSize: "12px",
    padding: "6px 10px",
    cursor: "pointer",
    outline: "none",
  };

  return (
    <div style={{ background: "#030711", minHeight: "100vh", padding: "24px", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#f8fafc" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "22px", fontWeight: "700", color: "#f8fafc", marginBottom: "4px", letterSpacing: "-0.02em" }}>User Journey</div>
        <div style={{ fontSize: "13px", color: "#475569" }}>Track where users come from, what they do, and why they leave</div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", padding: "14px 16px", background: "#070d1a", border: "1px solid #1e293b", borderRadius: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569", marginRight: "4px" }}>
          <span>⚡ Filters</span>
        </div>

        <select value={dateRange} onChange={e => { setDateRange(e.target.value); setExpandedId(null); }} style={selectStyle}>
          <option value="7d">Last 7 days</option>
          <option value="14d">Last 14 days</option>
          <option value="30d">Last 30 days</option>
          <option value="60d">Last 60 days</option>
          <option value="90d">Last 90 days</option>
        </select>

        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Sources</option>
          {allSources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={landingFilter} onChange={e => setLandingFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Landing Pages</option>
          {allLandingPages.map(p => <option key={p} value={p}>{p || "/"}</option>)}
        </select>

        <select value={deviceFilter} onChange={e => setDeviceFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Devices</option>
          {DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={exitFilter} onChange={e => setExitFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Exit Reasons</option>
          {allExitReasons.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select value={errorFilter} onChange={e => setErrorFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Sessions</option>
          <option value="errors">With Errors Only</option>
          <option value="clean">No Errors</option>
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
          <option value="time">Sort: Recent First</option>
          <option value="duration">Sort: Longest Session</option>
          <option value="pages">Sort: Most Pages</option>
        </select>

        <input
          placeholder="Search session ID, source, country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, flex: 1, minWidth: "160px" }}
        />

        {hasActiveFilters && (
          <button
            onClick={() => { setSourceFilter("all"); setLandingFilter("all"); setDeviceFilter("all"); setExitFilter("all"); setErrorFilter("all"); setSearch(""); }}
            style={{ ...selectStyle, color: "#f87171", borderColor: "#7f1d1d" }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "24px" }}>
        <StatCard label="Sessions" value={stats.total} sub={`in last ${dateRange}`} />
        <StatCard label="Avg. Duration" value={`${Math.floor(stats.avgTime / 60)}m ${stats.avgTime % 60}s`} />
        <StatCard label="Avg. Pages" value={stats.avgPages} />
        <StatCard label="Conversions" value={stats.converts} sub={`${stats.total ? Math.round(stats.converts / stats.total * 100) : 0}% rate`} color="#4ade80" />
        <StatCard label="With Errors" value={stats.errors} sub={`${stats.total ? Math.round(stats.errors / stats.total * 100) : 0}% rate`} color={stats.errors > 5 ? "#f87171" : "#f8fafc"} />
        <StatCard label="Bounced" value={stats.bounces} sub={`${stats.total ? Math.round(stats.bounces / stats.total * 100) : 0}% bounce rate`} color="#fbbf24" />
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px", color: "#475569", fontSize: "14px" }}>
          <div style={{ marginBottom: "8px", fontSize: "24px" }}>⟳</div>
          Loading journey data...
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: "20px", background: "#1e0a0a", border: "1px solid #7f1d1d", borderRadius: "10px", color: "#fca5a5", fontSize: "13px", marginBottom: "20px" }}>
          ⚠ Failed to load journeys: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* View Toggle */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "#070d1a", border: "1px solid #1e293b", borderRadius: "8px", padding: "4px", width: "fit-content" }}>
            {([["flow", "Flow Map"], ["list", "Journey List"]] as [string, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.15s", background: view === v ? "#1e293b" : "transparent", color: view === v ? "#f8fafc" : "#475569" }}>
                {l}
              </button>
            ))}
          </div>

          {view === "flow" && (
            <div style={{ background: "#070d1a", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", color: "#475569", marginBottom: "16px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <span>Page flow — node size = visit volume · edge thickness = transition volume</span>
                <span style={{ display: "flex", gap: "12px" }}>
                  <span style={{ color: "#4ade80" }}>■ converted</span>
                  <span style={{ color: "#f87171" }}>■ error exit</span>
                  <span style={{ color: "#334155" }}>■ normal</span>
                </span>
              </div>
              <FlowDiagram journeys={filtered} />
            </div>
          )}

          {view === "list" && (
            <div>
              <div style={{ fontSize: "12px", color: "#475569", marginBottom: "12px" }}>{filtered.length} sessions matched</div>

              {filtered.slice(0, 50).map(journey => {
                const isExpanded = expandedId === journey.id;
                const srcKey = getSrcKey(journey.source);

                if (isExpanded) return <JourneyTimeline key={journey.id} journey={journey} onClose={() => setExpandedId(null)} />;

                return (
                  <div
                    key={journey.id}
                    onClick={() => setExpandedId(journey.id)}
                    style={{ background: "#070d1a", border: `1px solid ${journey.hasError ? "#7f1d1d" : journey.converted ? "#166534" : "#1e293b"}`, borderRadius: "10px", padding: "12px 16px", marginBottom: "8px", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "12px" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#0f172a")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#070d1a")}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: journey.converted ? "#052e16" : journey.hasError ? "#1e0a0a" : "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", border: `1px solid ${journey.converted ? "#166534" : journey.hasError ? "#7f1d1d" : "#1e293b"}`, flexShrink: 0 }}>
                      {journey.converted ? "✓" : journey.hasError ? "⚠" : "→"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>{journey.id}</span>
                        <span style={{ fontSize: "11px", color: COLORS[srcKey] || "#64748b" }}>{journey.source || "Direct"}</span>
                        <span style={{ fontSize: "11px", color: "#334155" }}>·</span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>{journey.device}</span>
                        {journey.country && <span style={{ fontSize: "11px", color: "#334155" }}>· {journey.country}</span>}
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", overflow: "hidden" }}>
                        {journey.steps.map((s, i) => (
                          <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                            <span style={{ fontSize: "11px", color: s.isError ? "#f87171" : i === 0 ? "#818cf8" : "#475569", fontFamily: "monospace" }}>{s.page || "/"}</span>
                            {i < journey.steps.length - 1 && <span style={{ color: "#1e293b", fontSize: "10px" }}>›</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "2px" }}>{Math.floor(journey.totalTime / 60)}m {journey.totalTime % 60}s</div>
                      <div style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "4px", background: journey.converted ? "#052e16" : journey.hasError ? "#1e0a0a" : "#0f172a", color: journey.converted ? "#4ade80" : journey.hasError ? "#f87171" : "#94a3b8", border: `1px solid ${journey.converted ? "#166534" : journey.hasError ? "#7f1d1d" : "#1e293b"}` }}>
                        {journey.exitReason}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length > 50 && (
                <div style={{ textAlign: "center", padding: "16px", color: "#475569", fontSize: "13px" }}>
                  Showing 50 of {filtered.length} sessions
                </div>
              )}

              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "#475569", fontSize: "13px" }}>
                  No sessions matched the selected filters
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
