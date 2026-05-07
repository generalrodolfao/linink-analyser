// Lattice — career copilot showcase
// Three stacked sections: Landing · Dashboard · Profile Audit

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
        <Mono className="brand-tag">/ career copilot</Mono>
      </div>
      <div className="nav-links">
        <a href="#landing">Overview</a>
        <a href="#dashboard">Workspace</a>
        <a href="#audit">Audit</a>
        <Mono className="kbd">⌘K</Mono>
      </div>
      <div className="nav-cta">
        <button className="btn-ghost">Sign in</button>
        <a href="/app" className="btn-primary" style={{textDecoration:'none'}}>Start free</a>
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
          <Mono>v1.0 · public beta · for job seekers</Mono>
        </div>

        <h1 className="hero-type">
          <span className="line">Your career,</span>
          <span className="line italic">authored</span>
          <span className="line">
            by an <em className="hero-em" style={{ color: a.glow }}>elite</em> AI.
          </span>
        </h1>

        <p className="hero-sub">
          Lattice rewrites your professional presence — headline, bio, outreach,
          banners — with the judgment of a top-tier career strategist. Quietly, in the background.
        </p>

        <div className="hero-cta">
          <a href="/app" className="btn-primary lg" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'8px'}}>
            <span>Audit my profile</span>
            <Mono className="btn-kbd">⏎</Mono>
          </a>
          <button className="btn-ghost lg">Watch the 60-second tour</button>
        </div>

        <div className="hero-meta">
          <div className="meta-item"><Mono className="num">94<span>/100</span></Mono><span className="lbl">avg. profile lift</span></div>
          <div className="meta-divider" />
          <div className="meta-item"><Mono className="num">12k</Mono><span className="lbl">profiles rewritten this week</span></div>
          <div className="meta-divider" />
          <div className="meta-item"><Mono className="num">3.2×</Mono><span className="lbl">recruiter response rate</span></div>
        </div>
      </div>

      {/* Floating preview card */}
      <div className="hero-card" aria-hidden>
        <div className="hero-card-head">
          <Mono>profile.draft</Mono>
          <span className="pill">Strategist · GPT-class</span>
        </div>
        <div className="hero-card-body">
          <div className="kv">
            <Mono className="kv-k">headline</Mono>
            <div className="kv-v">
              <span className="strike">Senior Product Designer at —</span>
              <span className="rewrite" style={{ color: a.glow }}>Designs decisive product systems for fintech at scale.</span>
            </div>
          </div>
          <div className="kv">
            <Mono className="kv-k">positioning</Mono>
            <div className="kv-v">Operator, not generalist. 8 yrs shipping 0→1 surfaces.</div>
          </div>
          <div className="kv">
            <Mono className="kv-k">tone</Mono>
            <div className="kv-v tone-row">
              <span className="chip on">decisive</span>
              <span className="chip on">warm</span>
              <span className="chip">jargon-free</span>
              <span className="chip">first-person</span>
            </div>
          </div>
        </div>
        <div className="hero-card-foot">
          <Mono>3 alternates ready</Mono>
          <span className="caret">›</span>
        </div>
      </div>

      {/* Trust strip */}
      <div className="trust-strip">
        <Mono className="trust-label">Used by candidates moving to</Mono>
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
          <h2>A canvas, not a dashboard.</h2>
        </div>
        <p className="section-lede">
          Every artifact of your professional presence as a card you can pick up,
          rewrite, and place back. Lattice keeps the whole story in view.
        </p>
      </div>

      <div className="canvas">
        {/* Greeting / focus card */}
        <article className="card card-focus" style={{ "--x": "0%", "--y": "0%", "--w": "440px" }}>
          <div className="focus-head">
            <Mono>Tuesday · 09:14</Mono>
            <span className="status-dot" style={{ background: a.glow, boxShadow: `0 0 8px ${a.glow}` }} />
          </div>
          <h3 className="focus-title">
            Good morning, Maya.<br/>
            Three things would move <em style={{ color: a.glow }}>your week</em>.
          </h3>
          <ol className="focus-list">
            <li><span className="num">01</span><span>Tighten your headline — it&rsquo;s burying the lede.</span></li>
            <li><span className="num">02</span><span>Re-sequence the &ldquo;About&rdquo; section. Lead with outcomes.</span></li>
            <li><span className="num">03</span><span>Send 4 outreach drafts I prepared overnight.</span></li>
          </ol>
          <div className="focus-foot">
            <button className="btn-primary sm">Run all</button>
            <button className="btn-ghost sm">Review one-by-one</button>
          </div>
        </article>

        {/* Profile score mini */}
        <article className="card card-score" style={{ "--x": "470px", "--y": "0px", "--w": "300px" }}>
          <Mono className="card-label">profile · live</Mono>
          <div className="score-num">
            <span className="big">87</span>
            <span className="suffix">/100</span>
          </div>
          <div className="score-trend">
            <Mono>+14 this month</Mono>
            <svg className="spark" viewBox="0 0 120 32" preserveAspectRatio="none">
              <path d="M0 24 L20 22 L40 18 L60 19 L80 12 L100 8 L120 4" fill="none" stroke={a.glow} strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="score-rings">
            {[
              ["Headline", 92],
              ["About",    78],
              ["Skills",   84],
              ["Activity", 71]
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
            <Mono>outreach · draft 03</Mono>
            <span className="pill subtle">to: Priya Shah · Head of Design, Ramp</span>
          </div>
          <div className="chat-body">
            <div className="chat-msg from-ai">
              <span className="who">Strategist</span>
              <p>I&rsquo;d open with the Ramp redesign — it&rsquo;s the strongest signal of fit. Want me to draft three openers ranging from warm to direct?</p>
            </div>
            <div className="chat-msg from-user">
              <span className="who">Maya</span>
              <p>Direct, but show I read her teardown.</p>
            </div>
            <div className="chat-msg from-ai">
              <span className="who">Strategist</span>
              <p>Got it. Drafting now — 47 words, no fluff, ends with a single concrete ask.</p>
              <div className="thinking">
                <span /><span /><span />
                <Mono>composing</Mono>
              </div>
            </div>
          </div>
          <div className="chat-input">
            <input placeholder="Reply, or press / for commands" />
            <Mono className="kbd">⌘ ⏎</Mono>
          </div>
        </article>

        {/* Headline alternates */}
        <article className="card card-alt" style={{ "--x": "490px", "--y": "320px", "--w": "330px" }}>
          <Mono className="card-label">headline · 4 alternates</Mono>
          <div className="alt-list">
            {[
              { txt: "Designs decisive product systems for fintech at scale.", on: true },
              { txt: "Senior PD turning ambiguous problems into shipped product.", on: false },
              { txt: "I make payments products feel obvious.", on: false },
              { txt: "Product designer · 0→1 · fintech · 8 yrs.", on: false }
            ].map((x, i) => (
              <div key={i} className={`alt-row ${x.on ? "on" : ""}`}>
                <span className="alt-mark" style={x.on ? { background: a.glow } : {}} />
                <span className="alt-txt">{x.txt}</span>
              </div>
            ))}
          </div>
          <button className="btn-ghost sm wide">Generate 3 more</button>
        </article>

        {/* Banner card */}
        <article className="card card-banner" style={{ "--x": "840px", "--y": "0px", "--w": "300px" }}>
          <Mono className="card-label">banner · concept</Mono>
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
            <span>Quietly editorial</span>
            <Mono>1584 × 396</Mono>
          </div>
        </article>

        {/* Activity / signals */}
        <article className="card card-signals" style={{ "--x": "840px", "--y": "320px", "--w": "300px" }}>
          <Mono className="card-label">signals · 24h</Mono>
          <ul className="signal-list">
            <li><span className="sig-tag" style={{ borderColor: a.glow, color: a.glow }}>view</span><span>Recruiter at Stripe viewed your profile twice.</span></li>
            <li><span className="sig-tag">save</span><span>Priya Shah saved your post on systems.</span></li>
            <li><span className="sig-tag">match</span><span>3 new roles match your positioning.</span></li>
          </ul>
        </article>

        {/* Floating command hint */}
        <div className="cmd-hint">
          <Mono>Press</Mono>
          <Mono className="kbd">⌘K</Mono>
          <Mono>for the copilot</Mono>
        </div>
      </div>
    </section>
  );
}

// ---------- AUDIT ----------
function Audit({ accent }) {
  const a = ACCENTS[accent];
  const sections = [
    { k: "Headline",     v: 92, note: "Decisive. Reads in under a second." },
    { k: "About",        v: 78, note: "Strong opening; middle drifts into list-form." },
    { k: "Experience",   v: 84, note: "Outcomes lead 4 of 6 roles. Tighten the other two." },
    { k: "Skills",       v: 88, note: "Endorsements concentrated on signature skills." },
    { k: "Activity",     v: 71, note: "Cadence is uneven. Aim for 2 posts/wk for 6 wks." },
    { k: "Recommendations", v: 64, note: "Two new asks would lift this materially." }
  ];

  return (
    <section id="audit" className="section audit" data-screen-label="03 Audit">
      <div className="section-head">
        <div>
          <Mono className="eyebrow">03 · audit</Mono>
          <h2>Your presence, read like a pulse.</h2>
        </div>
        <p className="section-lede">
          Lattice listens to every signal your profile emits — clarity, cadence,
          conviction — and renders it back as a living waveform.
        </p>
      </div>

      <div className="audit-grid">
        {/* Pulse / waveform display */}
        <div className="pulse-stage">
          <div className="pulse-num">
            <span className="big">87</span>
            <div className="num-side">
              <Mono className="lbl">composite score</Mono>
              <Mono className="delta" style={{ color: a.glow }}>▲ 14 in 30 days</Mono>
            </div>
          </div>

          <Pulse accent={a} />

          <div className="pulse-legend">
            <div><span className="dot" style={{ background: a.glow }} /><Mono>signal</Mono></div>
            <div><span className="dot" style={{ background: "oklch(0.45 0.02 270)" }} /><Mono>baseline</Mono></div>
            <div><span className="dot" style={{ background: a.soft, opacity:.7 }} /><Mono>30-day envelope</Mono></div>
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
        <Mono className="recs-eyebrow">three moves · ranked by lift</Mono>
        <div className="recs-grid">
          {[
            { lift: "+8", t: "Rewrite the About opener.", body: "Lead with the most counter-intuitive thing you believe about your craft." },
            { lift: "+5", t: "Request 2 recommendations.", body: "Target peers who&rsquo;ve seen you ship — not managers." },
            { lift: "+4", t: "Post twice this week.", body: "Short, opinionated, no images. Lattice will draft both for you." }
          ].map((r, i) => (
            <article key={i} className="rec-card">
              <Mono className="rec-lift" style={{ color: a.glow }}>{r.lift}</Mono>
              <h4>{r.t}</h4>
              <p dangerouslySetInnerHTML={{ __html: r.body }} />
              <button className="btn-ghost sm">Run with copilot</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// SVG pulse / waveform
function Pulse({ accent }) {
  // Build two layered paths: envelope (soft) + signal (sharp)
  const W = 920, H = 220, mid = H/2;
  // Generate a deterministic pseudo-pulse
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
        {/* grid */}
        <g opacity="0.18">
          {Array.from({length: 11}).map((_, i) => (
            <line key={i} x1={i*W/10} y1="0" x2={i*W/10} y2={H} stroke="currentColor" strokeWidth="0.5"/>
          ))}
          <line x1="0" y1={mid} x2={W} y2={mid} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4"/>
        </g>
        {/* envelope */}
        <path d={env} fill="none" stroke={accent.soft} strokeWidth="1.2" opacity="0.45" />
        {/* signal */}
        <path className="pulse-sig" d={d} fill="none" stroke={accent.glow} strokeWidth="1.6" filter="url(#glow)" />
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      </svg>
      <div className="pulse-ticks">
        {["clarity","conviction","cadence","craft","candor"].map(t => (
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
        <Mono className="foot-mono">© 2026 · made for people who take their work seriously.</Mono>
      </div>
    </footer>
  );
}

// ---------- ROOT ----------
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const accent = t.accent in ACCENTS ? t.accent : "violet";
  const a = ACCENTS[accent];

  // expose accent-derived CSS vars
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
