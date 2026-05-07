// Lattice App — fluxo de análise conectado
// Telas: Conectar → Auditoria → Brand Studio → Outreach

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const API = 'https://linink-analyser-production.up.railway.app';

// ---------- Tweak defaults ----------
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "violet",
  "showCopilot": true,
  "showAmbient": true,
  "showGrain": true
}/*EDITMODE-END*/;

const ACCENTS = {
  violet:  { name: "Violet",  glow: "oklch(0.72 0.18 280)", soft: "oklch(0.55 0.16 280)", deep: "oklch(0.32 0.12 280)" },
  ember:   { name: "Ember",   glow: "oklch(0.78 0.16 32)",  soft: "oklch(0.60 0.15 32)",  deep: "oklch(0.34 0.11 32)" },
  jade:    { name: "Jade",    glow: "oklch(0.78 0.13 162)", soft: "oklch(0.60 0.12 162)", deep: "oklch(0.32 0.09 162)" },
  ice:     { name: "Ice",     glow: "oklch(0.78 0.13 220)", soft: "oklch(0.60 0.13 220)", deep: "oklch(0.32 0.10 220)" }
};

// Mapeamento de categoria (EN, como retornado pela API) → tela/alvo
// Também inclui variantes em PT caso a IA retorne traduzido
const CATEGORY_MAP = {
  // Inglês (padrão da API)
  headline:        { screen: "brand", target: "headline" },
  summary:         { screen: "brand", target: "bio" },
  experience:      { screen: "brand", target: "bio" },
  skills:          { screen: "brand", target: "headline" },
  education:       { screen: "brand", target: "bio" },
  recommendations: { screen: "outreach", target: "post" },
  connections:     { screen: "outreach", target: "ramp" },
  activity:        { screen: "outreach", target: "post" },
  completeness:    { screen: "brand", target: "bio" },
  keywords:        { screen: "brand", target: "headline" },
  // Variantes em PT (fallback)
  'título profissional': { screen: "brand", target: "headline" },
  'título':              { screen: "brand", target: "headline" },
  'resumo':              { screen: "brand", target: "bio" },
  'sobre':               { screen: "brand", target: "bio" },
  'experiência':         { screen: "brand", target: "bio" },
  'experiencias':        { screen: "brand", target: "bio" },
  'habilidades':         { screen: "brand", target: "headline" },
  'competências':        { screen: "brand", target: "headline" },
  'educação':            { screen: "brand", target: "bio" },
  'formação':            { screen: "brand", target: "bio" },
  'recomendações':       { screen: "outreach", target: "post" },
  'conexões':            { screen: "outreach", target: "ramp" },
  'atividade':           { screen: "outreach", target: "post" },
  'completude':          { screen: "brand", target: "bio" },
  'preenchimento':       { screen: "brand", target: "bio" },
  'palavras-chave':      { screen: "brand", target: "headline" },
};

function generateThreadsFromBreakdown(breakdown) {
  return breakdown
    .filter(item => (item.score / item.max_score) < 0.85)
    .sort((a, b) => (a.score / a.max_score) - (b.score / b.max_score))
    .slice(0, 5)
    .map((item, i) => {
      const cat = item.category.toLowerCase();
      const mapped = CATEGORY_MAP[cat] || { screen: "brand", target: "bio" };
      const pct = item.score / item.max_score;
      return {
        id: `T${String(i + 1).padStart(2, '0')}`,
        n: String(i + 1).padStart(2, '0'),
        area: item.category,
        title: item.suggestions?.[0] || `Melhorar ${item.category}`,
        lift: Math.max(1, Math.round((1 - pct) * 10)),
        severity: pct < 0.5 ? 'high' : pct < 0.7 ? 'medium' : 'low',
        note: item.suggestions?.slice(1, 3).join(' ') || '',
        screen: mapped.screen,
        target: mapped.target,
        resolved: false,
      };
    });
}

async function apiFetch(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(err.detail || 'Erro na API');
  }
  return res.json();
}

// ---------- Gradiente ambiente ----------
function AmbientField({ accent, visible }) {
  if (!visible) return null;
  const a = ACCENTS[accent];
  return (
    <div className="ambient" aria-hidden>
      <div className="blob b1" style={{ background: `radial-gradient(closest-side, ${a.glow}, transparent 70%)` }} />
      <div className="blob b2" style={{ background: `radial-gradient(closest-side, ${a.deep}, transparent 70%)` }} />
      <div className="blob b3" style={{ background: `radial-gradient(closest-side, ${a.soft}, transparent 70%)` }} />
    </div>
  );
}

const Mono = ({ children, className="", ...p }) => <span className={`mono ${className}`} {...p}>{children}</span>;

// ---------- Barra lateral ----------
function Sidebar({ screen, setScreen, threads }) {
  const items = [
    { k: "connect",  label: "Conectar",     icon: "M3 12h18M3 6h18M3 18h18" },
    { k: "audit",    label: "Auditoria",    icon: "M3 12c4-8 14-8 18 0" },
    { k: "brand",    label: "Brand Studio", icon: "M4 20l4-12 4 8 4-4 4 8" },
    { k: "outreach", label: "Outreach",     icon: "M3 5h18v12H8l-5 4z" },
  ];
  return (
    <aside className="sidebar">
      <div className="side-brand">
        <span className="brand-glyph">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14l3 3 3-3-3 3z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
        </span>
        <span className="brand-name">Lattice</span>
      </div>
      <nav className="side-nav">
        {items.map(it => {
          const open = threads.filter(t => t.screen === it.k && !t.resolved).length;
          return (
            <button key={it.k} className={`side-link ${screen === it.k ? "on" : ""}`} onClick={() => setScreen(it.k)}>
              <svg viewBox="0 0 24 24" width="16" height="16"><path d={it.icon} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
              <span>{it.label}</span>
              {open > 0 && <Mono className="side-badge">{open}</Mono>}
            </button>
          );
        })}
      </nav>
      <div className="side-foot">
        <div className="user-row">
          <div className="avatar">L</div>
          <div>
            <div className="user-name">Lattice</div>
            <Mono className="user-sub">copiloto de carreira</Mono>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ---------- Header de pontuação ----------
function ScoreHeader({ score, prevScore, threads, accent }) {
  const a = ACCENTS[accent];
  const open = threads.filter(t => !t.resolved).length;
  const resolved = threads.length - open;
  const delta = score - prevScore;
  return (
    <header className="scorebar">
      <div className="scorebar-left">
        <div className="score-block">
          <span className="score-num-big">{score}</span>
          <div className="score-meta">
            <Mono className="score-lbl">pontuação geral</Mono>
            {delta !== 0 && (
              <Mono className="score-delta" style={{ color: a.glow }}>
                {delta > 0 ? "▲" : "▽"} {Math.abs(delta)}
              </Mono>
            )}
          </div>
        </div>
        <div className="score-divider" />
        <div className="thread-count">
          <Mono>pendências</Mono>
          <div className="thread-pips">
            {threads.map(t => (
              <span key={t.id} className={`pip ${t.resolved ? "done" : ""}`} title={t.title} />
            ))}
          </div>
          <Mono className="thread-frac">{resolved}/{threads.length}</Mono>
        </div>
      </div>
      <div className="scorebar-right">
        <div className="session-pill">
          <span className="pulse-dot" style={{ background: a.glow, boxShadow: `0 0 10px ${a.glow}` }} />
          <Mono>sessão · ao vivo</Mono>
        </div>
      </div>
    </header>
  );
}

// ---------- Bandeja de pendências ----------
function ThreadTray({ threads, onOpen, accent }) {
  const [open, setOpen] = useState(true);
  const a = ACCENTS[accent];
  const unresolved = threads.filter(t => !t.resolved);
  if (unresolved.length === 0) return (
    <div className="thread-tray empty">
      <Mono>todas resolvidas · ▲ {threads.reduce((s,t) => s + t.lift, 0)} pts ganhos</Mono>
    </div>
  );
  return (
    <div className={`thread-tray ${open ? "open" : ""}`}>
      <button className="tray-toggle" onClick={() => setOpen(!open)}>
        <Mono>pendências abertas · {unresolved.length}</Mono>
        <span className="caret">{open ? "▾" : "▴"}</span>
      </button>
      {open && (
        <div className="tray-list">
          {unresolved.map(t => (
            <button key={t.id} className={`tray-item sev-${t.severity}`} onClick={() => onOpen(t)}>
              <Mono className="tray-num">{t.n}</Mono>
              <div className="tray-body">
                <Mono className="tray-area">{t.area}</Mono>
                <span className="tray-title">{t.title}</span>
              </div>
              <Mono className="tray-lift" style={{ color: a.glow }}>+{t.lift}</Mono>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Painel copiloto ----------
function CopilotRail({ context, accent, visible }) {
  if (!visible) return null;
  const a = ACCENTS[accent];
  return (
    <aside className="copilot">
      <div className="copilot-head">
        <span className="copilot-glyph" style={{ background: a.glow }} />
        <Mono>estrategista</Mono>
      </div>
      <div className="copilot-body">
        {context.map((m, i) => (
          <div key={i} className={`co-msg co-${m.kind}`}>
            {m.kind === "think" && <div className="thinking"><span/><span/><span/></div>}
            <p>{m.text}</p>
            {m.lift && <Mono className="co-lift" style={{ color: a.glow }}>+{m.lift} esperado</Mono>}
          </div>
        ))}
      </div>
      <div className="copilot-foot">
        <Mono>silencioso quando não há nada útil a dizer</Mono>
      </div>
    </aside>
  );
}

// ============================================================
// TELA: CONECTAR — upload de PDF
// ============================================================
function ConnectScreen({ onComplete, accent }) {
  const a = ACCENTS[accent];
  const [stage, setStage] = useState("idle"); // idle | scanning | done | error
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const phases = [
    "Lendo headline e posicionamento",
    "Analisando seção Sobre",
    "Mapeando experiências",
    "Indexando habilidades",
    "Avaliando cadência de atividade",
    "Compondo diagnóstico",
  ];

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErrMsg('Apenas arquivos PDF são aceitos');
      return;
    }
    setErrMsg('');
    setFile(f);
  };

  const handleScan = async () => {
    if (!file || stage !== "idle") return;
    setStage("scanning");
    setProgress(0);
    setErrMsg("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setProgress(p => Math.min(88, p + (i < 8 ? 6 : 1)));
      setPhase(phases[Math.min(phases.length - 1, Math.floor(i / 4))]);
    }, 220);
    try {
      const form = new FormData();
      form.append('pdf_file', file);
      const res = await fetch(`${API}/profile/analyze-pdf`, { method: 'POST', body: form });
      clearInterval(id);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
        throw new Error(err.detail || 'Análise falhou');
      }
      const data = await res.json();
      setProgress(100);
      setPhase("Diagnóstico pronto.");
      setStage("done");
      setTimeout(() => onComplete(data), 900);
    } catch (e) {
      clearInterval(id);
      setStage("error");
      setErrMsg(e.message);
    }
  };

  const reset = () => { setStage("idle"); setFile(null); setProgress(0); setErrMsg(""); };

  return (
    <div className="screen connect-screen" data-screen-label="Conectar">
      <div className="connect-shell">
        <Mono className="connect-eyebrow">passo 01 · conectar</Mono>
        <h1 className="connect-h1">
          Envie seu PDF do LinkedIn.<br/>
          <em style={{ color: a.glow }}>Vamos ler como um estrategista.</em>
        </h1>
        <p className="connect-sub">
          Exporte seu perfil do LinkedIn (Mais → Salvar como PDF) e envie aqui.
          O Lattice analisa 18 sinais — posicionamento, cadência, convicção. Nada é publicado.
        </p>

        {stage === "idle" && (
          <div style={{display:'flex',flexDirection:'column',gap:'14px',maxWidth:'440px'}}>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{
                border: `1.5px dashed ${file ? a.glow : dragOver ? a.soft : 'oklch(0.32 0.02 270)'}`,
                borderRadius: '10px',
                padding: '32px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color .2s, background .2s',
                background: file ? `color-mix(in oklch, ${a.deep} 30%, transparent)` : dragOver ? 'oklch(0.20 0.02 270)' : 'transparent',
              }}
            >
              <input ref={inputRef} type="file" accept=".pdf,application/pdf" style={{display:'none'}}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                style={{margin:'0 auto 12px',display:'block',color: file ? a.glow : 'oklch(0.48 0.02 270)'}}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {file ? (
                <>
                  <p style={{color: a.glow, fontWeight: 500, fontSize: '13px', marginBottom: '4px'}}>{file.name}</p>
                  <Mono style={{color: 'oklch(0.50 0.02 270)', fontSize: '11px'}}>{(file.size / 1024).toFixed(0)} KB · clique para trocar</Mono>
                </>
              ) : (
                <>
                  <p style={{fontWeight: 500, fontSize: '13px', marginBottom: '4px', color: 'oklch(0.85 0.01 270)'}}>Arraste o PDF do LinkedIn aqui</p>
                  <Mono style={{color: 'oklch(0.50 0.02 270)', fontSize: '11px'}}>ou clique para selecionar</Mono>
                </>
              )}
            </div>
            {errMsg && <Mono style={{color: 'oklch(0.65 0.18 28)', fontSize: '12px'}}>{errMsg}</Mono>}
            <button className="btn-primary lg" disabled={!file} onClick={handleScan}
              style={{opacity: file ? 1 : 0.38, cursor: file ? 'default' : 'not-allowed'}}>
              <span>Iniciar análise</span>
              <Mono className="btn-kbd">⏎</Mono>
            </button>
          </div>
        )}

        <div className={`scan-stage ${stage !== 'idle' ? stage : ''}`}>
          <ScanVisual progress={progress} accent={a} />
          <div className="scan-meta">
            <Mono className="scan-phase">
              {stage === "scanning" ? phase
                : stage === "done" ? "Diagnóstico pronto."
                : stage === "error" ? errMsg
                : "Aguardando PDF…"}
            </Mono>
            {progress > 0 && stage !== "idle" && (
              <Mono className="scan-pct" style={{ color: a.glow }}>{progress}%</Mono>
            )}
          </div>
        </div>

        {stage === "error" && (
          <button className="btn-ghost sm" onClick={reset} style={{marginTop:'16px'}}>Tentar novamente</button>
        )}

        <div className="connect-footnotes">
          <div><Mono>·</Mono><span>Somente leitura. Nunca publicamos em seu nome.</span></div>
          <div><Mono>·</Mono><span>LinkedIn: Mais → Salvar como PDF.</span></div>
          <div><Mono>·</Mono><span>A análise leva entre 10 e 20 segundos.</span></div>
        </div>
      </div>
    </div>
  );
}

function ScanVisual({ progress, accent }) {
  const sections = ["Headline", "Resumo", "Experiência", "Habilidades", "Atividade", "Rede"];
  return (
    <div className="scan-visual">
      <div className="scan-sections">
        {sections.map((s, i) => {
          const start = (i / sections.length) * 100;
          const active = progress >= start && progress < start + 100/sections.length + 8;
          const done = progress >= start + 100/sections.length;
          return (
            <div key={s} className={`scan-row ${done ? "done" : active ? "active" : ""}`}>
              <Mono className="scan-row-k">{s}</Mono>
              <div className="scan-row-bar">
                <span style={{ width: done ? "100%" : active ? `${(progress - start) * sections.length}%` : "0%", background: accent.glow }} />
              </div>
              <Mono className="scan-row-v">
                {done ? "✓" : active ? "⋯" : "·"}
              </Mono>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TELA: AUDITORIA
// ============================================================
function AuditScreen({ threads, onOpenThread, accent, scoreBreakdown, overallScore }) {
  const a = ACCENTS[accent];

  const sections = scoreBreakdown.length > 0
    ? scoreBreakdown.map(item => ({
        k: item.category,
        v: Math.round((item.score / item.max_score) * 100),
        threadId: threads.find(t => t.area.toLowerCase() === item.category.toLowerCase())?.id,
      }))
    : [
        { k: "Headline", v: 92, threadId: "T01" },
        { k: "Resumo", v: 78, threadId: "T02" },
        { k: "Experiência", v: 84 },
        { k: "Habilidades", v: 88 },
        { k: "Atividade", v: 71, threadId: "T05" },
        { k: "Recomendações", v: 64 },
      ];

  return (
    <div className="screen audit-screen" data-screen-label="Auditoria">
      <div className="screen-head">
        <div>
          <Mono className="eyebrow">passo 02 · diagnóstico</Mono>
          <h1>Sua presença, lida como um pulso.</h1>
        </div>
        <p className="screen-lede">
          Cada sinal fraco vira uma <em>pendência</em> — escolha uma, o workshop abre.
          As pendências permanecem visíveis em todo o app até serem resolvidas.
        </p>
      </div>

      <div className="audit-main">
        <div className="pulse-stage">
          <Pulse accent={a} threads={threads} onOpen={onOpenThread} />
          <div className="pulse-axis">
            {["clareza","convicção","cadência","qualidade","autenticidade"].map(t => (
              <Mono key={t}>{t}</Mono>
            ))}
          </div>
        </div>

        <div className="audit-grades">
          <Mono className="grades-eyebrow">análise por seção</Mono>
          {sections.map((s, i) => {
            const thread = s.threadId && threads.find(t => t.id === s.threadId);
            const isOpen = thread && !thread.resolved;
            return (
              <div key={s.k} className={`grade-row ${isOpen ? "has-thread" : ""}`}>
                <div className="grade-head">
                  <span className="grade-k">{s.k}</span>
                  {isOpen && (
                    <button className="grade-thread-chip" onClick={() => onOpenThread(thread)}>
                      <span className="chip-num">{thread.n}</span>
                      <span>ver pendência</span>
                    </button>
                  )}
                  <Mono className="grade-v">{s.v}</Mono>
                </div>
                <div className="grade-bar">
                  <span className="grade-fill" style={{
                    width: `${s.v}%`,
                    background: `linear-gradient(90deg, ${a.deep}, ${a.glow})`,
                    animationDelay: `${i*70}ms`
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Pulse({ accent, threads, onOpen }) {
  const W = 980, H = 280, mid = H/2;
  const threadMarks = threads.filter(t => !t.resolved).map((t, i) => ({
    id: t.id, t,
    x: 120 + i * (W - 240) / Math.max(1, threads.filter(t => !t.resolved).length - 1 || 1),
    y: mid + (Math.sin(i * 1.7) * 36) - (t.severity === "high" ? 50 : t.severity === "medium" ? 30 : 16)
  }));

  const pts = useMemo(() => {
    const out = [];
    for (let x = 0; x <= W; x += 6) {
      const t = x / W;
      const pulse = Math.sin(t * 14) * 12 + Math.sin(t * 33 + 1.2) * 6;
      const breath = Math.sin(t * 3.3) * 36;
      let spike = 0;
      threadMarks.forEach(m => {
        const d = Math.abs(x - m.x);
        if (d < 30) spike += (m.y - mid) * Math.exp(-d*d / 200);
      });
      out.push([x, mid + breath + pulse + spike]);
    }
    return out;
  }, [threads.map(t => t.resolved).join(",")]);

  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const env = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + (mid + (p[1]-mid)*1.7).toFixed(1)).join(" ");

  return (
    <div className="pulse-wrap">
      <svg className="pulse-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <g opacity="0.18">
          {Array.from({length: 11}).map((_, i) => (
            <line key={i} x1={i*W/10} y1="0" x2={i*W/10} y2={H} stroke="currentColor" strokeWidth="0.5"/>
          ))}
          <line x1="0" y1={mid} x2={W} y2={mid} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4"/>
        </g>
        <path d={env} fill="none" stroke={accent.soft} strokeWidth="1.2" opacity="0.45" />
        <path className="pulse-sig" d={d} fill="none" stroke={accent.glow} strokeWidth="1.6" filter="url(#glow)" />
        {threadMarks.map(m => (
          <g key={m.id} className="thread-mark" onClick={() => onOpen(m.t)} style={{ cursor: "pointer" }}>
            <circle cx={m.x} cy={m.y} r="14" fill={accent.deep} stroke={accent.glow} strokeWidth="1" opacity="0.9"/>
            <text x={m.x} y={m.y + 3} textAnchor="middle" fill={accent.glow} fontSize="10" fontFamily="JetBrains Mono">{m.t.n}</text>
            <circle cx={m.x} cy={m.y} r="14" fill="none" stroke={accent.glow} strokeWidth="1">
              <animate attributeName="r" from="14" to="22" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite"/>
            </circle>
          </g>
        ))}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}

// ============================================================
// TELA: BRAND STUDIO
// ============================================================
function BrandStudio({ threads, activeThreadId, onResolve, onPickThread, accent, profileId }) {
  const a = ACCENTS[accent];
  const localThreads = threads.filter(t => t.screen === "brand");
  const active = localThreads.find(t => t.id === activeThreadId) || localThreads.find(t => !t.resolved) || localThreads[0];

  return (
    <div className="screen brand-screen" data-screen-label="Brand Studio">
      <div className="screen-head">
        <div>
          <Mono className="eyebrow">passo 03 · workshop</Mono>
          <h1>Escolha uma pendência.<br/><em style={{color: a.glow}}>Resolva com o copiloto.</em></h1>
        </div>
        <p className="screen-lede">
          A pendência à esquerda nomeia o problema. O workshop à direita propõe
          reescritas. Aceite uma — sua pontuação sobe em tempo real.
        </p>
      </div>

      <div className="brand-grid">
        <div className="thread-strip">
          {localThreads.length > 0 ? localThreads.map(t => (
            <button key={t.id}
              className={`thread-pick ${t.id === active?.id ? "on" : ""} ${t.resolved ? "done" : ""}`}
              onClick={() => onPickThread(t.id)}
            >
              <Mono className="pick-num">{t.n}</Mono>
              <div className="pick-body">
                <Mono className="pick-area">{t.area}</Mono>
                <span className="pick-title">{t.title}</span>
              </div>
              {t.resolved
                ? <Mono className="pick-state done">resolvida</Mono>
                : <Mono className="pick-state" style={{color: a.glow}}>+{t.lift}</Mono>}
            </button>
          )) : (
            <div style={{padding:'16px', color:'oklch(0.50 0.02 270)'}}>
              <Mono>Nenhuma pendência de marca. Envie um PDF para gerar.</Mono>
            </div>
          )}
        </div>

        <div className="workshop">
          {active
            ? <Workshop thread={active} accent={a} onResolve={onResolve} profileId={profileId} />
            : <div className="workshop-empty"><Mono>Selecione uma pendência.</Mono></div>
          }
        </div>
      </div>
    </div>
  );
}

function Workshop({ thread, accent, onResolve, profileId }) {
  if (thread.target === "headline") return <HeadlineWorkshop thread={thread} accent={accent} onResolve={onResolve} profileId={profileId} />;
  if (thread.target === "bio")      return <BioWorkshop thread={thread} accent={accent} onResolve={onResolve} profileId={profileId} />;
  if (thread.target === "banner")   return <BannerWorkshop thread={thread} accent={accent} onResolve={onResolve} profileId={profileId} />;
  return <BioWorkshop thread={thread} accent={accent} onResolve={onResolve} profileId={profileId} />;
}

function HeadlineWorkshop({ thread, accent, onResolve, profileId }) {
  const [picked, setPicked] = useState(null);
  const [alts, setAlts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!profileId) { setError('Nenhum perfil carregado'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/branding/headlines', { profile_id: profileId });
      setAlts(data.headlines.map((txt, i) => ({ id: `h${i}`, txt })));
      setPicked(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ws ws-headline">
      <div className="ws-head">
        <div>
          <Mono className="ws-eyebrow">{thread.area} · {thread.n}</Mono>
          <h2 className="ws-title">{thread.title}</h2>
          <p className="ws-note">{thread.note}</p>
        </div>
      </div>

      <div className="ws-section">
        <div className="ws-section-head">
          <Mono className="ws-section-lbl">{alts.length > 0 ? `alternativas · ${alts.length}` : 'alternativas'}</Mono>
          <button className="btn-ghost sm" onClick={generate} disabled={loading}>
            {loading ? 'Gerando…' : alts.length > 0 ? 'Gerar novamente' : 'Gerar com IA'}
          </button>
        </div>
        {error && <Mono style={{color:'oklch(0.65 0.18 28)',fontSize:'12px',marginTop:'8px'}}>{error}</Mono>}
        {alts.length > 0 && (
          <div className="alts">
            {alts.map(alt => (
              <button key={alt.id} className={`alt ${picked === alt.id ? "on" : ""}`} onClick={() => setPicked(alt.id)}>
                <span className="alt-mark" style={picked === alt.id ? {background: accent.glow} : {}} />
                <div className="alt-body">
                  <p className="alt-text">{alt.txt}</p>
                </div>
                <button
                  className="btn-ghost sm"
                  style={{flexShrink:0,fontSize:'11px'}}
                  onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(alt.txt); }}
                >Copiar</button>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ws-foot">
        <button className="btn-ghost">Descartar pendência</button>
        <button className="btn-primary" disabled={alts.length === 0 || thread.resolved} onClick={() => onResolve(thread.id)}>
          {thread.resolved ? "Resolvida" : `Aplicar e resolver · +${thread.lift}`}
          {!thread.resolved && <Mono className="btn-kbd">⌘ ⏎</Mono>}
        </button>
      </div>
    </div>
  );
}

function BioWorkshop({ thread, accent, onResolve, profileId }) {
  const [drafts, setDrafts] = useState([]);
  const [draft, setDraft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!profileId) { setError('Nenhum perfil carregado'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/branding/bio', { profile_id: profileId });
      setDrafts(data.bios);
      setDraft(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const current = drafts[draft] || '';

  return (
    <div className="ws ws-bio">
      <div className="ws-head">
        <div>
          <Mono className="ws-eyebrow">{thread.area} · {thread.n}</Mono>
          <h2 className="ws-title">{thread.title}</h2>
          <p className="ws-note">{thread.note}</p>
        </div>
      </div>
      <div className="ws-section">
        <div className="ws-section-head">
          <Mono className="ws-section-lbl">{drafts.length > 0 ? `rascunho ${draft+1} de ${drafts.length}` : 'rascunhos'}</Mono>
          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
            {drafts.length > 0 && (
              <>
                <button className="btn-ghost sm" onClick={() => setDraft(Math.max(0,draft-1))}>‹</button>
                <button className="btn-ghost sm" onClick={() => setDraft(Math.min(drafts.length-1,draft+1))}>›</button>
              </>
            )}
            <button className="btn-ghost sm" onClick={generate} disabled={loading}>
              {loading ? 'Gerando…' : drafts.length > 0 ? 'Gerar novamente' : 'Gerar com IA'}
            </button>
          </div>
        </div>
        {error && <Mono style={{color:'oklch(0.65 0.18 28)',fontSize:'12px',marginTop:'8px'}}>{error}</Mono>}
        {current && (
          <div className="bio-card">
            <p className="bio-text">{current}</p>
            <div className="bio-meta">
              <Mono>{current.split(" ").length} palavras</Mono>
            </div>
          </div>
        )}
      </div>
      <div className="ws-foot">
        <button className="btn-ghost" onClick={() => current && navigator.clipboard.writeText(current)} disabled={!current}>
          Copiar
        </button>
        <button className="btn-primary" disabled={thread.resolved || drafts.length === 0} onClick={() => onResolve(thread.id)}>
          {thread.resolved ? "Resolvida" : `Aplicar rascunho · +${thread.lift}`}
        </button>
      </div>
    </div>
  );
}

function BannerWorkshop({ thread, accent, onResolve, profileId }) {
  const [bannerUrl, setBannerUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!profileId) { setError('Nenhum perfil carregado'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/branding/banner', { profile_id: profileId });
      setBannerUrl(data.image_url);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ws ws-banner">
      <div className="ws-head">
        <div>
          <Mono className="ws-eyebrow">{thread.area} · {thread.n}</Mono>
          <h2 className="ws-title">{thread.title}</h2>
          <p className="ws-note">{thread.note}</p>
        </div>
      </div>
      {bannerUrl ? (
        <img src={bannerUrl} alt="Banner LinkedIn" style={{width:'100%',borderRadius:'8px',border:'1px solid oklch(0.28 0.02 270)',marginBottom:'12px'}} />
      ) : (
        <div className="banner-large" style={{
          background: `linear-gradient(120deg, oklch(0.18 0.02 270), ${accent.deep} 60%, oklch(0.18 0.02 270))`,
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>
          <Mono style={{color: loading ? accent.glow : 'oklch(0.50 0.02 270)'}}>
            {loading ? 'Gerando banner…' : '1584 × 396'}
          </Mono>
        </div>
      )}
      {error && <Mono style={{color:'oklch(0.65 0.18 28)',fontSize:'12px',marginBottom:'8px'}}>{error}</Mono>}
      <div className="ws-foot">
        <button className="btn-ghost" onClick={generate} disabled={loading}>
          {loading ? 'Gerando…' : bannerUrl ? 'Gerar novamente' : 'Gerar com IA'}
        </button>
        {bannerUrl && (
          <a href={bannerUrl} download="banner-linkedin.svg"
            className="btn-ghost" style={{textDecoration:'none',display:'inline-flex',alignItems:'center'}}>
            Baixar
          </a>
        )}
        <button className="btn-primary" disabled={thread.resolved || !bannerUrl} onClick={() => onResolve(thread.id)}>
          {thread.resolved ? "Resolvida" : `Aplicar · +${thread.lift}`}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// TELA: OUTREACH
// ============================================================
function OutreachScreen({ threads, activeThreadId, onResolve, onPickThread, accent, profileId }) {
  const a = ACCENTS[accent];
  const localThreads = threads.filter(t => t.screen === "outreach");
  const active = localThreads.find(t => t.id === activeThreadId) || localThreads.find(t => !t.resolved) || localThreads[0];

  return (
    <div className="screen outreach-screen" data-screen-label="Outreach">
      <div className="screen-head">
        <div>
          <Mono className="eyebrow">passo 04 · outreach</Mono>
          <h1>Um estrategista, à disposição.</h1>
        </div>
        <p className="screen-lede">
          Cada mensagem enviada é uma aposta. O Lattice ajuda a calibrar a aposta certa
          e redige por você.
        </p>
      </div>

      <div className="outreach-grid">
        <div className="targets">
          <Mono className="targets-lbl">pendências</Mono>
          {localThreads.length > 0 ? localThreads.map((t) => (
            <button key={t.id} className={`target ${active && active.id === t.id ? "on" : ""}`}
              onClick={() => onPickThread(t.id)}>
              <div className="target-avatar">{t.n}</div>
              <div className="target-body">
                <span className="target-name">{t.area}</span>
                <Mono className="target-role">{t.title}</Mono>
              </div>
              {!t.resolved && <span className="target-dot" style={{background: a.glow}} />}
              {t.resolved && <Mono className="target-done">✓</Mono>}
            </button>
          )) : (
            <div style={{padding:'16px', color:'oklch(0.50 0.02 270)'}}>
              <Mono>Nenhuma pendência de contato. Envie um PDF para gerar.</Mono>
            </div>
          )}
        </div>

        <div className="convo">
          {active && <Conversation thread={active} accent={a} onResolve={onResolve} profileId={profileId} />}
        </div>
      </div>
    </div>
  );
}

function Conversation({ thread, accent, onResolve, profileId }) {
  const [signal, setSignal] = useState('');
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!profileId) { setError('Nenhum perfil carregado'); return; }
    if (!signal.trim()) { setError('Insira um sinal de contexto primeiro'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/outreach/pitch', { profile_id: profileId, signal });
      setPitches(data.pitches);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="convo-head">
        <Mono>{thread.area} · {thread.n}</Mono>
        <Mono className="convo-thread">pendência de contato</Mono>
      </div>
      <div className="convo-body">
        <div className="msg from-ai">
          <Mono className="who">estrategista</Mono>
          <p>{thread.note || thread.title}</p>
        </div>
        {pitches.length === 0 && (
          <div className="msg from-ai">
            <Mono className="who">estrategista</Mono>
            <p>Forneça um sinal de contexto — um post que publicaram, uma mudança de cargo, uma conexão em comum — e eu rascunho três openers: do mais caloroso ao mais direto.</p>
          </div>
        )}
        {pitches.map((p, i) => (
          <div key={i} className="draft-card">
            <div className="draft-head">
              <Mono>rascunho · v{i+1}</Mono>
              <button className="btn-ghost sm" style={{fontSize:'11px'}} onClick={() => navigator.clipboard.writeText(p)}>Copiar</button>
            </div>
            <p className="draft-text">{p}</p>
          </div>
        ))}
        {error && <Mono style={{color:'oklch(0.65 0.18 28)',fontSize:'12px',padding:'8px 0'}}>{error}</Mono>}
      </div>
      <div className="convo-input">
        <input
          value={signal}
          onChange={e => setSignal(e.target.value)}
          placeholder="Sinal de contexto: post, mudança de cargo, conexão em comum…"
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(); }}
        />
        <Mono className="kbd">⌘ ⏎</Mono>
        <button className="btn-primary sm" onClick={generate} disabled={loading || !signal.trim()}>
          {loading ? '…' : pitches.length > 0 ? 'Gerar novamente' : 'Gerar'}
        </button>
        {pitches.length > 0 && (
          <button className="btn-primary sm" disabled={thread.resolved} onClick={() => onResolve(thread.id)}
            style={{marginLeft:'6px'}}>
            {thread.resolved ? "Resolvida" : `Resolver · +${thread.lift}`}
          </button>
        )}
      </div>
    </>
  );
}

// ============================================================
// APP RAIZ
// ============================================================
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const accent = t.accent in ACCENTS ? t.accent : "violet";
  const a = ACCENTS[accent];

  const [screen, setScreen] = useState("connect");
  const [activeThread, setActiveThread] = useState(null);
  const [threads, setThreads] = useState([]);
  const [scoreState, setScoreState] = useState({ current: 0, prev: 0 });
  const [profileId, setProfileId] = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState([]);

  const onConnectComplete = useCallback((data) => {
    const pid = data.profile?.id || null;
    const score = data.overall_score ?? 0;
    const breakdown = data.score_breakdown ?? [];

    setProfileId(pid);
    setScoreBreakdown(breakdown);
    setScoreState({ current: score, prev: 0 });

    const newThreads = generateThreadsFromBreakdown(breakdown);
    setThreads(newThreads);
    setScreen("audit");
    setTimeout(() => setScoreState(prev => ({ ...prev, prev: prev.current })), 2400);
  }, []);

  const openThread = (thread) => {
    setActiveThread(thread.id);
    setScreen(thread.screen);
  };
  const pickThread = (id) => setActiveThread(id);

  const resolveThread = (id) => {
    const th = threads.find(x => x.id === id);
    if (!th || th.resolved) return;
    setThreads(prev => prev.map(x => x.id === id ? {...x, resolved: true} : x));
    setScoreState(prev => ({ prev: prev.current, current: Math.min(100, prev.current + th.lift) }));
    setTimeout(() => setScoreState(prev => ({ ...prev, prev: prev.current })), 2400);
  };

  const copilotCtx = useMemo(() => {
    const open = threads.filter(t => !t.resolved).length;
    if (screen === "connect") return [{ kind: "info", text: "Exporte seu perfil do LinkedIn como PDF (Mais → Salvar como PDF) e envie aqui. Vou ler como um recrutador sênior leria." }];
    if (screen === "audit")   return [{ kind: "info", text: `${open} pendência${open !== 1 ? 's' : ''} aberta${open !== 1 ? 's' : ''}. Comece pelas de maior severidade — impacto maior, mais rápido.` }];
    if (screen === "brand")   return [{ kind: "info", text: "Headline é a edição de maior retorno. Gere as alternativas, escolha a que soa como você no seu melhor momento." }];
    if (screen === "outreach") return [{ kind: "info", text: "Especificidade bate cordialidade. Cite algo concreto que você observou na pessoa." }];
    return [];
  }, [screen, threads]);

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--accent", a.glow);
    r.style.setProperty("--accent-soft", a.soft);
    r.style.setProperty("--accent-deep", a.deep);
    r.dataset.grain = t.showGrain ? "on" : "off";
  }, [accent, t.showGrain]);

  const reset = () => {
    setScreen("connect");
    setThreads([]);
    setScoreState({ current: 0, prev: 0 });
    setProfileId(null);
    setScoreBreakdown([]);
    setActiveThread(null);
  };

  return (
    <>
      <AmbientField accent={accent} visible={t.showAmbient} />
      {t.showGrain && <div className="grain" aria-hidden />}

      <div className="app-shell">
        <Sidebar screen={screen} setScreen={setScreen} threads={threads} />

        <div className="app-main">
          {screen !== "connect" && (
            <ScoreHeader score={scoreState.current} prevScore={scoreState.prev} threads={threads} accent={accent} />
          )}
          <div className="app-stage">
            {screen === "connect"  && <ConnectScreen onComplete={onConnectComplete} accent={accent} />}
            {screen === "audit"    && <AuditScreen threads={threads} onOpenThread={openThread} accent={accent} scoreBreakdown={scoreBreakdown} overallScore={scoreState.current} />}
            {screen === "brand"    && <BrandStudio threads={threads} activeThreadId={activeThread} onResolve={resolveThread} onPickThread={pickThread} accent={accent} profileId={profileId} />}
            {screen === "outreach" && <OutreachScreen threads={threads} activeThreadId={activeThread} onResolve={resolveThread} onPickThread={pickThread} accent={accent} profileId={profileId} />}
          </div>
          {screen !== "connect" && (
            <ThreadTray threads={threads} onOpen={openThread} accent={accent} />
          )}
        </div>

        {screen !== "connect" && (
          <CopilotRail context={copilotCtx} accent={accent} visible={t.showCopilot} />
        )}
      </div>

      <TweaksPanel title="Ajustes">
        <TweakSection title="Cor">
          <TweakRadio
            value={t.accent}
            onChange={v => setTweak("accent", v)}
            options={Object.entries(ACCENTS).map(([k,v]) => ({ value: k, label: v.name }))}
          />
        </TweakSection>
        <TweakSection title="Atmosfera">
          <TweakToggle label="Gradiente ambiente" value={t.showAmbient} onChange={v => setTweak("showAmbient", v)} />
          <TweakToggle label="Grão de filme" value={t.showGrain} onChange={v => setTweak("showGrain", v)} />
          <TweakToggle label="Painel copiloto" value={t.showCopilot} onChange={v => setTweak("showCopilot", v)} />
        </TweakSection>
        <TweakSection title="Sessão">
          <TweakButton onClick={reset}>Reiniciar sessão</TweakButton>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
