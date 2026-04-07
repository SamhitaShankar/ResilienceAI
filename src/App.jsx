import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ComposedChart, Line, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart,
} from "recharts";

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────────── */
const T = {
  bg:        "#0A0D11",
  bgPanel:   "#0F1318",
  bgCard:    "#141820",
  bgCardHi:  "#1A2030",
  bgInput:   "#0D1117",
  border:    "rgba(255,255,255,0.06)",
  borderHi:  "rgba(255,255,255,0.12)",
  borderAcc: "rgba(0,229,255,0.25)",
  cyan:      "#00E5FF",
  cyanDim:   "#00B8D4",
  cyanGlow:  "rgba(0,229,255,0.15)",
  purple:    "#B388FF",
  purpleDim: "#7C4DFF",
  amber:     "#FFD54F",
  amberDim:  "#FF8F00",
  red:       "#FF5252",
  redDim:    "#C62828",
  green:     "#69FF47",
  greenDim:  "#2E7D32",
  text:      "#E8ECF0",
  textMuted: "#6B7A8D",
  textDim:   "#3D4A5C",
};

const F = {
  mono:    "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  display: "'Space Grotesk', 'DM Sans', sans-serif",
  body:    "'Inter', 'DM Sans', sans-serif",
};

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; height: 100%; min-height: 100vh; background: ${T.bg}; color: ${T.text}; }
  body { margin: 0 !important; padding: 0 !important; overflow: hidden; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${T.bgPanel}; }
  ::-webkit-scrollbar-thumb { background: ${T.textDim}; border-radius: 2px; }
  input::placeholder { color: ${T.textDim}; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.3)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideR { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(0,229,255,0)} 50%{box-shadow:0 0 16px 4px rgba(0,229,255,0.2)} }
  @keyframes scan { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
  @keyframes critPulse { 0%,100%{background:rgba(255,82,82,0.05)} 50%{background:rgba(255,82,82,0.12)} }
  .fade-up { animation: fadeUp .35s ease both; }
  .slide-r { animation: slideR .25s ease both; }
`;

/* ─── UTILITY COMPONENTS ─────────────────────────────────────────────────────── */
const Badge = ({ children, color = T.cyan, dim }) => (
  <span style={{
    fontFamily: F.mono, fontSize: 9, fontWeight: 600,
    letterSpacing: 1.5, textTransform: "uppercase",
    color, background: `${color}18`,
    border: `0.5px solid ${color}40`,
    padding: "3px 8px", borderRadius: 3,
    display: "inline-flex", alignItems: "center", gap: 4,
  }}>{children}</span>
);

const StatusDot = ({ color, pulse }) => (
  <span style={{
    display: "inline-block", width: 7, height: 7,
    borderRadius: "50%", background: color, flexShrink: 0,
    boxShadow: `0 0 6px ${color}`,
    animation: pulse ? "pulse 2s ease-in-out infinite" : "none",
  }}/>
);

const Panel = ({ children, style: sx = {}, glow }) => (
  <div style={{
    background: T.bgCard,
    border: `1px solid ${glow ? T.borderAcc : T.border}`,
    borderRadius: 12,
    padding: "20px 22px",
    boxShadow: glow ? `0 0 24px ${T.cyanGlow}, inset 0 0 24px rgba(0,229,255,0.02)` : "none",
    ...sx,
  }}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", style: sx = {}, disabled }) => {
  const styles = {
    primary: {
      background: `linear-gradient(135deg, ${T.cyan}22, ${T.cyanDim}11)`,
      color: T.cyan, border: `1px solid ${T.cyan}50`,
      boxShadow: disabled ? "none" : `0 0 12px ${T.cyanGlow}`,
    },
    ghost: {
      background: "transparent", color: T.textMuted,
      border: `1px solid ${T.border}`,
    },
    danger: {
      background: `${T.red}15`, color: T.red,
      border: `1px solid ${T.red}40`,
    },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      fontFamily: F.mono, fontSize: 11, fontWeight: 600,
      letterSpacing: 1, textTransform: "uppercase",
      cursor: disabled ? "not-allowed" : "pointer",
      borderRadius: 8, padding: "9px 18px",
      display: "inline-flex", alignItems: "center", gap: 6,
      transition: "all .2s", opacity: disabled ? .4 : 1,
      ...styles[variant], ...sx,
    }}>{children}</button>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{
    fontFamily: F.mono, fontSize: 9, fontWeight: 600,
    letterSpacing: 2.5, textTransform: "uppercase",
    color: T.textDim, marginBottom: 12,
    display: "flex", alignItems: "center", gap: 8,
  }}>
    <span style={{ width: 16, height: 1, background: T.textDim, display: "inline-block" }}/>
    {children}
    <span style={{ flex: 1, height: 1, background: T.border, display: "inline-block" }}/>
  </div>
);

const MetricCard = ({ label, value, sub, icon, accent = T.cyan, onClick, loading }) => (
  <div onClick={onClick} style={{
    background: T.bgCard, border: `1px solid ${T.border}`,
    borderTop: `2px solid ${accent}`,
    borderRadius: 10, padding: "16px 18px",
    cursor: onClick ? "pointer" : "default",
    transition: "all .2s", animation: "fadeUp .4s ease",
  }}
    onMouseOver={e => onClick && (e.currentTarget.style.borderColor = accent)}
    onMouseOut={e => onClick && (e.currentTarget.style.borderColor = T.border)}
  >
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      {loading && <StatusDot color={T.amber} pulse/>}
    </div>
    {loading
      ? <div style={{ height: 28, background: T.bgCardHi, borderRadius: 4, animation: "pulse 1s infinite" }}/>
      : <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.text, marginBottom: 4 }}>{value}</div>
    }
    <div style={{ fontFamily: F.body, fontSize: 11, color: T.textMuted }}>{label}</div>
    {sub && <div style={{ fontFamily: F.mono, fontSize: 9, color: accent, marginTop: 3, letterSpacing: .5 }}>{sub}</div>}
  </div>
);

function Spinner({ label = "Loading…", small }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 5000); return () => clearTimeout(t); }, []);
  const sz = small ? 14 : 24;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: small ? 0 : 24 }}>
      <div style={{ width: sz, height: sz, border: `2px solid ${T.border}`, borderTopColor: T.cyan, borderRadius: "50%", animation: "spin .7s linear infinite" }}/>
      {!small && <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMuted, letterSpacing: 1 }}>{label}</div>}
      {!small && slow && (
        <div style={{ fontFamily: F.body, fontSize: 12, color: T.amber, background: `${T.amber}12`, border: `1px solid ${T.amber}30`, borderRadius: 8, padding: "8px 14px", textAlign: "center", maxWidth: 280 }}>
          Server warming up (~15–30s)…
        </div>
      )}
    </div>
  );
}

function ErrBox({ msg, onRetry }) {
  return (
    <div style={{ background: `${T.red}0D`, border: `1px solid ${T.red}30`, borderRadius: 8, padding: "10px 14px", fontFamily: F.mono, fontSize: 11, color: T.red, display: "flex", alignItems: "center", gap: 10 }}>
      <span>⚠ {msg}</span>
      {onRetry && <button onClick={onRetry} style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 11, color: T.red, background: "transparent", border: `1px solid ${T.red}40`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Retry</button>}
    </div>
  );
}

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.bgCardHi, border: `1px solid ${T.borderHi}`, borderRadius: 8, padding: "10px 14px", fontFamily: F.mono }}>
      <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, letterSpacing: 1 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ fontSize: 12, color: p.color || T.cyan, fontWeight: 600 }}>{p.name}: {typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}</div>)}
    </div>
  );
};

/* ─── API ───────────────────────────────────────────────────────────────────── */
const API_BASE = "https://lavsam0104--supply-chain-ml-api-fastapi-app.modal.run";
async function callAPI(endpoint, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && String(v) !== "") qs.set(k, String(v)); });
  const url = `${API_BASE}${endpoint}${Object.keys(params).length ? "?" + qs.toString() : ""}`;
  const res = await fetch(url);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `API error ${res.status}`); }
  return res.json();
}

/* ─── CONSTANTS ─────────────────────────────────────────────────────────────── */
const ALL_CITIES = ["Mumbai","Delhi","Chennai","Kolkata","Bangalore","Ahmedabad","Hyderabad","Jaipur","Lucknow","Pune"];
const NEAREST_HUB = { Chennai:"Bangalore", Kolkata:"Hyderabad", Ahmedabad:"Mumbai", Jaipur:"Delhi", Lucknow:"Delhi", Hyderabad:"Chennai", Pune:"Mumbai", Bangalore:"Chennai", Mumbai:"Delhi", Delhi:"Mumbai" };
const REAL_SKUS = [
  { warehouse:"Chennai",   productId:"PROD_001", daily:12 },
  { warehouse:"Mumbai",    productId:"PROD_002", daily:8  },
  { warehouse:"Ahmedabad", productId:"PROD_003", daily:25 },
  { warehouse:"Pune",      productId:"PROD_002", daily:4  },
  { warehouse:"Kolkata",   productId:"PROD_003", daily:80 },
  { warehouse:"Delhi",     productId:"PROD_001", daily:18 },
  { warehouse:"Bangalore", productId:"PROD_002", daily:10 },
  { warehouse:"Jaipur",    productId:"PROD_003", daily:30 },
  { warehouse:"Lucknow",   productId:"PROD_001", daily:15 },
  { warehouse:"Hyderabad", productId:"PROD_002", daily:6  },
];
const UNIT_PRICES = { "PROD_001": 4500, "PROD_002": 12000, "PROD_003": 800 };
const MARGIN = 0.28;

function calcDisruptionScore(delayProb, inventoryAnomalyScore, daysToStockout, routeAnomalyFlag) {
  const delayNorm = Math.min(100, delayProb || 0);
  const invNorm   = inventoryAnomalyScore < 0 ? Math.min(100, Math.abs(inventoryAnomalyScore) * 200) : 0;
  const stockNorm = daysToStockout != null ? Math.max(0, 100 - (daysToStockout / 30) * 100) : 0;
  const routeNorm = routeAnomalyFlag ? 100 : 0;
  return Math.round(0.35 * delayNorm + 0.25 * invNorm + 0.25 * stockNorm + 0.15 * routeNorm);
}
function calcRevenueAtRisk(daysToStockout, dailySales, productId) {
  const days = daysToStockout ?? 30;
  const unitP = UNIT_PRICES[productId] || 4500;
  const exposedDays = Math.max(0, 30 - days);
  return Math.round(exposedDays * dailySales * unitP * MARGIN);
}

/* ─── MOCK SIGNALS ───────────────────────────────────────────────────────────── */
const MOCK_SIGNALS = [
  { id:1, type:"weather", city:"Chennai",   title:"Cyclone Warning",  desc:"Cyclone approaching Tamil Nadu coast — port ops suspended", severity:"critical", time:"10m ago", icon:"🌀" },
  { id:2, type:"port",    city:"Mumbai",    title:"Port Congestion",   desc:"JNPT Gate 4 backlog — 48hr delay in cargo clearance",         severity:"high",     time:"1h ago",  icon:"⚓" },
  { id:3, type:"news",    city:"Kolkata",   title:"Labour Strike",     desc:"Haldia Dock workers strike — 3 day disruption expected",      severity:"high",     time:"3h ago",  icon:"📰" },
  { id:4, type:"weather", city:"Delhi",     title:"Dense Fog",         desc:"Visibility below 50m on NH-44 — trucks rerouted",             severity:"medium",   time:"5h ago",  icon:"🌫" },
  { id:5, type:"port",    city:"Bangalore", title:"Road Closure",      desc:"NICE Road maintenance — alternate via Hosur Rd",              severity:"medium",   time:"8h ago",  icon:"🚧" },
  { id:6, type:"news",    city:"Hyderabad", title:"Supplier Alert",    desc:"Tier-2 auto components supplier reports material shortage",   severity:"low",      time:"12h ago", icon:"⚠" },
];

const SEV_COLOR = { critical: T.red, high: T.amberDim, medium: T.purple, low: T.cyan };
const RISK_COLOR = (score) => score > 70 ? T.red : score > 45 ? T.amber : T.green;

/* ─── NAV ────────────────────────────────────────────────────────────────────── */
const NAV = [
  { id:"command",  label:"Command Center",   icon:"◈" },
  { id:"radar",    label:"Disruption Radar", icon:"◉" },
  { id:"cascade",  label:"Impact Cascade",   icon:"⊕" },
  { id:"stockout", label:"Stockout Shield",  icon:"▦" },
  { id:"revenue",  label:"Revenue Guard",    icon:"₹" },
  { id:"agent",    label:"Resilience Agent", icon:"⚡" },
];
const ROLES = [
  { id:"admin",             label:"System Admin",       icon:"🛠", desc:"Full Access" },
  { id:"analytics_officer", label:"Analytics Officer",  icon:"📊", desc:"Reports & KPIs" },
  { id:"warehouse_manager", label:"Warehouse Manager",  icon:"🏭", desc:"Stock & Storage" },
  { id:"port_authority",    label:"Port Authority",     icon:"⚓", desc:"Mumbai / Chennai Port" },
  { id:"driver",            label:"Driver / Logistics", icon:"🚛", desc:"Last-Mile Delivery" },
];

/* ─── NETWORK MAP ─────────────────────────────────────────────────────────────── */
function NetworkMap({ disruptions = [] }) {
  const N = [
    { x:42, y:14, l:"Delhi",     anchor:"middle", dy:-5 },
    { x:16, y:30, l:"Jaipur",    anchor:"end",    dy:0  },
    { x:76, y:22, l:"Lucknow",   anchor:"start",  dy:0  },
    { x:88, y:37, l:"Kolkata",   anchor:"start",  dy:0  },
    { x:12, y:46, l:"Ahmedabad", anchor:"end",    dy:0  },
    { x:16, y:62, l:"Mumbai",    anchor:"end",    dy:0  },
    { x:26, y:67, l:"Pune",      anchor:"end",    dy:0  },
    { x:50, y:68, l:"Hyderabad", anchor:"middle", dy:-5 },
    { x:34, y:84, l:"Bangalore", anchor:"middle", dy:5  },
    { x:66, y:81, l:"Chennai",   anchor:"middle", dy:5  },
  ];
  const E = [[0,1],[0,2],[0,4],[1,4],[2,3],[3,9],[4,5],[5,6],[5,7],[6,7],[6,8],[7,8],[7,9],[8,9]];
  const disruptedCities = new Set(disruptions.map(d => d.city));

  return (
    <div style={{ position:"relative", width:"100%", height:"100%", background:T.bgPanel, borderRadius:10, overflow:"hidden", border:`1px solid ${T.border}` }}>
      <div style={{ position:"absolute", top:10, left:12, fontFamily:F.mono, fontSize:8, letterSpacing:2, color:T.textDim }}>RESILIENCE NETWORK — PAN INDIA</div>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ position:"absolute", inset:0 }}>
        {[20,40,60,80].map(v => <g key={v}>
          <line x1={v} y1="5" x2={v} y2="95" stroke={T.border} strokeWidth=".4"/>
          <line x1="5" y1={v} x2="95" y2={v} stroke={T.border} strokeWidth=".4"/>
        </g>)}
        {E.map(([a, b], i) => {
          const aD = disruptedCities.has(N[a].l), bD = disruptedCities.has(N[b].l);
          const edgeColor = aD || bD ? T.red : T.cyanDim;
          return <line key={i} x1={N[a].x} y1={N[a].y} x2={N[b].x} y2={N[b].y} stroke={edgeColor} strokeWidth={aD||bD?"1.2":"0.6"} strokeDasharray={aD||bD?"none":"1.5,1.5"} opacity={aD||bD?".8":".3"}/>;
        })}
        <circle r="1.4" fill={T.cyan} opacity=".9"><animateMotion dur="6s" repeatCount="indefinite" path={`M${N[0].x},${N[0].y} L${N[5].x},${N[5].y}`}/></circle>
        <circle r="1.4" fill={T.cyan} opacity=".7"><animateMotion dur="7.5s" repeatCount="indefinite" path={`M${N[4].x},${N[4].y} L${N[8].x},${N[8].y}`}/></circle>
        {N.map((n, i) => {
          const isD = disruptedCities.has(n.l);
          const lx = n.anchor==="start"?n.x+3.5:n.anchor==="end"?n.x-3.5:n.x;
          const ly = n.dy?n.y+n.dy:(n.anchor==="middle"?n.y-3:n.y+0.5);
          return (
            <g key={i}>
              {isD && <circle cx={n.x} cy={n.y} r="5" fill={T.red} opacity=".15"><animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite"/></circle>}
              <circle cx={n.x} cy={n.y} r="2.4" fill={isD?T.red:T.cyan} opacity={isD?1:.7}/>
              <circle cx={n.x} cy={n.y} r="1" fill={isD?"#ff9999":"#0A0D11"} opacity=".9"/>
              <text x={lx} y={ly} fontSize="3.2" fill={isD?T.red:T.textMuted} fontFamily="monospace" fontWeight="600" textAnchor={n.anchor}>{n.l}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── LOGIN PAGE ─────────────────────────────────────────────────────────────── */
function LoginPage({ onSwitch, onLogin }) {
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [err, setErr] = useState("");

  const inp = { width:"100%", padding:"11px 14px", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:8, fontSize:13, outline:"none", fontFamily:F.mono, color:T.text, boxSizing:"border-box", letterSpacing:.5 };

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, position:"relative", overflow:"hidden" }}>
      {/* Scan line */}
      <div style={{ position:"absolute", top:0, left:0, width:"100%", height:1, background:`linear-gradient(90deg, transparent, ${T.cyan}40, transparent)`, animation:"scan 8s linear infinite", zIndex:0 }}/>

      {/* Left panel */}
      <div style={{ width:"42%", background:T.bgPanel, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", justifyContent:"center", padding:"64px 56px", position:"relative", overflow:"hidden", zIndex:1 }}>
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:.04 }}><defs><pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke={T.cyan} strokeWidth="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/></svg>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:48 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:`${T.cyan}15`, border:`1px solid ${T.cyanDim}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⛓</div>
            <div>
              <div style={{ fontFamily:F.display, color:T.text, fontWeight:700, fontSize:13, letterSpacing:.5 }}>Resilience Intelligence</div>
              <div style={{ fontFamily:F.mono, color:T.textDim, fontSize:9, letterSpacing:2 }}>PAN INDIA · SUPPLY CHAIN AI</div>
            </div>
          </div>

          <div style={{ fontFamily:F.display, color:T.text, fontSize:34, fontWeight:700, lineHeight:1.15, marginBottom:12 }}>
            Detect.<br/><span style={{ color:T.cyan }}>Model.</span><br/>Prevent.
          </div>
          <div style={{ fontFamily:F.body, color:T.textMuted, fontSize:14, lineHeight:1.8, maxWidth:300, marginBottom:40 }}>
            AI-powered supply chain resilience — detect disruptions early, model downstream impact, protect revenue.
          </div>

          {[
            ["🚨","Early Warning","Proactive disruption detection"],
            ["🌊","Cascade Intelligence","Multi-hop impact modelling"],
            ["⚡","Resilience Agent","10 live ML tools, one interface"],
          ].map(([ic,t,d]) => (
            <div key={t} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ width:38, height:38, borderRadius:9, background:`${T.cyan}08`, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{ic}</div>
              <div>
                <div style={{ fontFamily:F.display, color:T.text, fontWeight:600, fontSize:13 }}>{t}</div>
                <div style={{ fontFamily:F.body, color:T.textMuted, fontSize:11.5 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:48, zIndex:1 }}>
        <div style={{ width:"100%", maxWidth:400 }}>
          <div style={{ marginBottom:36 }}>
            <div style={{ fontFamily:F.display, fontSize:28, fontWeight:700, color:T.text, marginBottom:6 }}>Welcome back</div>
            <div style={{ fontFamily:F.body, color:T.textMuted, fontSize:13 }}>Sign in to your Resilience Dashboard</div>
          </div>
          {err && <div style={{ background:`${T.red}10`, border:`1px solid ${T.red}30`, color:T.red, borderRadius:8, padding:"10px 14px", fontFamily:F.mono, fontSize:11, marginBottom:16 }}>{err}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:20 }}>
            {[["EMAIL","email",email,setEmail,"admin@scs.in"],["PASSWORD","password",pass,setPass,"••••••••"]].map(([lbl,type,val,set,ph]) => (
              <div key={lbl}>
                <label style={{ fontFamily:F.mono, fontSize:9, fontWeight:600, color:T.textDim, display:"block", marginBottom:6, letterSpacing:1.5 }}>{lbl}</label>
                <input value={val} onChange={e=>set(e.target.value)} type={type} placeholder={ph} style={inp} onFocus={e=>e.target.style.borderColor=T.cyan} onBlur={e=>e.target.style.borderColor=T.border}/>
              </div>
            ))}
          </div>
          <button onClick={() => { if(!email||!pass){setErr("All fields required.");return;} onLogin({name:"Admin User",email,role:"admin"}); }} style={{ width:"100%", padding:"13px", background:`linear-gradient(135deg, ${T.cyanDim}22, ${T.cyan}15)`, color:T.cyan, border:`1px solid ${T.cyan}60`, borderRadius:9, fontFamily:F.mono, fontSize:12, fontWeight:600, letterSpacing:1, cursor:"pointer", boxShadow:`0 0 20px ${T.cyanGlow}` }}>
            INITIALIZE SESSION →
          </button>
          <div style={{ textAlign:"center", marginTop:24, fontFamily:F.body, fontSize:13, color:T.textMuted }}>
            No account? <span onClick={onSwitch} style={{ color:T.cyan, fontWeight:600, cursor:"pointer" }}>Create one</span>
          </div>
          <div style={{ marginTop:24, padding:"14px 16px", background:T.bgCard, borderRadius:10, border:`1px solid ${T.border}` }}>
            <div style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, marginBottom:6, letterSpacing:1.5 }}>DEMO CREDENTIALS</div>
            <div style={{ fontFamily:F.mono, fontSize:12, color:T.text }}>admin@scs.in · demo123</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── REGISTER PAGE ──────────────────────────────────────────────────────────── */
function RegisterPage({ onSwitch, onLogin }) {
  const [step, setStep] = useState(1); const [role, setRole] = useState(""); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const inp = { width:"100%", padding:"11px 14px", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:8, fontSize:13, outline:"none", fontFamily:F.mono, color:T.text, boxSizing:"border-box", letterSpacing:.5 };
  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg }}>
      <div style={{ width:"36%", background:T.bgPanel, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"52px 44px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:52 }}><span style={{ fontSize:20 }}>⛓</span><div style={{ fontFamily:F.display, color:T.text, fontWeight:700, fontSize:13 }}>Resilience Intelligence</div></div>
          <div style={{ fontFamily:F.display, color:T.text, fontSize:26, fontWeight:700, lineHeight:1.25, marginBottom:10 }}>Join India's<br/>Resilience Network</div>
        </div>
        <div>
          {["Select Your Role","Your Details","Set Password"].map((l,i) => { const n=i+1; const done=step>n; const on=step===n; return (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:done?T.cyanGlow:on?`${T.cyan}15`:`${T.border}`, border:on?`1px solid ${T.cyan}`:"1px solid transparent", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.mono, fontSize:10, fontWeight:700, color:done?T.cyan:on?T.cyan:T.textDim }}>{done?"✓":String(n).padStart(2,"0")}</div>
              <span style={{ fontFamily:F.mono, fontSize:12, color:on?T.text:T.textDim, letterSpacing:.5 }}>{l}</span>
            </div>
          );})}
        </div>
      </div>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:52 }}>
        <div style={{ width:"100%", maxWidth:500 }}>
          {step===1&&<><div style={{ marginBottom:28 }}><div style={{ fontFamily:F.display, fontSize:24, fontWeight:700, color:T.text }}>What's your role?</div></div><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>{ROLES.map(r=><div key={r.id} onClick={()=>setRole(r.id)} style={{ padding:"16px", border:`1px solid ${role===r.id?T.cyan:T.border}`, borderRadius:10, cursor:"pointer", background:role===r.id?`${T.cyan}08`:T.bgCard }}><div style={{ fontSize:22, marginBottom:8 }}>{r.icon}</div><div style={{ fontFamily:F.display, fontSize:12, fontWeight:700, color:T.text }}>{r.label}</div><div style={{ fontFamily:F.body, fontSize:11, color:T.textMuted, marginTop:2 }}>{r.desc}</div></div>)}</div><Btn onClick={()=>role&&setStep(2)} disabled={!role} style={{ width:"100%", justifyContent:"center" }}>Continue →</Btn></>}
          {step===2&&<><div style={{ marginBottom:28 }}><div style={{ fontFamily:F.display, fontSize:24, fontWeight:700, color:T.text }}>Your Details</div></div><div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>{[["FULL NAME","text",name,setName],["EMAIL","email",email,setEmail]].map(([lbl,type,val,set])=><div key={lbl}><label style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, display:"block", marginBottom:6, letterSpacing:1.5 }}>{lbl}</label><input value={val} onChange={e=>set(e.target.value)} type={type} style={inp} onFocus={e=>e.target.style.borderColor=T.cyan} onBlur={e=>e.target.style.borderColor=T.border}/></div>)}</div><div style={{ display:"flex", gap:10 }}><Btn variant="ghost" onClick={()=>setStep(1)} style={{ flex:1, justifyContent:"center" }}>← Back</Btn><Btn onClick={()=>name&&email&&setStep(3)} disabled={!name||!email} style={{ flex:2, justifyContent:"center" }}>Continue →</Btn></div></>}
          {step===3&&<><div style={{ marginBottom:28 }}><div style={{ fontFamily:F.display, fontSize:24, fontWeight:700, color:T.text }}>Set Password</div></div><div style={{ marginBottom:20 }}><label style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, display:"block", marginBottom:6, letterSpacing:1.5 }}>PASSWORD</label><input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Min 8 characters" style={inp} onFocus={e=>e.target.style.borderColor=T.cyan} onBlur={e=>e.target.style.borderColor=T.border}/></div><div style={{ display:"flex", gap:10 }}><Btn variant="ghost" onClick={()=>setStep(2)} style={{ flex:1, justifyContent:"center" }}>← Back</Btn><Btn onClick={()=>onLogin({name,email,role})} style={{ flex:2, justifyContent:"center" }}>Create Account ✓</Btn></div></>}
          <div style={{ textAlign:"center", marginTop:24, fontFamily:F.body, fontSize:13, color:T.textMuted }}>Have an account? <span onClick={onSwitch} style={{ color:T.cyan, fontWeight:600, cursor:"pointer" }}>Sign in</span></div>
        </div>
      </div>
    </div>
  );
}

/* ─── COMMAND CENTER ─────────────────────────────────────────────────────────── */
const RESILIENCE_TREND = [
  {day:"Mar 8",score:72},{day:"Mar 9",score:68},{day:"Mar 10",score:74},{day:"Mar 11",score:71},
  {day:"Mar 12",score:65},{day:"Mar 13",score:78},{day:"Mar 14",score:76},{day:"Mar 15",score:70},
  {day:"Mar 16",score:73},{day:"Mar 17",score:69},{day:"Mar 18",score:80},{day:"Mar 19",score:77},
  {day:"Mar 20",score:75},{day:"Mar 21",score:72},{day:"Mar 22",score:68},{day:"Mar 23",score:71},
  {day:"Mar 24",score:74},{day:"Mar 25",score:79},{day:"Mar 26",score:76},{day:"Mar 27",score:73},
  {day:"Mar 28",score:71},{day:"Mar 29",score:68},{day:"Mar 30",score:74},{day:"Today",score:null,live:true},
];

function CommandCenter({ onNav }) {
  const [probeLoading, setProbeLoading] = useState(true);
  const [probeAlerts, setProbeAlerts]   = useState([]);
  const [resScore, setResScore]         = useState(null);
  const [revenueRisk, setRevenueRisk]   = useState(null);
  const [disruptions, setDisruptions]   = useState([]);

  useEffect(() => {
    (async () => {
      setProbeLoading(true);
      const corridors = [
        { origin:"Mumbai", dest:"Delhi" }, { origin:"Chennai", dest:"Hyderabad" },
        { origin:"Kolkata", dest:"Delhi" }, { origin:"Bangalore", dest:"Mumbai" }, { origin:"Pune", dest:"Ahmedabad" },
      ];
      const alerts = []; let totalScore = 0; let count = 0; let totalRevRisk = 0; const disruptedList = [];
      await Promise.allSettled(corridors.map(async ({ origin, dest }) => {
        const sku = REAL_SKUS.find(s => s.warehouse === origin) || { productId:"PROD_001", daily:20 };
        try {
          const [delay, inv, reorder] = await Promise.all([
            callAPI("/delay", { origin, destination:dest, vehicle_type:"Truck", weather_condition:"Clear", traffic_condition:"Medium", departure_hour:10 }),
            callAPI("/anomaly/inventory", { product_id:sku.productId, warehouse:origin, current_stock:500, daily_sales:sku.daily, expected_stock:500, actual_stock:480 }),
            callAPI("/reorder", { product_id:sku.productId, warehouse:origin, current_stock:500, daily_sales:sku.daily, lead_time_days:5, supplier_delay_days:2, is_promotion:0 }),
          ]);
          const score = calcDisruptionScore(delay.delay_probability, inv.anomaly_score, reorder.days_until_stockout, inv.is_anomaly);
          totalScore += (100 - score); count++;
          totalRevRisk += calcRevenueAtRisk(reorder.days_until_stockout, sku.daily, sku.productId);
          if (score > 45) { alerts.push({ city:origin, route:`${origin}→${dest}`, score, delayProb: delay.delay_probability ?? 0, days: reorder.days_until_stockout, urgency: reorder.urgency }); disruptedList.push({ city:origin }); }
        } catch(e) {}
      }));
      alerts.sort((a,b) => b.score - a.score);
      setProbeAlerts(alerts.slice(0, 3)); setDisruptions(disruptedList);
      setResScore(count > 0 ? Math.round(totalScore / count) : 74);
      setRevenueRisk(totalRevRisk); setProbeLoading(false);
    })();
  }, []);

  const trendData = RESILIENCE_TREND.map(d => d.live ? { ...d, score: resScore } : d);
  const active = probeAlerts.length;

  return (
    <div style={{ flex:1, overflow:"auto", padding:"28px 32px", background:T.bg }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <SectionLabel>Intelligence · Command Center</SectionLabel>
          <h2 style={{ fontFamily:F.display, fontSize:26, fontWeight:700, color:T.text }}>Command Center</h2>
          <p style={{ fontFamily:F.body, color:T.textMuted, fontSize:13, marginTop:4 }}>Supply Chain Resilience Intelligence · Pan India Network</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:probeLoading?`${T.amber}10`:active>0?`${T.red}10`:`${T.green}10`, border:`1px solid ${probeLoading?T.amber:active>0?T.red:T.green}30`, borderRadius:8, padding:"8px 16px" }}>
          <StatusDot color={probeLoading?T.amber:active>0?T.red:T.green} pulse={probeLoading}/>
          <span style={{ fontFamily:F.mono, fontSize:9, color:probeLoading?T.amber:active>0?T.red:T.green, letterSpacing:1.5 }}>
            {probeLoading ? "SCANNING NETWORK…" : active>0 ? `${active} DISRUPTIONS DETECTED` : "ALL CORRIDORS NOMINAL"}
          </span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <MetricCard label="Network Resilience Score" value={resScore!=null?`${resScore}/100`:"—"} sub="Live weighted score across corridors" icon="🛡" accent={T.cyan} loading={probeLoading} onClick={() => !probeLoading && onNav("radar")}/>
        <MetricCard label="Revenue at Risk (30d)" value={revenueRisk!=null?`₹${(revenueRisk/100000).toFixed(1)}L`:"—"} sub="Stockout exposure × margin" icon="₹" accent={T.red} loading={probeLoading} onClick={() => !probeLoading && onNav("revenue")}/>
        <MetricCard label="Active Disruption Alerts" value={probeLoading?"—":String(active)} sub="Corridors with score > 45" icon="🚨" accent={active>0?T.red:T.green} loading={probeLoading} onClick={() => !probeLoading && onNav("radar")}/>
        <MetricCard label="Highest Risk Corridor" value={probeLoading?"—":probeAlerts.length>0?`${probeAlerts[0].score}/100`:"—"} sub={probeAlerts.length>0?probeAlerts[0].route:"No high-risk corridors"} icon="⚠" accent={T.amber} loading={probeLoading} onClick={() => !probeLoading && onNav("cascade")}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:18, marginBottom:18 }}>
        <Panel>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontFamily:F.display, fontWeight:600, color:T.text, fontSize:14 }}>Live Disruption Network</div>
            <span onClick={() => onNav("cascade")} style={{ fontFamily:F.mono, fontSize:10, color:T.cyan, cursor:"pointer", letterSpacing:1 }}>IMPACT CASCADE →</span>
          </div>
          <div style={{ height:220 }}><NetworkMap disruptions={disruptions}/></div>
        </Panel>

        <Panel>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontFamily:F.display, fontWeight:600, color:T.text, fontSize:14 }}>Proactive Alerts</div>
            {probeLoading && <Spinner small/>}
          </div>
          {probeLoading ? <div style={{ fontFamily:F.mono, fontSize:11, color:T.textMuted, textAlign:"center", padding:"20px 0", letterSpacing:1 }}>SCANNING ALL CORRIDORS…</div>
            : probeAlerts.length===0 ? (
              <div style={{ background:`${T.green}0D`, border:`1px solid ${T.green}20`, borderRadius:10, padding:16, textAlign:"center" }}>
                <StatusDot color={T.green}/>&nbsp;&nbsp;<span style={{ fontFamily:F.mono, fontSize:11, color:T.green, letterSpacing:1 }}>ALL CORRIDORS NOMINAL</span>
              </div>
            ) : probeAlerts.map((a, i) => (
              <div key={i} onClick={() => onNav("radar")} style={{ display:"flex", gap:12, padding:"10px 12px", borderRadius:8, background:a.score>70?`${T.red}0D`:`${T.amber}0D`, cursor:"pointer", border:`1px solid ${a.score>70?T.red:T.amber}20`, marginBottom:8, animation:`fadeUp .3s ease ${i*0.1}s both` }}>
                <StatusDot color={a.score>70?T.red:T.amber}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:F.display, fontSize:12.5, color:T.text, fontWeight:600 }}>{a.route}</div>
                  <div style={{ fontFamily:F.mono, fontSize:10, color:T.textMuted, marginTop:2, letterSpacing:.3 }}>
                    Score: {a.score}/100 · Delay: {(a.delayProb||0).toFixed(0)}%{a.days!=null&&` · ${a.days.toFixed(1)}d to stockout`}
                  </div>
                </div>
                <Badge color={a.score>70?T.red:T.amber}>{a.score>70?"HIGH":"MED"}</Badge>
              </div>
            ))
          }
          {probeAlerts.length>0 && <div onClick={() => onNav("radar")} style={{ fontFamily:F.mono, fontSize:10, color:T.cyan, cursor:"pointer", textAlign:"center", marginTop:10, letterSpacing:1 }}>VIEW ALL IN DISRUPTION RADAR →</div>}
        </Panel>
      </div>

      <Panel>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:F.display, fontWeight:600, color:T.text, fontSize:14 }}>Network Resilience Score — 30 Day Trend</div>
            <div style={{ fontFamily:F.body, fontSize:12, color:T.textMuted, marginTop:3 }}>Historical daily score + today's live reading</div>
          </div>
          {resScore!=null && <Badge color={resScore>70?T.green:resScore>50?T.amber:T.red}>{resScore}/100 TODAY</Badge>}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={trendData}>
            <defs><linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.cyan} stopOpacity={.2}/><stop offset="95%" stopColor={T.cyan} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="day" tick={{ fontSize:10, fill:T.textMuted, fontFamily:F.mono }} axisLine={false} tickLine={false} interval={3}/>
            <YAxis domain={[50,100]} tick={{ fontSize:10, fill:T.textMuted, fontFamily:F.mono }} axisLine={false} tickLine={false}/>
            <Tooltip content={<TooltipCustom/>}/>
            <Area type="monotone" dataKey="score" name="Resilience Score" stroke={T.cyan} strokeWidth={2} fill="url(#gRes)" dot={(props) => { const { cx, cy, index } = props; return index===trendData.length-1?<circle key={index} cx={cx} cy={cy} r={5} fill={T.red} stroke={T.bg} strokeWidth={2}/>:<circle key={index} cx={cx} cy={cy} r={0}/>; }}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

/* ─── DISRUPTION RADAR ───────────────────────────────────────────────────────── */
function DisruptionRadar() {
  const [supplierScores, setSupplierScores] = useState({});
  const [scanning, setScanning]             = useState(false);
  const [scanned, setScanned]               = useState(false);
  const [scannedAt, setScannedAt]           = useState(null);
  const [signalFilter, setSignalFilter]     = useState("all");

  const scanSuppliers = async () => {
    setScanning(true);
    const scores = {};
    await Promise.allSettled(ALL_CITIES.map(async city => {
      try {
        const sku = REAL_SKUS.find(s => s.warehouse === city) || { productId:"PROD_001", daily:20 };
        const [delay, inv, reorder] = await Promise.all([
          callAPI("/delay", { origin:city, destination:"Delhi", vehicle_type:"Truck", weather_condition:"Clear", traffic_condition:"Medium", departure_hour:10 }),
          callAPI("/anomaly/inventory", { product_id:sku.productId, warehouse:city, current_stock:500, daily_sales:sku.daily, expected_stock:500, actual_stock:480 }),
          callAPI("/reorder", { product_id:sku.productId, warehouse:city, current_stock:500, daily_sales:sku.daily, lead_time_days:5, supplier_delay_days:2, is_promotion:0 }),
        ]);
        const score = calcDisruptionScore(delay.delay_probability, inv.anomaly_score, reorder.days_until_stockout, inv.is_anomaly);
        scores[city] = { score, delayProb: delay.delay_probability ?? 0, isAnomaly: inv.is_anomaly, daysToStockout: reorder.days_until_stockout, productId: sku.productId, risk: score > 70 ? "HIGH" : score > 45 ? "MEDIUM" : "LOW" };
      } catch(e) { scores[city] = { score: 0, risk: "UNKNOWN" }; }
    }));
    setSupplierScores(scores); setScanning(false); setScanned(true);
    setScannedAt(new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit" }));
  };

  const filteredSignals = signalFilter === "all" ? MOCK_SIGNALS : MOCK_SIGNALS.filter(s => s.type === signalFilter);

  return (
    <div style={{ flex:1, overflow:"auto", padding:"28px 32px", background:T.bg }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <SectionLabel>Intelligence · Disruption Radar</SectionLabel>
          <h2 style={{ fontFamily:F.display, fontSize:26, fontWeight:700, color:T.text }}>Disruption Radar</h2>
          <p style={{ fontFamily:F.body, color:T.textMuted, fontSize:13, marginTop:4 }}>Early warning system — external signals + live supplier health scores</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {scannedAt && !scanning && <span style={{ fontFamily:F.mono, fontSize:10, color:T.textMuted, letterSpacing:.5 }}>Last scan: {scannedAt}</span>}
          <Btn onClick={scanSuppliers} disabled={scanning}>{scanning ? "SCANNING…" : "⟳ SCAN ALL SUPPLIERS"}</Btn>
        </div>
      </div>
      {scanning && <div style={{ marginBottom:20 }}><Spinner label="SCANNING ALL 10 SUPPLIER CITIES…"/></div>}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
        <Panel>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontFamily:F.display, fontWeight:600, color:T.text, fontSize:14 }}>External Signal Feed</div>
            <div style={{ display:"flex", gap:6 }}>
              {["all","weather","port","news"].map(f => (
                <button key={f} onClick={() => setSignalFilter(f)} style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${signalFilter===f?T.cyan:T.border}`, background:signalFilter===f?`${T.cyan}15`:"transparent", color:signalFilter===f?T.cyan:T.textMuted, fontFamily:F.mono, fontSize:10, letterSpacing:.5, cursor:"pointer" }}>{f}</button>
              ))}
            </div>
          </div>
          {filteredSignals.map(s => (
            <div key={s.id} style={{ display:"flex", gap:12, padding:"12px 14px", borderRadius:10, background:`${SEV_COLOR[s.severity]}08`, border:`1px solid ${SEV_COLOR[s.severity]}20`, marginBottom:8 }}>
              <div style={{ fontSize:18, flexShrink:0 }}>{s.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ fontFamily:F.display, fontSize:12.5, fontWeight:600, color:T.text }}>{s.title} — {s.city}</div>
                  <Badge color={SEV_COLOR[s.severity]}>{s.severity}</Badge>
                </div>
                <div style={{ fontFamily:F.body, fontSize:12, color:T.textMuted, marginTop:3 }}>{s.desc}</div>
                <div style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, marginTop:4, letterSpacing:.5 }}>{s.time}</div>
              </div>
            </div>
          ))}
        </Panel>

        <Panel>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontFamily:F.display, fontWeight:600, color:T.text, fontSize:14 }}>Supplier Health Scores</div>
            {!scanned && <span style={{ fontFamily:F.mono, fontSize:10, color:T.textDim, letterSpacing:1 }}>CLICK SCAN TO LOAD</span>}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ALL_CITIES.map(city => {
              if (!scanned) return (
                <div key={city} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 12px", background:T.bgPanel, borderRadius:8, border:`1px solid ${T.border}` }}>
                  <StatusDot color={T.textDim}/>
                  <span style={{ fontFamily:F.mono, fontSize:12, color:T.textMuted, flex:1 }}>{city}</span>
                  <span style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, letterSpacing:1 }}>NOT SCANNED</span>
                </div>
              );
              const s = supplierScores[city] || {};
              const rc = RISK_COLOR(s.score||0);
              return (
                <div key={city} style={{ padding:"10px 12px", background:`${rc}08`, borderRadius:9, border:`1px solid ${rc}20`, animation:"fadeUp .3s ease" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <StatusDot color={rc}/>
                      <span style={{ fontFamily:F.display, fontSize:13, fontWeight:600, color:T.text }}>{city}</span>
                      {s.productId && <span style={{ fontFamily:F.mono, fontSize:9, color:T.textDim }}>{s.productId}</span>}
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontFamily:F.display, fontSize:15, fontWeight:700, color:rc }}>{s.score}/100</span>
                      <Badge color={rc}>{s.risk}</Badge>
                    </div>
                  </div>
                  <div style={{ background:`${rc}20`, borderRadius:20, height:3, marginBottom:5 }}><div style={{ width:`${Math.min(100,s.score||0)}%`, height:"100%", background:rc, borderRadius:20 }}/></div>
                  <div style={{ fontFamily:F.mono, fontSize:10, color:T.textMuted, letterSpacing:.3 }}>
                    Delay: {(s.delayProb||0).toFixed(1)}% · Anomaly: {s.isAnomaly?"⚠ Yes":"✓ No"}{s.daysToStockout!=null&&` · ${s.daysToStockout.toFixed(1)}d to stockout`}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ─── IMPACT CASCADE ─────────────────────────────────────────────────────────── */
function ImpactCascade() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [cascadeData, setCascadeData]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [err, setErr]                   = useState("");
  const [animStep, setAnimStep]         = useState(0);

  const CITY_POS = { Mumbai:{x:16,y:62}, Delhi:{x:42,y:14}, Chennai:{x:66,y:81}, Kolkata:{x:88,y:37}, Bangalore:{x:34,y:84}, Ahmedabad:{x:12,y:46}, Hyderabad:{x:50,y:68}, Jaipur:{x:16,y:30}, Lucknow:{x:76,y:22}, Pune:{x:26,y:67} };
  const EDGES = [["Mumbai","Delhi"],["Mumbai","Ahmedabad"],["Mumbai","Pune"],["Mumbai","Hyderabad"],["Delhi","Jaipur"],["Delhi","Lucknow"],["Delhi","Kolkata"],["Chennai","Hyderabad"],["Chennai","Bangalore"],["Bangalore","Hyderabad"],["Kolkata","Lucknow"],["Pune","Ahmedabad"],["Hyderabad","Bangalore"]];

  const simulate = async (city) => {
    setSelectedCity(city); setErr(""); setLoading(true); setCascadeData(null); setAnimStep(0);
    try {
      const directNeighbors = EDGES.filter(([a,b]) => a===city||b===city).map(([a,b]) => a===city?b:a);
      const sku = REAL_SKUS.find(s => s.warehouse === city) || { productId:"PROD_001", daily:20 };
      const [delay, reorder, anomaly] = await Promise.all([
        callAPI("/delay", { origin:city, destination:directNeighbors[0]||"Delhi", vehicle_type:"Truck", weather_condition:"Rain", traffic_condition:"High", departure_hour:10 }),
        callAPI("/reorder", { product_id:sku.productId, warehouse:city, current_stock:300, daily_sales:sku.daily, lead_time_days:7, supplier_delay_days:5, is_promotion:0 }),
        callAPI("/anomaly/inventory", { product_id:sku.productId, warehouse:city, current_stock:300, daily_sales:sku.daily, expected_stock:500, actual_stock:300 }),
      ]);
      const daysToStockout = reorder.days_until_stockout ?? 6;
      const revenueAtRisk = calcRevenueAtRisk(daysToStockout, sku.daily, sku.productId);
      setCascadeData({ city, neighbors: directNeighbors, delayProb: delay.delay_probability ?? 0, daysToStockout, revenueAtRisk, urgency: reorder.urgency, isAnomaly: anomaly.is_anomaly, productId: sku.productId, dailySales: sku.daily, score: calcDisruptionScore(delay.delay_probability, anomaly.anomaly_score, daysToStockout, anomaly.is_anomaly) });
      let step = 0;
      const interval = setInterval(() => { step++; setAnimStep(step); if (step >= 4) clearInterval(interval); }, 700);
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const affectedNodes = new Set();
  if (cascadeData) {
    affectedNodes.add(cascadeData.city);
    if (animStep >= 2) cascadeData.neighbors.slice(0,3).forEach(n => affectedNodes.add(n));
    if (animStep >= 3) cascadeData.neighbors.slice(0,3).forEach(n => EDGES.filter(([a,b]) => a===n||b===n).forEach(([a,b]) => { if (!affectedNodes.has(a)) affectedNodes.add(a); if (!affectedNodes.has(b)) affectedNodes.add(b); }));
  }

  return (
    <div style={{ flex:1, overflow:"auto", padding:"28px 32px", background:T.bg }}>
      <div style={{ marginBottom:24 }}>
        <SectionLabel>Intelligence · Impact Cascade</SectionLabel>
        <h2 style={{ fontFamily:F.display, fontSize:26, fontWeight:700, color:T.text }}>Impact Cascade</h2>
        <p style={{ fontFamily:F.body, color:T.textMuted, fontSize:13, marginTop:4 }}>Simulate a disruption — watch downstream impact propagate through the network</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:18 }}>
        <Panel style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, letterSpacing:1.5 }}>SUPPLY CHAIN NETWORK GRAPH</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {ALL_CITIES.map(city => (
                <button key={city} onClick={() => simulate(city)} style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${selectedCity===city?T.red:T.border}`, background:selectedCity===city?`${T.red}15`:T.bgPanel, color:selectedCity===city?T.red:T.textMuted, fontFamily:F.mono, fontSize:10, cursor:"pointer" }}>{city}</button>
              ))}
            </div>
          </div>
          <div style={{ padding:18, height:300 }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {EDGES.map(([a,b], i) => {
                const aPos = CITY_POS[a]; const bPos = CITY_POS[b];
                const isAffected = affectedNodes.has(a) && affectedNodes.has(b);
                return <line key={i} x1={aPos.x} y1={aPos.y} x2={bPos.x} y2={bPos.y} stroke={isAffected?T.red:T.cyanDim} strokeWidth={isAffected?"1.5":"0.5"} opacity={isAffected?".9":".25"} strokeDasharray={isAffected?"none":"2,2"}/>;
              })}
              {Object.entries(CITY_POS).map(([city, pos]) => {
                const isSource = cascadeData && city === cascadeData.city;
                const isAffected = affectedNodes.has(city) && !isSource;
                const fillColor = isSource ? T.red : isAffected ? T.amber : T.cyan;
                return (
                  <g key={city} onClick={() => simulate(city)} style={{ cursor:"pointer" }}>
                    {isSource && <circle cx={pos.x} cy={pos.y} r="6" fill={T.red} opacity=".2"><animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite"/></circle>}
                    <circle cx={pos.x} cy={pos.y} r="2.8" fill={fillColor} opacity={isAffected||isSource?1:.5}/>
                    <text x={pos.x} y={pos.y - 4.5} fontSize="3.2" fill={isSource?T.red:isAffected?T.amber:T.textMuted} fontFamily="monospace" fontWeight="600" textAnchor="middle">{city}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div style={{ padding:"10px 18px", borderTop:`1px solid ${T.border}`, display:"flex", gap:16, fontFamily:F.mono, fontSize:10, color:T.textMuted }}>
            {[[T.red,"Source"],[T.amber,"Affected"],[T.cyan,"Normal"]].map(([c,l]) => <span key={l} style={{ display:"flex", alignItems:"center", gap:5 }}><StatusDot color={c}/>{l}</span>)}
          </div>
        </Panel>

        <div>
          {!cascadeData && !loading && !err && (
            <Panel style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:360, textAlign:"center" }}>
              <div><div style={{ fontSize:36, marginBottom:14 }}>🌊</div><div style={{ fontFamily:F.display, fontSize:16, fontWeight:700, color:T.text, marginBottom:8 }}>Select a city</div><div style={{ fontFamily:F.body, fontSize:13, color:T.textMuted }}>Click any city node to simulate a disruption cascade</div></div>
            </Panel>
          )}
          {loading && <Panel style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:360 }}><Spinner label="MODELLING CASCADE IMPACT…"/></Panel>}
          {err && <ErrBox msg={err}/>}
          {cascadeData && !loading && (
            <Panel style={{ animation:"fadeUp .3s ease" }}>
              <SectionLabel>CASCADE TIMELINE — {cascadeData.city.toUpperCase()}</SectionLabel>
              {[
                { step:1, title:`Disruption at ${cascadeData.city}`, desc:`Delay: ${cascadeData.delayProb.toFixed(0)}% (rain + high traffic) · Anomaly: ${cascadeData.isAnomaly?"Detected":"None"}`, color:T.red, show: animStep>=1 },
                { step:2, title:`${cascadeData.neighbors.slice(0,3).join(", ")} affected`, desc:`${cascadeData.neighbors.slice(0,3).length} directly connected warehouses face inbound delays`, color:T.amber, show: animStep>=2 },
                { step:3, title:`${cascadeData.productId} approaching stockout`, desc:`${cascadeData.dailySales} units/day · ${cascadeData.daysToStockout?.toFixed(1)} days of stock remaining`, color:T.amber, show: animStep>=3 },
                { step:4, title:`₹${(cascadeData.revenueAtRisk/100000).toFixed(1)}L revenue at risk`, desc:`${Math.max(0,Math.floor(30-cascadeData.daysToStockout))} exposed days × ${cascadeData.dailySales} units/day × ₹${(UNIT_PRICES[cascadeData.productId]||4500).toLocaleString("en-IN")} × 28% margin`, color:T.red, show: animStep>=4 },
              ].map(item => item.show && (
                <div key={item.step} style={{ display:"flex", gap:12, marginBottom:14, animation:"slideR .4s ease" }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:`${item.color}20`, border:`1px solid ${item.color}50`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.mono, fontSize:10, fontWeight:700, color:item.color, flexShrink:0 }}>{item.step}</div>
                    {item.step<4 && <div style={{ width:1, height:16, background:`${item.color}30` }}/>}
                  </div>
                  <div style={{ paddingTop:2 }}>
                    <div style={{ fontFamily:F.display, fontSize:13, fontWeight:600, color:T.text }}>{item.title}</div>
                    <div style={{ fontFamily:F.body, fontSize:11.5, color:T.textMuted, marginTop:2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
              {animStep>=4 && (
                <div style={{ marginTop:14, background:`${T.red}0D`, border:`1px solid ${T.red}30`, borderRadius:10, padding:"14px 16px", animation:"fadeUp .3s ease" }}>
                  <div style={{ fontFamily:F.mono, fontSize:9, color:T.red, marginBottom:6, letterSpacing:1.5 }}>DISRUPTION SCORE</div>
                  <div style={{ fontFamily:F.display, fontSize:30, fontWeight:700, color:T.red }}>{cascadeData.score}<span style={{ fontSize:14, color:T.textMuted }}>/100</span></div>
                  <div style={{ fontFamily:F.body, fontSize:12, color:T.textMuted, marginTop:4 }}>Urgency: {cascadeData.urgency||"High"} · {cascadeData.daysToStockout?.toFixed(1)}d to stockout at {cascadeData.city}</div>
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── STOCKOUT SHIELD ────────────────────────────────────────────────────────── */
const INV_ITEMS = [
  { id:"INV-001", sku:"STL-ROD-12", name:"Steel Rods 12mm",       warehouse:"Chennai",   qty:340,  min:100, max:800,  productId:"PROD_001", daily:12 },
  { id:"INV-002", sku:"ELC-CAP-22", name:"Electronic Capacitors",  warehouse:"Mumbai",    qty:18,   min:50,  max:500,  productId:"PROD_002", daily:8  },
  { id:"INV-003", sku:"TXT-COT-XL", name:"Cotton Fabric XL",       warehouse:"Ahmedabad", qty:620,  min:200, max:1000, productId:"PROD_003", daily:25 },
  { id:"INV-004", sku:"AUT-BRK-44", name:"Brake Pads Set",         warehouse:"Pune",      qty:9,    min:30,  max:300,  productId:"PROD_002", daily:4  },
  { id:"INV-005", sku:"FDG-RIC-25", name:"Rice (25kg Bags)",       warehouse:"Kolkata",   qty:1200, min:300, max:2000, productId:"PROD_003", daily:80 },
  { id:"INV-006", sku:"CHM-H2SO4",  name:"Sulphuric Acid 98%",     warehouse:"Hyderabad", qty:82,   min:40,  max:200,  productId:"PROD_001", daily:5  },
];

function StockoutShield() {
  const [selected, setSelected]       = useState(null);
  const [reorderRes, setReorderRes]   = useState(null);
  const [routeRes, setRouteRes]       = useState(null);
  const [forecastD, setForecastD]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [err, setErr]                 = useState("");

  const runAnalysis = async (item) => {
    setSelected(item); setErr(""); setLoading(true); setReorderRes(null); setRouteRes(null); setForecastD(null);
    try {
      const [reorder, forecast] = await Promise.all([
        callAPI("/reorder", { product_id:item.productId, warehouse:item.warehouse, current_stock:item.qty, daily_sales:item.daily, lead_time_days:5, supplier_delay_days:2, is_promotion:0 }),
        callAPI("/forecast", { product_id:item.productId, warehouse:item.warehouse, days:14, is_promotion:0 }),
      ]);
      if (reorder.recommended_order_qty != null) reorder.recommended_order_qty = Math.max(0, Math.min(reorder.recommended_order_qty, item.max * 3));
      setReorderRes(reorder);
      const arr = Array.isArray(forecast) ? forecast : (forecast.forecast ?? []);
      setForecastD(arr.map((pt, i) => ({ day:`D${i+1}`, demand: Math.round(pt.predicted_demand ?? pt.yhat ?? pt.demand ?? 0) })).slice(0, 14));
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const runRoute = async (item) => {
    setRouteLoading(true);
    try {
      const dest = NEAREST_HUB[item.warehouse] || "Mumbai";
      const r = await callAPI("/route", { warehouse:item.warehouse, delivery_stops:dest, vehicle_type:"Truck", traffic_condition:"Medium" });
      setRouteRes({ ...r, origin:item.warehouse, destination:dest });
    } catch(e) { setRouteRes(null); }
    finally { setRouteLoading(false); }
  };

  return (
    <div style={{ flex:1, overflow:"auto", padding:"28px 32px", background:T.bg }}>
      <div style={{ marginBottom:24 }}>
        <SectionLabel>Operations · Stockout Shield</SectionLabel>
        <h2 style={{ fontFamily:F.display, fontSize:26, fontWeight:700, color:T.text }}>Stockout Shield</h2>
        <p style={{ fontFamily:F.body, color:T.textMuted, fontSize:13, marginTop:4 }}>Days-to-stockout per SKU · ML reorder triggers · Emergency route planning</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: selected ? "1fr 400px" : "1fr", gap:18 }}>
        <Panel style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:T.bgPanel }}>
                {["SKU","Item","Warehouse","Stock Level","Daily Sales","Days to Stockout","Status"].map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"10px 16px", fontFamily:F.mono, fontSize:9, fontWeight:600, color:T.textDim, letterSpacing:1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INV_ITEMS.map(item => {
                const daysLeft = Math.round(item.qty / item.daily);
                const isCrit = daysLeft < 7; const isWarn = !isCrit && daysLeft < 14;
                const isSel = selected?.id === item.id;
                const rc = isCrit ? T.red : isWarn ? T.amber : T.green;
                return (
                  <tr key={item.id} onClick={() => runAnalysis(item)} style={{ borderBottom:`1px solid ${T.border}`, background:isSel?`${T.cyan}08`:daysLeft<3?`${T.red}05`:"transparent", cursor:"pointer", transition:"background .15s", animation: daysLeft<3&&!isSel?"critPulse 2s infinite":"none" }}
                    onMouseOver={e => { if(!isSel) e.currentTarget.style.background=T.bgCardHi; }}
                    onMouseOut={e => { if(!isSel) e.currentTarget.style.background=daysLeft<3?`${T.red}05`:"transparent"; }}>
                    <td style={{ padding:"12px 16px", fontFamily:F.mono, fontSize:10, fontWeight:600, color:T.cyan }}>{item.sku}</td>
                    <td style={{ padding:"12px 16px", fontFamily:F.display, fontSize:12.5, fontWeight:600, color:T.text }}>
                      {item.name}
                      {daysLeft<3 && <span style={{ marginLeft:8, fontFamily:F.mono, fontSize:8, color:T.red, letterSpacing:1, animation:"pulse 1s infinite" }}>● CRITICAL</span>}
                    </td>
                    <td style={{ padding:"12px 16px", fontFamily:F.body, fontSize:12, color:T.textMuted }}>{item.warehouse}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ fontFamily:F.display, fontSize:13, fontWeight:600, color:isCrit?T.red:T.text }}>{item.qty.toLocaleString("en-IN")}<span style={{ fontSize:10, color:T.textMuted }}> / {item.max.toLocaleString("en-IN")}</span></div>
                      <div style={{ marginTop:4, width:80, background:T.bgPanel, borderRadius:20, height:3 }}><div style={{ width:`${Math.min(100,Math.round(item.qty/item.max*100))}%`, height:"100%", background:rc, borderRadius:20 }}/></div>
                    </td>
                    <td style={{ padding:"12px 16px", fontFamily:F.mono, fontSize:11, color:T.textMuted }}>{item.daily} u/d</td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ fontFamily:F.display, fontSize:15, fontWeight:700, color:rc }}>{daysLeft}d</div>
                      <div style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, marginTop:1 }}>{item.qty}÷{item.daily}</div>
                    </td>
                    <td style={{ padding:"12px 16px" }}><Badge color={rc}>{isCrit?"Critical":isWarn?"Warning":"Normal"}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        {selected && (
          <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"fadeUp .2s ease" }}>
            <Panel>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:F.display, fontSize:14, fontWeight:700, color:T.text }}>{selected.name}</div>
                  <div style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, marginTop:2, letterSpacing:.5 }}>{selected.sku} · {selected.warehouse} · {selected.productId}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", color:T.textMuted }}>✕</button>
              </div>
              {loading && <Spinner label="RUNNING ML ANALYSIS…"/>}
              {err && <ErrBox msg={err}/>}
              {reorderRes && (
                <div style={{ background:`${(reorderRes.reorder_now||reorderRes.reorder_needed)?T.red:T.green}0D`, border:`1px solid ${(reorderRes.reorder_now||reorderRes.reorder_needed)?T.red:T.green}30`, borderRadius:10, padding:"14px 16px" }}>
                  <div style={{ fontFamily:F.mono, fontSize:9, fontWeight:700, color:(reorderRes.reorder_now||reorderRes.reorder_needed)?T.red:T.green, marginBottom:8, letterSpacing:1.5 }}>
                    {(reorderRes.reorder_now||reorderRes.reorder_needed)?"⚠ EMERGENCY REORDER NEEDED":"✓ STOCK ADEQUATE"}
                  </div>
                  {reorderRes.days_until_stockout!=null && (
                    <div style={{ marginBottom:8 }}>
                      <div style={{ fontFamily:F.display, fontSize:20, fontWeight:700, color:(reorderRes.reorder_now||reorderRes.reorder_needed)?T.red:T.green }}>{reorderRes.days_until_stockout.toFixed(1)} days to stockout</div>
                      <div style={{ fontFamily:F.body, fontSize:11, color:T.textMuted, marginTop:2 }}>ML estimate incl. lead time (5d) + supplier delay (2d) buffer</div>
                    </div>
                  )}
                  {reorderRes.recommended_order_qty!=null && <div style={{ fontFamily:F.body, fontSize:13, color:T.text, marginBottom:6 }}>Recommended order: <b>{reorderRes.recommended_order_qty.toLocaleString("en-IN")} units</b></div>}
                  {reorderRes.days_until_stockout!=null && (
                    <div style={{ marginTop:8, padding:"8px 10px", background:`${(reorderRes.reorder_now||reorderRes.reorder_needed)?T.red:T.green}15`, borderRadius:8 }}>
                      <div style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, marginBottom:2, letterSpacing:1 }}>REVENUE AT RISK (30-DAY)</div>
                      <div style={{ fontFamily:F.display, fontSize:16, fontWeight:700, color:(reorderRes.reorder_now||reorderRes.reorder_needed)?T.red:T.green }}>₹{calcRevenueAtRisk(reorderRes.days_until_stockout, selected.daily, selected.productId).toLocaleString("en-IN")}</div>
                    </div>
                  )}
                </div>
              )}
            </Panel>

            {reorderRes && (
              <Panel>
                <SectionLabel>EMERGENCY DISPATCH ROUTE</SectionLabel>
                <div style={{ fontFamily:F.body, fontSize:11, color:T.textMuted, marginBottom:10 }}>{selected.warehouse} → nearest hub ({NEAREST_HUB[selected.warehouse]||"Mumbai"})</div>
                {routeLoading && <Spinner small/>}
                {routeRes ? (
                  <div style={{ background:`${T.cyanDim}08`, border:`1px solid ${T.cyan}20`, borderRadius:10, padding:"14px 16px" }}>
                    <div style={{ fontFamily:F.mono, fontSize:9, color:T.cyan, fontWeight:600, marginBottom:8, letterSpacing:1 }}>ROUTE: {routeRes.origin} → {routeRes.destination}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                      {[["DISTANCE",`${routeRes.total_distance_km||"—"} km`],["LOGISTICS COST",`₹${(routeRes.total_fuel_cost_inr||0).toLocaleString("en-IN",{maximumFractionDigits:0})}`],["EST. TIME",routeRes.estimated_time||"~8-12 hrs"],["VEHICLE","Truck (Medium)"]].map(([l,v]) => (
                        <div key={l}><div style={{ fontFamily:F.mono, fontSize:8, color:T.textDim, marginBottom:2, letterSpacing:1 }}>{l}</div><div style={{ fontFamily:F.display, fontSize:14, fontWeight:700, color:T.text }}>{v}</div></div>
                      ))}
                    </div>
                    <div style={{ fontFamily:F.body, fontSize:11, color:T.cyan, background:`${T.cyan}08`, borderRadius:6, padding:"8px 10px" }}>
                      {(routeRes.total_fuel_cost_inr||0) < calcRevenueAtRisk(reorderRes.days_until_stockout, selected.daily, selected.productId) ? "✓ Dispatch economically justified" : "Monitor — cost exceeds current risk"}
                    </div>
                  </div>
                ) : !routeLoading && <Btn onClick={() => runRoute(selected)} variant="ghost" style={{ width:"100%", justifyContent:"center" }}>🗺 PLAN EMERGENCY ROUTE</Btn>}
              </Panel>
            )}

            {forecastD && forecastD.length > 0 && (
              <Panel>
                <SectionLabel>14-DAY DEMAND FORECAST</SectionLabel>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={forecastD}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="day" tick={{ fontSize:9, fill:T.textMuted, fontFamily:F.mono }} axisLine={false} tickLine={false} interval={2}/><YAxis tick={{ fontSize:9, fill:T.textMuted, fontFamily:F.mono }} axisLine={false} tickLine={false}/><Tooltip content={<TooltipCustom/>}/><Bar dataKey="demand" name="Forecast Demand" fill={T.cyanDim} radius={[3,3,0,0]} fillOpacity={.8}/></BarChart>
                </ResponsiveContainer>
              </Panel>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── REVENUE GUARD ──────────────────────────────────────────────────────────── */
function RevenueGuard() {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [computed, setComputed] = useState(false);

  const runAnalysis = async () => {
    setLoading(true); setResults([]);
    const items = [
      { name:"Steel Rods 12mm",       product:"PROD_001", warehouse:"Chennai",   stock:340, daily:12 },
      { name:"Electronic Capacitors", product:"PROD_002", warehouse:"Mumbai",    stock:18,  daily:8  },
      { name:"Cotton Fabric XL",      product:"PROD_003", warehouse:"Ahmedabad", stock:620, daily:25 },
      { name:"Brake Pads Set",        product:"PROD_002", warehouse:"Pune",      stock:9,   daily:4  },
      { name:"Rice (25kg Bags)",      product:"PROD_003", warehouse:"Kolkata",   stock:1200,daily:80 },
      { name:"Sulphuric Acid 98%",    product:"PROD_001", warehouse:"Hyderabad", stock:82,  daily:5  },
    ];
    const out = [];
    await Promise.allSettled(items.map(async item => {
      try {
        const [reorder, cost] = await Promise.all([
          callAPI("/reorder", { product_id:item.product, warehouse:item.warehouse, current_stock:item.stock, daily_sales:item.daily, lead_time_days:5, supplier_delay_days:2, is_promotion:0 }),
          callAPI("/cost", { origin:item.warehouse, destination:"Delhi", vehicle_type:"Truck", traffic_condition:"Medium", weight_kg:500, fuel_price_per_litre:100, driver_cost:1500, toll_charges:500 }),
        ]);
        const days = reorder.days_until_stockout ?? 30;
        const revRisk = calcRevenueAtRisk(days, item.daily, item.product);
        const actionC = Math.round(cost.predicted_cost_inr || 0);
        out.push({ ...item, days, revRisk, actionCost:actionC, savings:revRisk-actionC, reorderQty:reorder.recommended_order_qty, urgency:reorder.urgency, needsReorder:reorder.reorder_now||reorder.reorder_needed });
      } catch(e) {}
    }));
    out.sort((a,b) => b.revRisk - a.revRisk);
    setResults(out); setLoading(false); setComputed(true);
  };

  const totalRisk = results.reduce((s,r) => s + r.revRisk, 0);
  const totalSavable = results.filter(r => r.savings > 0).reduce((s,r) => s + r.savings, 0);
  const PIE_COLORS = [T.red, T.amber, T.cyanDim, T.purple];
  const pieData = useMemo(() => {
    if (!results.length) return [];
    const byProduct = {};
    results.forEach(r => { byProduct[r.product] = (byProduct[r.product] || 0) + r.revRisk; });
    return Object.entries(byProduct).map(([name, value]) => ({ name, value }));
  }, [results]);

  return (
    <div style={{ flex:1, overflow:"auto", padding:"28px 32px", background:T.bg }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <SectionLabel>Finance · Revenue Guard</SectionLabel>
          <h2 style={{ fontFamily:F.display, fontSize:26, fontWeight:700, color:T.text }}>Revenue Guard</h2>
          <p style={{ fontFamily:F.body, color:T.textMuted, fontSize:13, marginTop:4 }}>Quantify revenue at risk · Cost of action vs inaction · Dispatch decision support</p>
        </div>
        <Btn onClick={runAnalysis} disabled={loading}>{loading?"CALCULATING…":"₹ CALCULATE REVENUE RISK"}</Btn>
      </div>
      {loading && <Spinner label="CALCULATING REVENUE EXPOSURE…"/>}

      {computed && results.length > 0 && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:22 }}>
            <MetricCard label="Total Revenue at Risk (30d)" value={`₹${(totalRisk/100000).toFixed(1)}L`} sub="Exposed days × units/day × price × margin" icon="📉" accent={T.red}/>
            <MetricCard label="Items Requiring Action" value={String(results.filter(r=>r.needsReorder).length)} sub="Reorder triggered by ML model" icon="⚠" accent={T.amber}/>
            <MetricCard label="Recoverable if Acted Now" value={`₹${(totalSavable/100000).toFixed(1)}L`} sub="Where dispatch cost < revenue at risk" icon="📈" accent={T.green}/>
          </div>

          {pieData.length > 0 && (
            <Panel style={{ marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:32 }}>
                <div style={{ flex:1 }}>
                  <SectionLabel>REVENUE RISK BY PRODUCT</SectionLabel>
                  {pieData.map((d, i) => (
                    <div key={d.name} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:PIE_COLORS[i%PIE_COLORS.length], display:"inline-block", flexShrink:0 }}/>
                      <span style={{ fontFamily:F.mono, fontSize:12, color:T.text, fontWeight:600 }}>{d.name}</span>
                      <span style={{ fontFamily:F.display, fontSize:13, color:T.textMuted, marginLeft:"auto" }}>₹{(d.value/1000).toFixed(0)}K</span>
                      <span style={{ fontFamily:F.mono, fontSize:10, color:T.textDim }}>{totalRisk>0?Math.round(d.value/totalRisk*100):0}%</span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width={160} height={140}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={3} dataKey="value">{pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip formatter={(v) => [`₹${(v/1000).toFixed(0)}K`,"At Risk"]}/></PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {results.map((item, i) => {
              const verdict = item.savings>0?"ACT NOW":item.revRisk>0?"MONITOR":"NO RISK";
              const vc = verdict==="ACT NOW"?T.green:verdict==="MONITOR"?T.amber:T.textMuted;
              return (
                <Panel key={i} style={{ animation:`fadeUp .3s ease ${i*0.08}s both` }}>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:14, alignItems:"center" }}>
                    <div>
                      <div style={{ fontFamily:F.display, fontSize:13.5, fontWeight:700, color:T.text }}>{item.name}</div>
                      <div style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, marginTop:2, letterSpacing:.5 }}>{item.warehouse} · {item.product} · ₹{UNIT_PRICES[item.product]?.toLocaleString("en-IN")}/unit</div>
                      <div style={{ fontFamily:F.body, fontSize:11, color:T.textMuted, marginTop:3 }}>{item.daily} units/day · {item.days?.toFixed(1)}d to stockout</div>
                      {item.urgency && <div style={{ marginTop:6 }}><Badge color={item.urgency.toLowerCase()==="critical"?T.red:item.urgency.toLowerCase()==="high"?T.amber:T.cyan}>{item.urgency}</Badge></div>}
                    </div>
                    <div style={{ background:`${T.red}0D`, borderRadius:10, padding:"12px 14px", textAlign:"center", border:`1px solid ${T.red}20` }}>
                      <div style={{ fontFamily:F.mono, fontSize:8, color:T.red, fontWeight:700, marginBottom:4, letterSpacing:1 }}>AT RISK</div>
                      <div style={{ fontFamily:F.display, fontSize:17, fontWeight:700, color:T.red }}>₹{(item.revRisk/1000).toFixed(0)}K</div>
                      <div style={{ fontFamily:F.mono, fontSize:9, color:T.textMuted, marginTop:2 }}>{Math.max(0,30-item.days).toFixed(0)}d exposed</div>
                    </div>
                    <div style={{ background:`${T.cyanDim}08`, borderRadius:10, padding:"12px 14px", textAlign:"center", border:`1px solid ${T.cyan}20` }}>
                      <div style={{ fontFamily:F.mono, fontSize:8, color:T.cyan, fontWeight:700, marginBottom:4, letterSpacing:1 }}>DISPATCH COST</div>
                      <div style={{ fontFamily:F.display, fontSize:17, fontWeight:700, color:T.cyan }}>₹{(item.actionCost/1000).toFixed(0)}K</div>
                      <div style={{ fontFamily:F.mono, fontSize:9, color:T.textMuted, marginTop:2 }}>→ Delhi</div>
                    </div>
                    <div style={{ background:`${vc}0D`, borderRadius:10, padding:"12px 14px", textAlign:"center", border:`1px solid ${vc}20` }}>
                      <div style={{ fontFamily:F.mono, fontSize:8, color:vc, fontWeight:700, marginBottom:4, letterSpacing:1 }}>VERDICT</div>
                      <div style={{ fontFamily:F.display, fontSize:13, fontWeight:700, color:vc }}>{verdict}</div>
                      {item.savings!==0 && <div style={{ fontFamily:F.mono, fontSize:9, color:T.textMuted, marginTop:2 }}>{item.savings>0?`Save ₹${(item.savings/1000).toFixed(0)}K`:`Over ₹${(Math.abs(item.savings)/1000).toFixed(0)}K`}</div>}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>

          <div style={{ position:"sticky", bottom:0, marginTop:14, padding:"14px 20px", background:T.bgPanel, border:`1px solid ${T.borderAcc}`, borderRadius:12, display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:`0 0 20px ${T.cyanGlow}` }}>
            <div style={{ fontFamily:F.mono, fontSize:10, color:T.textDim, letterSpacing:1.5 }}>TOTAL — {results.length} SKUS ANALYSED</div>
            <div style={{ display:"flex", gap:28 }}>
              {[["TOTAL AT RISK",`₹${(totalRisk/100000).toFixed(1)}L`,T.red],["RECOVERABLE",`₹${(totalSavable/100000).toFixed(1)}L`,T.green],["NEED REORDER",`${results.filter(r=>r.needsReorder).length}/${results.length}`,T.text]].map(([l,v,c]) => (
                <div key={l} style={{ textAlign:"center" }}><div style={{ fontFamily:F.display, fontSize:18, fontWeight:700, color:c }}>{v}</div><div style={{ fontFamily:F.mono, fontSize:9, color:T.textDim, letterSpacing:1 }}>{l}</div></div>
              ))}
            </div>
          </div>
        </>
      )}

      {!computed && !loading && (
        <Panel style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:280 }}>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:44, marginBottom:12 }}>₹</div><div style={{ fontFamily:F.display, fontSize:18, fontWeight:700, color:T.text, marginBottom:8 }}>Calculate your revenue exposure</div><div style={{ fontFamily:F.body, fontSize:13, color:T.textMuted }}>Live ML stockout estimates × product unit prices × logistics dispatch cost</div></div>
        </Panel>
      )}
    </div>
  );
}

/* ─── RESILIENCE AGENT ───────────────────────────────────────────────────────── */
const AGENT_SUGGESTIONS = ["Should I dispatch from Mumbai today?", "Which warehouse needs urgent reorder?", "Is the Chennai-Bangalore corridor safe?", "Compare risk across all corridors"];

function parseIntent(q) {
  const lower = q.toLowerCase();
  const mentionedCity = ALL_CITIES.find(c => new RegExp(`\\b${c.toLowerCase()}\\b`).test(lower));
  return {
    mentionedCity,
    isDispatchQ:  /dispatch|send|ship|deliver|safe.*corridor|corridor.*safe/.test(lower),
    isStockoutQ:  /stock|reorder|inventory|shortage|running out/.test(lower),
    isRiskQ:      /risk|disruption|alert|danger|threat|score/.test(lower),
    isCompareQ:   /compare|all corridor|best route|lowest risk|highest risk|which city|which warehouse/.test(lower),
    isCostQ:      /cost|price|expensive|budget|spend/.test(lower),
    isWeatherQ:   /weather|rain|fog|storm|flood|cyclone/.test(lower),
  };
}

function ResilienceAgent() {
  const [query, setQuery]     = useState("");
  const [running, setRunning] = useState(false);
  const [steps, setSteps]     = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [probing, setProbing] = useState(false);
  const [probeRes, setProbeRes] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [steps, verdict]);

  const addStep = (icon, text, status = "done") => setSteps(prev => [...prev, { icon, text, status, id: Date.now() + Math.random() }]);
  const updateStep = (match, patch) => setSteps(prev => prev.map(s => s.text.includes(match) ? { ...s, ...patch } : s));

  const runAgent = async (q) => {
    const question = q || query;
    if (!question.trim()) return;
    setRunning(true); setSteps([]); setVerdict(null);
    const intent = parseIntent(question);
    const city = intent.mentionedCity || "Mumbai";
    const destCity = NEAREST_HUB[city] || "Delhi";
    addStep("🔍", `Parsing: "${question}"`, "done"); await new Promise(r => setTimeout(r, 300));
    addStep("🛣️", `Checking ${city} → ${destCity} corridor delay risk…`, "running");
    let delayRes, reorderRes, anomalyRes, costRes;
    try {
      const wx = intent.isWeatherQ ? "Rain" : "Clear";
      delayRes = await callAPI("/delay", { origin:city, destination:destCity, vehicle_type:"Truck", weather_condition:wx, traffic_condition:"Medium", departure_hour:10 });
      updateStep("corridor delay risk", { status:"done", result:`${(delayRes.delay_probability||0).toFixed(1)}% delay · Risk: ${delayRes.risk_level||"Medium"}` });
    } catch(e) { updateStep("corridor delay risk", { status:"error", result:"API unavailable" }); }
    await new Promise(r => setTimeout(r, 300));
    const sku = REAL_SKUS.find(s => s.warehouse === city) || { productId:"PROD_001", daily:20 };
    addStep("📦", `Checking inventory at ${city} (${sku.productId})…`, "running");
    try {
      anomalyRes = await callAPI("/anomaly/inventory", { product_id:sku.productId, warehouse:city, current_stock:400, daily_sales:sku.daily, expected_stock:500, actual_stock:400 });
      updateStep(`inventory at ${city}`, { status:"done", result:`Anomaly: ${anomalyRes.is_anomaly?"⚠ Detected":"✓ None"} · Score: ${(anomalyRes.anomaly_score||0).toFixed(3)}` });
    } catch(e) { updateStep(`inventory at ${city}`, { status:"error", result:"API unavailable" }); }
    await new Promise(r => setTimeout(r, 300));
    addStep("📋", `Running reorder model for ${city}…`, "running");
    try {
      reorderRes = await callAPI("/reorder", { product_id:sku.productId, warehouse:city, current_stock:400, daily_sales:sku.daily, lead_time_days:5, supplier_delay_days:2, is_promotion:0 });
      updateStep(`reorder model for ${city}`, { status:"done", result:`${reorderRes.days_until_stockout?.toFixed(1)}d to stockout · Urgency: ${reorderRes.urgency||"Medium"}` });
    } catch(e) { updateStep(`reorder model for ${city}`, { status:"error", result:"API unavailable" }); }
    await new Promise(r => setTimeout(r, 300));
    addStep("💰", `Estimating dispatch cost: ${city} → ${destCity}…`, "running");
    try {
      costRes = await callAPI("/cost", { origin:city, destination:destCity, vehicle_type:"Truck", traffic_condition:"Medium", weight_kg:500, fuel_price_per_litre:100, driver_cost:1500, toll_charges:500 });
      updateStep("dispatch cost", { status:"done", result:`₹${(costRes.predicted_cost_inr||0).toLocaleString("en-IN",{maximumFractionDigits:0})} · 500kg Truck` });
    } catch(e) { updateStep("dispatch cost", { status:"error", result:"API unavailable" }); }
    await new Promise(r => setTimeout(r, 300));
    let corridorComparison = null;
    if (intent.isCompareQ) {
      addStep("🔄", "Scanning all major corridors for comparison…", "running");
      const corridors = [["Mumbai","Delhi"],["Chennai","Bangalore"],["Kolkata","Hyderabad"],["Pune","Jaipur"],["Ahmedabad","Mumbai"]];
      const res2 = [];
      await Promise.allSettled(corridors.map(async ([o,d]) => {
        try {
          const s = REAL_SKUS.find(x => x.warehouse===o) || { productId:"PROD_001", daily:20 };
          const [dl, ro] = await Promise.all([callAPI("/delay",{origin:o,destination:d,vehicle_type:"Truck",weather_condition:"Clear",traffic_condition:"Medium",departure_hour:10}),callAPI("/reorder",{product_id:s.productId,warehouse:o,current_stock:400,daily_sales:s.daily,lead_time_days:5,supplier_delay_days:2,is_promotion:0})]);
          res2.push({ route:`${o}→${d}`, delayProb:dl.delay_probability||0, days:ro.days_until_stockout||30, score:calcDisruptionScore(dl.delay_probability, null, ro.days_until_stockout, false) });
        } catch(e) {}
      }));
      res2.sort((a,b) => b.score - a.score); corridorComparison = res2;
      updateStep("Scanning all major corridors", { status:"done", result:`${res2.length} corridors scanned` });
      await new Promise(r => setTimeout(r, 300));
    }
    addStep("🧠", "Synthesising signals → generating verdict…", "running");
    await new Promise(r => setTimeout(r, 500));
    const delayProb = delayRes?.delay_probability || 0;
    const daysLeft = reorderRes?.days_until_stockout || 30;
    const hasAnomaly = anomalyRes?.is_anomaly || false;
    const score = calcDisruptionScore(delayProb, anomalyRes?.anomaly_score, daysLeft, hasAnomaly);
    const risk = score > 70 ? "HIGH" : score > 45 ? "MEDIUM" : "LOW";
    const revRisk = calcRevenueAtRisk(daysLeft, sku.daily, sku.productId);
    const dispatchCost = costRes?.predicted_cost_inr || 0;
    const actions = [];
    if (intent.isDispatchQ) {
      if (delayProb > 60) actions.push(`⚠ Delay risk on ${city}→${destCity} is HIGH at ${delayProb.toFixed(0)}%. Recommend departing before 6 AM or rerouting. Do not dispatch without contingency plan.`);
      else if (delayProb > 30) actions.push(`Moderate delay risk (${delayProb.toFixed(0)}%) on ${city}→${destCity}. Dispatch feasible — build 2-hour buffer into delivery commitments.`);
      else actions.push(`✓ ${city}→${destCity} corridor is clear — delay probability only ${delayProb.toFixed(0)}%. Green light to proceed.`);
      if (dispatchCost > 0) actions.push(`Dispatch cost (₹${(dispatchCost/1000).toFixed(0)}K) vs revenue at risk (₹${(revRisk/1000).toFixed(0)}K): ${dispatchCost < revRisk ? "economically justified — act now." : "cost exceeds current risk — monitor situation."}`);
    }
    if (intent.isStockoutQ || (reorderRes?.reorder_now || reorderRes?.reorder_needed)) {
      if (daysLeft < 7) actions.push(`🚨 CRITICAL: ${city} has only ${daysLeft.toFixed(1)} days of ${sku.productId} remaining. Trigger emergency reorder immediately.`);
      else if (daysLeft < 14) actions.push(`⚠ ${city} approaching reorder threshold — ${daysLeft.toFixed(1)} days of stock. Place reorder within 48 hours.`);
      else actions.push(`Stock at ${city} is healthy — ${daysLeft.toFixed(1)} days of ${sku.productId} remaining. Next review in 7 days.`);
    }
    if (intent.isRiskQ) actions.push(`Disruption score for ${city}: ${score}/100 (${risk}). ${score>70?"Immediate mitigation recommended.":score>45?"Monitor closely and prepare contingency suppliers.":"Within acceptable tolerance."}`);
    if (hasAnomaly) actions.push(`🔍 Inventory anomaly at ${city}. Investigate for data errors, unexpected consumption, or unreported damage.`);
    if (intent.isCompareQ && corridorComparison?.length > 0) {
      const safest = corridorComparison[corridorComparison.length-1];
      const riskiest = corridorComparison[0];
      actions.push(`Safest corridor: ${safest.route} — score ${safest.score}/100, ${safest.delayProb.toFixed(0)}% delay risk. Prioritise this route.`);
      actions.push(`Highest risk: ${riskiest.route} (score ${riskiest.score}/100). Pre-position safety stock at ${riskiest.route.split("→")[0]}.`);
    }
    if (actions.length === 0) actions.push(`No immediate action required for ${city}. Resilience score ${score}/100 (${risk}), delay ${delayProb.toFixed(0)}%, ${daysLeft.toFixed(1)}d of stock. Continue standard monitoring.`);
    updateStep("Synthesising", { status:"done" });
    setVerdict({ question, city, score, risk, delayProb, daysLeft, revRisk, actions, corridorComparison, intent, dispatchCost });
    setRunning(false);
  };

  const runProbeAll = async () => {
    setProbing(true); setProbeRes(null);
    const corridors = [["Mumbai","Delhi"],["Chennai","Bangalore"],["Kolkata","Hyderabad"],["Pune","Jaipur"],["Ahmedabad","Mumbai"],["Hyderabad","Delhi"]];
    const alerts = [];
    await Promise.allSettled(corridors.map(async ([o,d]) => {
      try {
        const sku = REAL_SKUS.find(s => s.warehouse===o) || { productId:"PROD_001", daily:20 };
        const [delay, reorder] = await Promise.all([callAPI("/delay",{origin:o,destination:d,vehicle_type:"Truck",weather_condition:"Clear",traffic_condition:"Medium",departure_hour:10}),callAPI("/reorder",{product_id:sku.productId,warehouse:o,current_stock:400,daily_sales:sku.daily,lead_time_days:5,supplier_delay_days:2,is_promotion:0})]);
        const score = calcDisruptionScore(delay.delay_probability, null, reorder.days_until_stockout, false);
        alerts.push({ route:`${o}→${d}`, score, delayProb:delay.delay_probability||0, days:reorder.days_until_stockout||30, urgency:reorder.urgency, reorderNeeded:reorder.reorder_now||reorder.reorder_needed });
      } catch(e) {}
    }));
    alerts.sort((a,b) => b.score-a.score); setProbeRes(alerts); setProbing(false);
  };

  const STEP_COLOR = { done: T.green, running: T.amber, error: T.red };

  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", background:T.bg }}>
      {/* Header */}
      <div style={{ padding:"22px 32px 16px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <SectionLabel>Intelligence · Resilience Agent</SectionLabel>
            <h2 style={{ fontFamily:F.display, fontSize:22, fontWeight:700, color:T.text }}>Resilience Agent</h2>
            <p style={{ fontFamily:F.body, color:T.textMuted, fontSize:13, marginTop:3 }}>Ask anything — agent calls live ML endpoints and adapts its analysis to your question</p>
          </div>
          <Btn onClick={runProbeAll} disabled={probing} variant="ghost">{probing?"SCANNING…":"⚡ SCAN ALL CORRIDORS"}</Btn>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {AGENT_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => { setQuery(s); runAgent(s); }} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${T.border}`, background:T.bgCard, fontFamily:F.mono, fontSize:10, color:T.textMuted, cursor:"pointer", letterSpacing:.3 }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:"auto", padding:"20px 32px" }}>
        {probing && <Spinner label="SCANNING ALL CORRIDORS…"/>}
        {probeRes && (
          <div style={{ marginBottom:20, animation:"fadeUp .3s ease" }}>
            <SectionLabel>PROACTIVE SCAN — {new Date().toLocaleTimeString("en-IN")}</SectionLabel>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
              {probeRes.map((a, i) => (
                <div key={i} style={{ background:`${RISK_COLOR(a.score)}08`, border:`1px solid ${RISK_COLOR(a.score)}20`, borderRadius:10, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:F.display, fontSize:13, fontWeight:600, color:T.text }}>{a.route}</div>
                    <div style={{ fontFamily:F.mono, fontSize:10, color:T.textMuted, marginTop:2, letterSpacing:.3 }}>
                      Delay: {a.delayProb.toFixed(0)}% · {a.days.toFixed(1)}d to stockout{a.reorderNeeded&&<span style={{ color:T.red }}> · ⚠ Reorder</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:F.display, fontSize:18, fontWeight:700, color:RISK_COLOR(a.score) }}>{a.score}</div>
                    <div style={{ fontFamily:F.mono, fontSize:9, color:T.textDim }}>/100</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {steps.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <SectionLabel>AGENT REASONING STEPS</SectionLabel>
            {steps.map(step => (
              <div key={step.id} style={{ display:"flex", gap:12, marginBottom:10, animation:"slideR .3s ease" }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:`${STEP_COLOR[step.status]}15`, border:`1px solid ${STEP_COLOR[step.status]}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>
                  {step.status==="running"?<div style={{ width:10,height:10,borderRadius:"50%",border:`2px solid ${T.amber}`,borderTopColor:"transparent",animation:"spin 0.7s linear infinite" }}/>:step.icon}
                </div>
                <div style={{ flex:1, paddingTop:4 }}>
                  <div style={{ fontFamily:F.body, fontSize:13, color:T.text }}>{step.text}</div>
                  {step.result && <div style={{ fontFamily:F.mono, fontSize:10, color:T.cyan, marginTop:2, letterSpacing:.3 }}>→ {step.result}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {verdict && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            <SectionLabel>AGENT VERDICT</SectionLabel>
            <Panel glow style={{ borderLeft:`3px solid ${verdict.risk==="HIGH"?T.red:verdict.risk==="MEDIUM"?T.amber:T.green}`, borderRadius:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                <div style={{ fontFamily:F.display, fontSize:16, fontWeight:600, color:T.text, maxWidth:"65%", fontStyle:"italic" }}>"{verdict.question}"</div>
                <div style={{ background:`${verdict.risk==="HIGH"?T.red:verdict.risk==="MEDIUM"?T.amber:T.green}15`, border:`1px solid ${verdict.risk==="HIGH"?T.red:verdict.risk==="MEDIUM"?T.amber:T.green}40`, borderRadius:8, padding:"8px 16px", textAlign:"center" }}>
                  <div style={{ fontFamily:F.display, fontSize:22, fontWeight:700, color:verdict.risk==="HIGH"?T.red:verdict.risk==="MEDIUM"?T.amber:T.green }}>{verdict.score}<span style={{ fontSize:11, color:T.textMuted }}>/100</span></div>
                  <div style={{ fontFamily:F.mono, fontSize:9, color:verdict.risk==="HIGH"?T.red:verdict.risk==="MEDIUM"?T.amber:T.green, letterSpacing:1 }}>{verdict.risk} RISK</div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
                {[["DELAY PROB",`${verdict.delayProb.toFixed(1)}%`,verdict.delayProb>50?T.red:verdict.delayProb>25?T.amber:T.green],["DAYS TO STOCKOUT",`${verdict.daysLeft.toFixed(1)}d`,verdict.daysLeft<7?T.red:verdict.daysLeft<14?T.amber:T.green],["REVENUE AT RISK",`₹${(verdict.revRisk/1000).toFixed(0)}K`,verdict.revRisk>50000?T.red:T.amber],["DISPATCH COST",`₹${(verdict.dispatchCost/1000).toFixed(0)}K`,T.cyan]].map(([l,v,c]) => (
                  <div key={l} style={{ background:T.bgPanel, borderRadius:9, padding:"10px 12px", border:`1px solid ${T.border}` }}>
                    <div style={{ fontFamily:F.mono, fontSize:8, color:T.textDim, marginBottom:4, letterSpacing:1 }}>{l}</div>
                    <div style={{ fontFamily:F.display, fontSize:16, fontWeight:700, color:c }}>{v}</div>
                  </div>
                ))}
              </div>

              {verdict.corridorComparison && (
                <div style={{ marginBottom:16 }}>
                  <SectionLabel>CORRIDOR COMPARISON</SectionLabel>
                  {verdict.corridorComparison.map((c, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 10px", background:i===0?`${T.red}0D`:i===verdict.corridorComparison.length-1?`${T.green}0D`:T.bgPanel, borderRadius:7, marginBottom:4, border:`1px solid ${i===0?T.red:i===verdict.corridorComparison.length-1?T.green:T.border}20` }}>
                      <span style={{ fontFamily:F.display, fontSize:12, fontWeight:700, color:T.text, flex:1 }}>{c.route}</span>
                      <span style={{ fontFamily:F.mono, fontSize:10, color:T.textMuted }}>{c.delayProb.toFixed(0)}% delay</span>
                      <span style={{ fontFamily:F.mono, fontSize:10, color:T.textMuted }}>{c.days.toFixed(1)}d stock</span>
                      <span style={{ fontFamily:F.display, fontSize:13, fontWeight:700, color:RISK_COLOR(c.score) }}>{c.score}/100</span>
                    </div>
                  ))}
                </div>
              )}

              <SectionLabel>RECOMMENDED ACTIONS</SectionLabel>
              {verdict.actions.map((a, i) => (
                <div key={i} style={{ display:"flex", gap:10, padding:"9px 12px", background:T.bgPanel, borderRadius:8, marginBottom:6, border:`1px solid ${T.border}` }}>
                  <span style={{ fontFamily:F.mono, fontSize:9, fontWeight:700, color:T.cyan, flexShrink:0, marginTop:1 }}>{String(i+1).padStart(2,"0")}</span>
                  <span style={{ fontFamily:F.body, fontSize:12.5, color:T.text }}>{a}</span>
                </div>
              ))}
            </Panel>
          </div>
        )}

        {steps.length === 0 && !probeRes && (
          <Panel style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:200 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>⚡</div>
              <div style={{ fontFamily:F.display, fontSize:16, fontWeight:700, color:T.text, marginBottom:6 }}>Ask the Resilience Agent</div>
              <div style={{ fontFamily:F.body, fontSize:13, color:T.textMuted, maxWidth:400 }}>Dispatch decisions, stockout risks, corridor comparisons, weather impact, cost analysis — the agent adapts to your question.</div>
            </div>
          </Panel>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:"14px 32px", borderTop:`1px solid ${T.border}`, background:T.bgPanel, display:"flex", gap:12 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && !running && runAgent()} placeholder="e.g. Is it safe to dispatch from Chennai today? Which warehouse is closest to stockout? Compare all corridors…" style={{ flex:1, padding:"11px 16px", border:`1px solid ${T.border}`, borderRadius:10, fontFamily:F.mono, fontSize:12, color:T.text, background:T.bgInput, outline:"none", letterSpacing:.3 }} onFocus={e => e.target.style.borderColor=T.cyan} onBlur={e => e.target.style.borderColor=T.border}/>
        <Btn onClick={() => runAgent()} disabled={running || !query.trim()}>
          {running ? <><div style={{ width:12,height:12,borderRadius:"50%",border:`2px solid ${T.cyan}`,borderTopColor:"transparent",animation:"spin 0.7s linear infinite" }}/> THINKING…</> : "⚡ ASK AGENT →"}
        </Btn>
      </div>
    </div>
  );
}

/* ─── SIDEBAR ─────────────────────────────────────────────────────────────────── */
function Sidebar({ active, onNav, user, onLogout }) {
  return (
    <div style={{ width:220, background:T.bgPanel, display:"flex", flexDirection:"column", height:"100vh", flexShrink:0, borderRight:`1px solid ${T.border}`, position:"relative" }}>
      {/* Scan accent */}
      <div style={{ position:"absolute", top:0, left:0, width:"100%", height:1, background:`linear-gradient(90deg, transparent, ${T.cyan}40, transparent)` }}/>

      <div style={{ padding:"22px 18px 16px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:`${T.cyan}12`, border:`1px solid ${T.cyan}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⛓</div>
          <div>
            <div style={{ fontFamily:F.display, color:T.text, fontWeight:700, fontSize:12 }}>Resilience AI</div>
            <div style={{ fontFamily:F.mono, color:T.textDim, fontSize:8, letterSpacing:2 }}>PAN INDIA</div>
          </div>
        </div>
      </div>

      <div style={{ padding:"14px 10px", flex:1, overflowY:"auto" }}>
        <div style={{ fontFamily:F.mono, fontSize:8, color:T.textDim, letterSpacing:2, padding:"0 10px", marginBottom:10 }}>NAVIGATION</div>
        {NAV.map(n => {
          const on = active===n.id;
          return (
            <div key={n.id} onClick={() => onNav(n.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, marginBottom:2, cursor:"pointer", background:on?`${T.cyan}10`:"transparent", borderLeft:on?`2px solid ${T.cyan}`:"2px solid transparent", transition:"all .15s" }}
              onMouseOver={e => !on && (e.currentTarget.style.background=T.bgCardHi)}
              onMouseOut={e => !on && (e.currentTarget.style.background="transparent")}>
              <span style={{ fontSize:13, color:on?T.cyan:T.textMuted, width:16, textAlign:"center", fontFamily:F.mono }}>{n.icon}</span>
              <span style={{ fontFamily:F.body, fontSize:12.5, color:on?T.text:T.textMuted, fontWeight:on?600:400, flex:1 }}>{n.label}</span>
              {on && <div style={{ width:4, height:4, borderRadius:"50%", background:T.cyan, animation:"glow 2s infinite" }}/>}
            </div>
          );
        })}
      </div>

      <div style={{ padding:"12px 14px", borderTop:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:`${T.cyan}18`, border:`1px solid ${T.cyan}30`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.mono, fontSize:11, color:T.cyan, fontWeight:700 }}>{user?.name?.[0]?.toUpperCase()||"U"}</div>
          <div>
            <div style={{ fontFamily:F.body, color:T.text, fontSize:12, fontWeight:600 }}>{user?.name||"User"}</div>
            <div style={{ fontFamily:F.mono, color:T.textDim, fontSize:8, textTransform:"capitalize", letterSpacing:.5 }}>{user?.role?.replace(/_/g," ")}</div>
          </div>
        </div>
        <div onClick={onLogout} style={{ fontFamily:F.mono, fontSize:10, color:T.red, cursor:"pointer", textAlign:"center", padding:"6px", background:`${T.red}10`, borderRadius:6, letterSpacing:1, border:`1px solid ${T.red}20` }}>SIGN OUT</div>
      </div>
    </div>
  );
}

function MainLayout({ user, onLogout }) {
  const [page, setPage] = useState("command");
  const render = () => {
    switch(page) {
      case "command":  return <CommandCenter onNav={setPage}/>;
      case "radar":    return <DisruptionRadar/>;
      case "cascade":  return <ImpactCascade/>;
      case "stockout": return <StockoutShield/>;
      case "revenue":  return <RevenueGuard/>;
      case "agent":    return <ResilienceAgent/>;
      default:         return <CommandCenter onNav={setPage}/>;
    }
  };
  return (
    <div style={{ display:"flex", width:"100vw", height:"100vh", background:T.bg, overflow:"hidden" }}>
      <Sidebar active={page} onNav={setPage} user={user} onLogout={onLogout}/>
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>{render()}</div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState("login");
  const [user, setUser]     = useState(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_STYLE;
    document.head.appendChild(style);
    fetch(`${API_BASE}/delay?origin=Mumbai&destination=Delhi&vehicle_type=Truck&weather_condition=Clear&traffic_condition=Medium&departure_hour=10`).catch(() => {});
  }, []);

  const handleLogin  = (u) => { setUser(u);   setScreen("app"); };
  const handleLogout = ()  => { setUser(null); setScreen("login"); };
  if (screen==="app" && user)  return <MainLayout user={user} onLogout={handleLogout}/>;
  if (screen==="register")     return <RegisterPage onSwitch={() => setScreen("login")} onLogin={handleLogin}/>;
  return <LoginPage onSwitch={() => setScreen("register")} onLogin={handleLogin}/>;
}