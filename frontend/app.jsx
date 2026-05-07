// Lattice — copiloto de carreira
// Três seções: Landing · Dashboard · Auditoria

const { useState, useEffect, useRef, useMemo } = React;

// ---------- Tweak defaults ----------
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "violet",
  "density": "comfortable",
  "showGrain": true,
  "showAmbient": true
}/*EDITMODE-END*/;

const ACCENTS = {
  violet:  { name: "Violet",  hue: 280, glow: "oklch(0.72 0.18 280)", soft: "oklch(0.55 0.16 280)", deep: "oklch(0.32 0.12 280)" },
  ember:   { name: "Ember",   hue: 32,  glow: "oklch(0.78 0.16 32)",  soft: "oklch(0.60 0.15 32)",  deep: "oklch(0.34 0.11 32)" },
  jade:    { name: "Jade",    hue: 162, glow: "oklch(0.78 0.13 162)", soft: "oklch(0.60 0.12 162)", deep: "oklch(0.32 0.09 162)" },
  ice:     { name: "Ice",     hue: 220, glow: "oklch(0.78 0.13 220)", soft: "oklch(0.60 0.13 220)", deep: "oklch(0.32 0.10 220)" }
};

// ---------- Ambient gradient blob signature ----------
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

// ---------- Tiny utility ----------
const Mono = ({ children, className="", ...p }) => (
  <span className={`mono ${className}`} {...p}>{children}</span>
);

// ---------- Top nav ----------
function TopNav() {
  return (
    <nav className="topnav">
      <div className="brandmark">
        <span className="brand-glyph" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14l3 3 3-3-3 3z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
        </span>
        <span className="brand-name">Lattice</span>
        <Mono className="brand-tag">/ copiloto de carreira</Mono>
      </div>
      <div className="nav-links">
        <a href="#landing">Visão geral</a>
        <a href="#dashboard">Workspace</a>
        <a href="#audit">Auditoria</a>
        <Mono className="kbd">⌘K</Mono>
      </div>
      <div className="nav-cta">
        <button className="btn-ghost">Entrar</button>
        <a href="/app" className="btn-primary" style={{textDecoration:'none'}}>Começar grátis</a>
      </div>
    </nav>
  );
}

// ---------- LANDING ----------
function Landing({ accent }) {
  const a = ACCENTS[accent];
  return (
    <section id="landing" className="section landing" data-screen-label="01 Landing">
      <div className="landing-grid">
        <div className="landing-eyebrow">
          <span className="dot" style={{ background: a.glow, boxShadow: `0 0 12px ${a.glow}` }} />
          <Mono>v1.0 · beta público · para profissionais</Mono>
        </div>

        <h1 className="hero-type">
          <span className="line">Sua carreira,</span>
          <span className="line italic">reescrita</span>
          <span className="line">
            por uma IA de <em className="hero-em" style={{ color: a.glow }}>elite</em>.
          </span>
        </h1>

        <p className="hero-sub">
          O Lattice reescreve sua presença profissional — headline, bio, outreach,
          banners — com a visão de um estrategista de carreira sênior.
        </p>

        <div className="hero-cta">
          <a href="/app" className="btn-primary lg" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'8px'}}>
            <span>Auditar meu perfil</span>
            <Mono className="btn-kbd">⏎</Mono>
          </a>
          <button className="btn-ghost lg">Ver demonstração</button>
        </div>

        <div className="hero-meta">
          <div className="meta-item"><Mono className="num">94<span>/100</span></Mono><span className="lbl">melhora média de perfil</span></div>
          <div className="meta-divider" />
          <div className="meta-item"><Mono className="num">12k</Mono><span className="lbl">perfis otimizados esta semana</span></div>
          <div className="meta-divider" />
          <div className="meta-item"><Mono className="num">3.2×</Mono><span className="lbl">taxa de resposta de recrutadores</span></div>
        </div>
      </div>

      {/* Floating preview card */}
      <div className="hero-card" aria-hidden>
        <div className="hero-card-head">
          <Mono>profile.draft</Mono>
          <span className="pill">Estrategista · Claude AI</span>
        </div>
        <div className="hero-card-body">
          <div className="kv">
            <Mono className="kv-k">headline</Mono>
            <div className="kv-v">
              <span className="strike">Gerente de Produto Sênior na —</span>
              <span className="rewrite" style={{ color: a.glow }}>Constrói sistemas de produto que escalam sem perder clareza.</span>
            </div>
          </div>
          <div className="kv">
            <Mono className="kv-k">posicionamento</Mono>
            <div className="kv-v">Operador, não generalista. 8 anos entregando 0→1 em fintechs.</div>
          </div>
          <div className="kv">
            <Mono className="kv-k">tom</Mono>
            <div className="kv-v tone-row">
              <span className="chip on">direto</span>
              <span className="chip on">humano</span>
              <span className="chip">sem jargão</span>
              <span className="chip">primeira pessoa</span>
            </div>
          </div>
        </div>
        <div className="hero-card-foot">
          <Mono>3 alternativas prontas</Mono>
          <span className="caret">›</span>
        </div>
      </div>

      {/* Trust strip */}
      <div className="trust-strip">
        <Mono className="trust-label">Usado por candidatos em processos em</Mono>
        <div className="trust-logos">
          {["STRIPE", "FIGMA", "RAMP", "VERCEL", "LINEAR", "ANTHROPIC", "RETOOL"].map(x => (
            <span key={x} className="logo-mark">{x}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- DASHBOARD (spatial canvas) ----------
function Dashboard({ accent }) {
  const a = ACCENTS[accent];
  return (
    <section id="dashboard" className="section dashboard" data-screen-label="02 Dashboard">
      <div className="section-head">
        <div>
          <Mono className="eyebrow">02 · workspace</Mono>
          <h2>Um canvas, não um painel.</h2>
        </div>
        <p className="section-lede">
          Cada elemento da sua presença profissional como um card que você pega,
          reescreve e devolve. O Lattice mantém a história completa em vista.
        </p>
      </div>

      <div className="canvas">
        {/* Greeting / focus card */}
        <article className="card card-focus" style={{ "--x": "0%", "--y": "0%", "--w": "440px" }}>
          <div className="focus-head">
            <Mono>Terça · 09:14</Mono>
            <span className="status-dot" style={{ background: a.glow, boxShadow: `0 0 8px ${a.glow}` }} />
          </div>
          <h3 className="focus-title">
            Bom dia, Marina.<br/>
            Três coisas vão mover <em style={{ color: a.glow }}>a sua semana</em>.
          </h3>
          <ol className="focus-list">
            <li><span className="num">01</span><span>Ajuste a headline — ela enterra o que importa.</span></li>
            <li><span className="num">02</span><span>Reordene o &ldquo;Sobre&rdquo;. Comece com resultados.</span></li>
            <li><span className="num">03</span><span>Envie os 4 rascunhos de outreach que preparei.</span></li>
          </ol>
          <div className="focus-foot">
            <button className="btn-primary sm">Executar tudo</button>
            <button className="btn-ghost sm">Revisar um a um</button>
          </div>
        </article>

        {/* Profile score mini */}
        <article className="card card-score" style={{ "--x": "470px", "--y": "0px", "--w": "300px" }}>
          <Mono className="card-label">perfil · ao vivo</Mono>
          <div className="score-num">
            <span className="big">87</span>
            <span className="suffix">/100</span>
          </div>
          <div className="score-trend">
            <Mono>+14 este mês</Mono>
            <svg className="spark" viewBox="0 0 120 32" preserveAspectRatio="none">
              <path d="M0 24 L20 22 L40 18 L60 19 L80 12 L100 8 L120 4" fill="none" stroke={a.glow} strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="score-rings">
            {[
              ["Headline", 92],
              ["Sobre",    78],
              ["Skills",   84],
              ["Atividade", 71]
            ].map(([k, v]) => (
              <div key={k} className="ring-row">
                <span className="ring-k">{k}</span>
                <div className="ring-bar"><span style={{ width: `${v}%`, background: a.glow }} /></div>
                <Mono className="ring-v">{v}</Mono>
              </div>
            ))}
          </div>
        </article>

        {/* Outreach generator */}
        <article className="card card-chat" style={{ "--x": "0px", "--y": "360px", "--w": "470px" }}>
          <div className="chat-head">
            <Mono>outreach · rascunho 03</Mono>
            <span className="pill subtle">para: Ana Lima · Head de Design, Ramp</span>
          </div>
          <div className="chat-body">
            <div className="chat-msg from-ai">
              <span className="who">Estrategista</span>
              <p>Eu abriria com o redesign do Ramp — é o sinal mais forte de fit. Posso gerar três openers do mais caloroso ao mais direto?</p>
            </div>
            <div className="chat-msg from-user">
              <span className="who">Marina</span>
              <p>Direto, mas mostre que li o teardown dela.</p>
            </div>
            <div className="chat-msg from-ai">
              <span className="who">Estrategista</span>
              <p>Entendido. Rascunhando — 47 palavras, sem enrolação, termina com um pedido concreto.</p>
              <div className="thinking">
                <span /><span /><span />
                <Mono>redigindo</Mono>
              </div>
            </div>
          </div>
          <div className="chat-input">
            <input placeholder="Responda, ou pressione / para comandos" />
            <Mono className="kbd">⌘ ⏎</Mono>
          </div>
        </article>

        {/* Headline alternates */}
        <article className="card card-alt" style={{ "--x": "490px", "--y": "320px", "--w": "330px" }}>
          <Mono className="card-label">headline · 4 alternativas</Mono>
          <div className="alt-list">
            {[
              { txt: "Constrói sistemas de produto que escalam sem perder clareza.", on: true },
              { txt: "GP transformando problemas ambíguos em produto entregue.", on: false },
              { txt: "Faço produtos de pagamento parecerem óbvios.", on: false },
              { txt: "Product manager · 0→1 · fintech · 8 anos.", on: false }
            ].map((x, i) => (
              <div key={i} className={`alt-row ${x.on ? "on" : ""}`}>
                <span className="alt-mark" style={x.on ? { background: a.glow } : {}} />
                <span className="alt-txt">{x.txt}</span>
              </div>
            ))}
          </div>
          <button className="btn-ghost sm wide">Gerar 3 mais</button>
        </article>

        {/* Banner card */}
        <article className="card card-banner" style={{ "--x": "840px", "--y": "0px", "--w": "300px" }}>
          <Mono className="card-label">banner · conceito</Mono>
          <div className="banner-preview" style={{
            background: `linear-gradient(120deg, oklch(0.18 0.02 270), ${a.deep} 60%, oklch(0.18 0.02 270))`
          }}>
            <span className="banner-glyph" aria-hidden>
              <svg viewBox="0 0 100 100" width="64" height="64">
                <circle cx="50" cy="50" r="28" stroke={a.glow} strokeWidth="1" fill="none"/>
                <circle cx="50" cy="50" r="14" stroke={a.glow} strokeWidth="1" fill="none" opacity="0.6"/>
                <line x1="10" y1="50" x2="90" y2="50" stroke={a.glow} strokeWidth="0.5" opacity="0.4"/>
              </svg>
            </span>
          </div>
          <div className="banner-meta">
            <span>Discretamente editorial</span>
            <Mono>1584 × 396</Mono>
          </div>
        </article>

        {/* Activity / signals */}
        <article className="card card-signals" style={{ "--x": "840px", "--y": "320px", "--w": "300px" }}>
          <Mono className="card-label">signals · 24h</Mono>
          <ul className="signal-list">
            <li><span className="sig-tag" style={{ borderColor: a.glow, color: a.glow }}>view</span><span>Recrutadora da Stripe viu seu perfil duas vezes.</span></li>
            <li><span className="sig-tag">save</span><span>Ana Lima salvou seu post sobre sistemas.</span></li>
            <li><span className="sig-tag">match</span><span>3 vagas novas combinam com seu posicionamento.</span></li>
          </ul>
        </article>

        {/* Floating command hint */}
        <div className="cmd-hint">
          <Mono>Pressione</Mono>
          <Mono className="kbd">⌘K</Mono>
          <Mono>para o copiloto</Mono>
        </div>
      </div>
    </section>
  );
}

// ---------- AUDIT ----------
function Audit({ accent }) {
  const a = ACCENTS[accent];
  const sections = [
    { k: "Headline",        v: 92, note: "Direta. Lida em menos de um segundo." },
    { k: "Sobre",           v: 78, note: "Abertura forte; meio deriva para listas." },
    { k: "Experiência",     v: 84, note: "Resultados lideram 4 de 6 cargos. Ajuste os outros dois." },
    { k: "Skills",          v: 88, note: "Endorsements concentrados nas competências principais." },
    { k: "Atividade",       v: 71, note: "Cadência irregular. Mire 2 posts/sem por 6 semanas." },
    { k: "Recomendações",   v: 64, note: "Dois pedidos novos elevariam materialmente." }
  ];

  return (
    <section id="audit" className="section audit" data-screen-label="03 Audit">
      <div className="section-head">
        <div>
          <Mono className="eyebrow">03 · auditoria</Mono>
          <h2>Sua presença, lida como um pulso.</h2>
        </div>
        <p className="section-lede">
          O Lattice lê cada sinal que seu perfil emite — clareza, cadência,
          convicção — e devolve como uma forma de onda viva.
        </p>
      </div>

      <div className="audit-grid">
        {/* Pulse / waveform display */}
        <div className="pulse-stage">
          <div className="pulse-num">
            <span className="big">87</span>
            <div className="num-side">
              <Mono className="lbl">pontuação geral</Mono>
              <Mono className="delta" style={{ color: a.glow }}>▲ 14 em 30 dias</Mono>
            </div>
          </div>

          <Pulse accent={a} />

          <div className="pulse-legend">
            <div><span className="dot" style={{ background: a.glow }} /><Mono>sinal</Mono></div>
            <div><span className="dot" style={{ background: "oklch(0.45 0.02 270)" }} /><Mono>base</Mono></div>
            <div><span className="dot" style={{ background: a.soft, opacity:.7 }} /><Mono>envelope 30 dias</Mono></div>
          </div>
        </div>

        {/* Section grades */}
        <div className="grades">
          {sections.map((s, i) => (
            <div key={s.k} className="grade-row">
              <div className="grade-head">
                <span className="grade-k">{s.k}</span>
                <Mono className="grade-v">{s.v}</Mono>
              </div>
              <div className="grade-bar">
                <span className="grade-fill" style={{ width: `${s.v}%`, background: `linear-gradient(90deg, ${a.deep}, ${a.glow})`, animationDelay: `${i*60}ms` }} />
              </div>
              <p className="grade-note">{s.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations row */}
      <div className="recs">
        <Mono className="recs-eyebrow">três ações · por impacto</Mono>
        <div className="recs-grid">
          {[
            { lift: "+8", t: "Reescreva a abertura do Sobre.", body: "Comece com a coisa mais contraintuitiva que você acredita sobre o seu trabalho." },
            { lift: "+5", t: "Peça 2 recomendações.", body: "Foque em pares que viram você entregar — não gestores." },
            { lift: "+4", t: "Poste duas vezes esta semana.", body: "Curto, opinativo, sem imagens. O Lattice vai redigir os dois para você." }
          ].map((r, i) => (
            <article key={i} className="rec-card">
              <Mono className="rec-lift" style={{ color: a.glow }}>{r.lift}</Mono>
              <h4>{r.t}</h4>
              <p dangerouslySetInnerHTML={{ __html: r.body }} />
              <button className="btn-ghost sm">Executar com copiloto</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// SVG pulse / waveform
function Pulse({ accent }) {
  const W = 920, H = 220, mid = H/2;
  const pts = useMemo(() => {
    const out = [];
    for (let x = 0; x <= W; x += 8) {
      const t = x / W;
      const pulse = Math.sin(t * 14) * 12 + Math.sin(t * 33 + 1.2) * 6;
      const breath = Math.sin(t * 3.3) * 36;
      const spike = (Math.abs(x - 360) < 18) ? -54 + (Math.random()*4) :
                    (Math.abs(x - 580) < 14) ? -38 :
                    (Math.abs(x - 740) < 10) ? -22 : 0;
      out.push([x, mid + breath + pulse + spike]);
    }
    return out;
  }, []);
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
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      </svg>
      <div className="pulse-ticks">
        {["clareza","convicção","cadência","qualidade","autenticidade"].map(t => (
          <Mono key={t} className="tick">{t}</Mono>
        ))}
      </div>
    </div>
  );
}

// ---------- FOOTER ----------
function Foot({ accent }) {
  return (
    <footer className="foot">
      <div className="foot-row">
        <div className="brandmark">
          <span className="brand-glyph">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14l3 3 3-3-3 3z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
          </span>
          <span className="brand-name">Lattice</span>
        </div>
        <Mono className="foot-mono">© 2026 · feito para quem leva o trabalho a sério.</Mono>
      </div>
    </footer>
  );
}

// ---------- ROOT ----------
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const accent = t.accent in ACCENTS ? t.accent : "violet";
  const a = ACCENTS[accent];

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--accent", a.glow);
    r.style.setProperty("--accent-soft", a.soft);
    r.style.setProperty("--accent-deep", a.deep);
    r.dataset.density = t.density;
    r.dataset.grain = t.showGrain ? "on" : "off";
  }, [accent, t.density, t.showGrain]);

  return (
    <>
      <AmbientField accent={accent} visible={t.showAmbient} />
      {t.showGrain && <div className="grain" aria-hidden />}
      <TopNav />
      <main>
        <Landing accent={accent} />
        <Dashboard accent={accent} />
        <Audit accent={accent} />
      </main>
      <Foot accent={accent} />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent">
          <TweakRadio
            value={t.accent}
            onChange={v => setTweak("accent", v)}
            options={Object.entries(ACCENTS).map(([k,v]) => ({ value: k, label: v.name }))}
          />
        </TweakSection>
        <TweakSection title="Density">
          <TweakRadio
            value={t.density}
            onChange={v => setTweak("density", v)}
            options={[{value:"compact",label:"Compact"},{value:"comfortable",label:"Comfortable"},{value:"spacious",label:"Spacious"}]}
          />
        </TweakSection>
        <TweakSection title="Atmosphere">
          <TweakToggle label="Ambient gradient" value={t.showAmbient} onChange={v => setTweak("showAmbient", v)} />
          <TweakToggle label="Film grain" value={t.showGrain} onChange={v => setTweak("showGrain", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
