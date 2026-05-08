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
const CATEGORY_MAP = {
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

// ---------- Translations ----------
const TRANSLATIONS = {
  pt: {
    nav_connect: "Conectar",
    nav_audit: "Auditoria",
    nav_brand: "Brand Studio",
    nav_outreach: "Outreach",
    copilot_sub: "copiloto de carreira",
    score_label: "pontuação geral",
    score_pending: "pendências",
    session_live: "sessão · ao vivo",
    tray_resolved: (pts) => `todas resolvidas · ▲ ${pts} pts ganhos`,
    tray_open: (n) => `pendências abertas · ${n}`,
    copilot_title: "estrategista",
    copilot_silent: "silencioso quando não há nada útil a dizer",
    connect_step: "passo 01 · conectar",
    connect_h1_1: "Envie seu PDF do LinkedIn.",
    connect_h1_em: "Vamos ler como um estrategista.",
    connect_sub: "Exporte seu perfil do LinkedIn (Mais → Salvar como PDF) e envie aqui. O Lattice analisa 18 sinais — posicionamento, cadência, convicção. Nada é publicado.",
    connect_drop_title: "Arraste o PDF do LinkedIn aqui",
    connect_drop_sub: "ou clique para selecionar",
    connect_file_sub: (kb) => `${kb} KB · clique para trocar`,
    connect_btn: "Continuar para pagamento",
    connect_note1: "Pagamento único — análise completa com 18 sinais.",
    connect_note2: "LinkedIn: Mais → Salvar como PDF.",
    connect_note3: "Somente leitura. Nunca publicamos em seu nome.",
    connect_preparing: "Preparando sessão de pagamento…",
    connect_redirect_title: "redirecionando para pagamento",
    connect_redirect_body: "Você será levado ao checkout em instantes. Após o pagamento, retorne a esta página — a análise iniciará automaticamente.",
    connect_go_pay: "Ir para pagamento",
    connect_cancel: "Cancelar",
    connect_cancel_restart: "Cancelar e recomeçar",
    connect_retry: "Tentar novamente",
    connect_footnote1: "Feche e reabra esta página após o pagamento se a análise não iniciar.",
    connect_footnote2: "A análise leva entre 15 e 30 segundos após a confirmação.",
    error_pdf_only: "Apenas arquivos PDF são aceitos",
    error_session_expired: "Sessão expirada. Por favor, faça o upload novamente.",
    error_analysis_failed: "A análise falhou. Tente novamente.",
    error_generic: "Ocorreu um erro inesperado.",
    poll_waiting: ["Aguardando confirmação do pagamento…","Verificando pagamento com a Cakto…","Quase lá — confirmando transação…"],
    poll_analyzing: ["Pagamento confirmado. Iniciando análise…","Lendo headline e posicionamento…","Analisando seção Sobre…","Mapeando experiências…","Indexando habilidades e palavras-chave…","Compondo diagnóstico final…"],
    audit_step: "passo 02 · diagnóstico",
    audit_h1: "Sua presença, lida como um pulso.",
    audit_lede: "Cada sinal fraco vira uma pendência — escolha uma, o workshop abre. As pendências permanecem visíveis em todo o app até serem resolvidas.",
    audit_axes: ["clareza","convicção","cadência","qualidade","autenticidade"],
    audit_sections_label: "análise por seção",
    audit_see_thread: "ver pendência",
    brand_step: "passo 03 · workshop",
    brand_h1_1: "Escolha uma pendência.",
    brand_h1_em: "Resolva com o copiloto.",
    brand_lede: "A pendência à esquerda nomeia o problema. O workshop à direita propõe reescritas. Aceite uma — sua pontuação sobe em tempo real.",
    brand_no_threads: "Nenhuma pendência de marca. Envie um PDF para gerar.",
    brand_resolved: "resolvida",
    ws_alternatives: (n) => n > 0 ? `alternativas · ${n}` : "alternativas",
    ws_generating: "Gerando…",
    ws_generate: "Gerar com IA",
    ws_regenerate: "Gerar novamente",
    ws_draft: (n, total) => `rascunho ${n} de ${total}`,
    ws_drafts: "rascunhos",
    ws_words: (n) => `${n} palavras`,
    ws_discard: "Descartar pendência",
    ws_apply_headline: (lift) => `Aplicar e resolver · +${lift}`,
    ws_apply_bio: (lift) => `Aplicar rascunho · +${lift}`,
    ws_apply_banner: (lift) => `Aplicar · +${lift}`,
    ws_resolved: "Resolvida",
    ws_copy: "Copiar",
    ws_no_profile: "Nenhum perfil carregado",
    banner_generating: "Gerando banner…",
    banner_download: "Baixar",
    ws_select_thread: "Selecione uma pendência.",
    outreach_step: "passo 04 · outreach",
    outreach_h1: "Um estrategista, à disposição.",
    outreach_lede: "Cada mensagem enviada é uma aposta. O Lattice ajuda a calibrar a aposta certa e redige por você.",
    outreach_no_threads: "Nenhuma pendência de contato. Envie um PDF para gerar.",
    outreach_pending_label: "pendências",
    convo_thread_label: "pendência de contato",
    convo_ai_intro: "Forneça um sinal de contexto — um post que publicaram, uma mudança de cargo, uma conexão em comum — e eu rascunho três openers: do mais caloroso ao mais direto.",
    draft_label: (n) => `rascunho · v${n}`,
    convo_placeholder: "Sinal de contexto: post, mudança de cargo, conexão em comum…",
    convo_generate: "Gerar",
    convo_regenerate: "Gerar novamente",
    convo_resolve: (lift) => `Resolver · +${lift}`,
    convo_no_signal: "Insira um sinal de contexto primeiro",
    convo_no_profile: "Nenhum perfil carregado",
    tweaks_title: "Ajustes",
    tweaks_color: "Cor",
    tweaks_atmosphere: "Atmosfera",
    tweaks_session: "Sessão",
    tweaks_ambient: "Gradiente ambiente",
    tweaks_grain: "Grão de filme",
    tweaks_copilot: "Painel copiloto",
    tweaks_reset: "Reiniciar sessão",
    copilot_connect: "Exporte seu perfil do LinkedIn como PDF (Mais → Salvar como PDF) e envie aqui. Vou ler como um recrutador sênior leria.",
    copilot_audit: (n) => `${n} pendência${n !== 1 ? 's' : ''} aberta${n !== 1 ? 's' : ''}. Comece pelas de maior severidade — impacto maior, mais rápido.`,
    copilot_brand: "Headline é a edição de maior retorno. Gere as alternativas, escolha a que soa como você no seu melhor momento.",
    copilot_outreach: "Especificidade bate cordialidade. Cite algo concreto que você observou na pessoa.",
    thread_improve: "Melhorar",
  },
  en: {
    nav_connect: "Connect",
    nav_audit: "Audit",
    nav_brand: "Brand Studio",
    nav_outreach: "Outreach",
    copilot_sub: "career copilot",
    score_label: "overall score",
    score_pending: "open threads",
    session_live: "session · live",
    tray_resolved: (pts) => `all resolved · ▲ ${pts} pts earned`,
    tray_open: (n) => `open threads · ${n}`,
    copilot_title: "strategist",
    copilot_silent: "silent when there's nothing useful to say",
    connect_step: "step 01 · connect",
    connect_h1_1: "Upload your LinkedIn PDF.",
    connect_h1_em: "We'll read it like a strategist.",
    connect_sub: "Export your LinkedIn profile (More → Save to PDF) and upload it here. Lattice analyzes 18 signals — positioning, cadence, conviction. Nothing is published.",
    connect_drop_title: "Drag your LinkedIn PDF here",
    connect_drop_sub: "or click to select",
    connect_file_sub: (kb) => `${kb} KB · click to change`,
    connect_btn: "Continue to payment",
    connect_note1: "One-time payment — full analysis with 18 signals.",
    connect_note2: "LinkedIn: More → Save to PDF.",
    connect_note3: "Read-only. We never post on your behalf.",
    connect_preparing: "Preparing payment session…",
    connect_redirect_title: "redirecting to payment",
    connect_redirect_body: "You'll be taken to checkout in a moment. After payment, return to this page — analysis will start automatically.",
    connect_go_pay: "Go to payment",
    connect_cancel: "Cancel",
    connect_cancel_restart: "Cancel and restart",
    connect_retry: "Try again",
    connect_footnote1: "Close and reopen this page after payment if analysis doesn't start.",
    connect_footnote2: "Analysis takes 15–30 seconds after confirmation.",
    error_pdf_only: "Only PDF files are accepted",
    error_session_expired: "Session expired. Please upload again.",
    error_analysis_failed: "Analysis failed. Please try again.",
    error_generic: "An unexpected error occurred.",
    poll_waiting: ["Waiting for payment confirmation…","Verifying payment with Cakto…","Almost there — confirming transaction…"],
    poll_analyzing: ["Payment confirmed. Starting analysis…","Reading headline and positioning…","Analyzing About section…","Mapping experiences…","Indexing skills and keywords…","Composing final diagnosis…"],
    audit_step: "step 02 · diagnosis",
    audit_h1: "Your presence, read as a pulse.",
    audit_lede: "Every weak signal becomes a thread — pick one, the workshop opens. Threads stay visible across the app until resolved.",
    audit_axes: ["clarity","conviction","cadence","quality","authenticity"],
    audit_sections_label: "section analysis",
    audit_see_thread: "see thread",
    brand_step: "step 03 · workshop",
    brand_h1_1: "Pick a thread.",
    brand_h1_em: "Fix it with the copilot.",
    brand_lede: "The thread on the left names the problem. The workshop on the right proposes rewrites. Accept one — your score rises in real time.",
    brand_no_threads: "No brand threads. Upload a PDF to generate.",
    brand_resolved: "resolved",
    ws_alternatives: (n) => n > 0 ? `alternatives · ${n}` : "alternatives",
    ws_generating: "Generating…",
    ws_generate: "Generate with AI",
    ws_regenerate: "Regenerate",
    ws_draft: (n, total) => `draft ${n} of ${total}`,
    ws_drafts: "drafts",
    ws_words: (n) => `${n} words`,
    ws_discard: "Discard thread",
    ws_apply_headline: (lift) => `Apply and resolve · +${lift}`,
    ws_apply_bio: (lift) => `Apply draft · +${lift}`,
    ws_apply_banner: (lift) => `Apply · +${lift}`,
    ws_resolved: "Resolved",
    ws_copy: "Copy",
    ws_no_profile: "No profile loaded",
    banner_generating: "Generating banner…",
    banner_download: "Download",
    ws_select_thread: "Select a thread.",
    outreach_step: "step 04 · outreach",
    outreach_h1: "A strategist, at your service.",
    outreach_lede: "Every message sent is a bet. Lattice helps you calibrate the right bet and drafts it for you.",
    outreach_no_threads: "No outreach threads. Upload a PDF to generate.",
    outreach_pending_label: "threads",
    convo_thread_label: "outreach thread",
    convo_ai_intro: "Give me a context signal — a post they published, a job change, a mutual connection — and I'll draft three openers: from warmest to most direct.",
    draft_label: (n) => `draft · v${n}`,
    convo_placeholder: "Context signal: post, job change, mutual connection…",
    convo_generate: "Generate",
    convo_regenerate: "Regenerate",
    convo_resolve: (lift) => `Resolve · +${lift}`,
    convo_no_signal: "Add a context signal first",
    convo_no_profile: "No profile loaded",
    tweaks_title: "Settings",
    tweaks_color: "Color",
    tweaks_atmosphere: "Atmosphere",
    tweaks_session: "Session",
    tweaks_ambient: "Ambient gradient",
    tweaks_grain: "Film grain",
    tweaks_copilot: "Copilot panel",
    tweaks_reset: "Reset session",
    copilot_connect: "Export your LinkedIn profile as PDF (More → Save to PDF) and upload it here. I'll read it the way a senior recruiter would.",
    copilot_audit: (n) => `${n} open thread${n !== 1 ? 's' : ''}. Start with the highest severity — biggest impact, fastest.`,
    copilot_brand: "Headline is the highest-return edit. Generate alternatives, pick the one that sounds like you at your best.",
    copilot_outreach: "Specificity beats warmth. Cite something concrete you noticed about the person.",
    thread_improve: "Improve",
  },
  es: {
    nav_connect: "Conectar",
    nav_audit: "Auditoría",
    nav_brand: "Brand Studio",
    nav_outreach: "Outreach",
    copilot_sub: "copiloto de carrera",
    score_label: "puntuación general",
    score_pending: "pendientes",
    session_live: "sesión · en vivo",
    tray_resolved: (pts) => `todas resueltas · ▲ ${pts} pts ganados`,
    tray_open: (n) => `pendientes abiertas · ${n}`,
    copilot_title: "estratega",
    copilot_silent: "silencioso cuando no hay nada útil que decir",
    connect_step: "paso 01 · conectar",
    connect_h1_1: "Sube tu PDF de LinkedIn.",
    connect_h1_em: "Lo leeremos como un estratega.",
    connect_sub: "Exporta tu perfil de LinkedIn (Más → Guardar como PDF) y súbelo aquí. Lattice analiza 18 señales — posicionamiento, cadencia, convicción. Nada se publica.",
    connect_drop_title: "Arrastra tu PDF de LinkedIn aquí",
    connect_drop_sub: "o haz clic para seleccionar",
    connect_file_sub: (kb) => `${kb} KB · clic para cambiar`,
    connect_btn: "Continuar al pago",
    connect_note1: "Pago único — análisis completo con 18 señales.",
    connect_note2: "LinkedIn: Más → Guardar como PDF.",
    connect_note3: "Solo lectura. Nunca publicamos en tu nombre.",
    connect_preparing: "Preparando sesión de pago…",
    connect_redirect_title: "redirigiendo al pago",
    connect_redirect_body: "Serás llevado al checkout en instantes. Después del pago, regresa a esta página — el análisis comenzará automáticamente.",
    connect_go_pay: "Ir al pago",
    connect_cancel: "Cancelar",
    connect_cancel_restart: "Cancelar y reiniciar",
    connect_retry: "Intentar de nuevo",
    connect_footnote1: "Cierra y vuelve a abrir esta página tras el pago si el análisis no comienza.",
    connect_footnote2: "El análisis tarda entre 15 y 30 segundos tras la confirmación.",
    error_pdf_only: "Solo se aceptan archivos PDF",
    error_session_expired: "Sesión expirada. Por favor, sube el archivo de nuevo.",
    error_analysis_failed: "El análisis falló. Inténtalo de nuevo.",
    error_generic: "Ocurrió un error inesperado.",
    poll_waiting: ["Esperando confirmación de pago…","Verificando pago con Cakto…","Casi listo — confirmando transacción…"],
    poll_analyzing: ["Pago confirmado. Iniciando análisis…","Leyendo headline y posicionamiento…","Analizando sección Acerca de…","Mapeando experiencias…","Indexando habilidades y palabras clave…","Componiendo diagnóstico final…"],
    audit_step: "paso 02 · diagnóstico",
    audit_h1: "Tu presencia, leída como un pulso.",
    audit_lede: "Cada señal débil se convierte en una tarea — elige una, el taller se abre. Las tareas permanecen visibles en toda la app hasta resolverse.",
    audit_axes: ["claridad","convicción","cadencia","calidad","autenticidad"],
    audit_sections_label: "análisis por sección",
    audit_see_thread: "ver tarea",
    brand_step: "paso 03 · taller",
    brand_h1_1: "Elige una tarea.",
    brand_h1_em: "Resuélvela con el copiloto.",
    brand_lede: "La tarea a la izquierda nombra el problema. El taller a la derecha propone reescrituras. Acepta una — tu puntuación sube en tiempo real.",
    brand_no_threads: "Sin tareas de marca. Sube un PDF para generar.",
    brand_resolved: "resuelta",
    ws_alternatives: (n) => n > 0 ? `alternativas · ${n}` : "alternativas",
    ws_generating: "Generando…",
    ws_generate: "Generar con IA",
    ws_regenerate: "Generar de nuevo",
    ws_draft: (n, total) => `borrador ${n} de ${total}`,
    ws_drafts: "borradores",
    ws_words: (n) => `${n} palabras`,
    ws_discard: "Descartar tarea",
    ws_apply_headline: (lift) => `Aplicar y resolver · +${lift}`,
    ws_apply_bio: (lift) => `Aplicar borrador · +${lift}`,
    ws_apply_banner: (lift) => `Aplicar · +${lift}`,
    ws_resolved: "Resuelta",
    ws_copy: "Copiar",
    ws_no_profile: "Ningún perfil cargado",
    banner_generating: "Generando banner…",
    banner_download: "Descargar",
    ws_select_thread: "Selecciona una tarea.",
    outreach_step: "paso 04 · outreach",
    outreach_h1: "Un estratega, a tu disposición.",
    outreach_lede: "Cada mensaje enviado es una apuesta. Lattice ayuda a calibrar la apuesta correcta y lo redacta por ti.",
    outreach_no_threads: "Sin tareas de contacto. Sube un PDF para generar.",
    outreach_pending_label: "tareas",
    convo_thread_label: "tarea de contacto",
    convo_ai_intro: "Dame una señal de contexto — un post que publicaron, un cambio de cargo, una conexión en común — y yo redacto tres openers: del más cálido al más directo.",
    draft_label: (n) => `borrador · v${n}`,
    convo_placeholder: "Señal de contexto: post, cambio de cargo, conexión en común…",
    convo_generate: "Generar",
    convo_regenerate: "Generar de nuevo",
    convo_resolve: (lift) => `Resolver · +${lift}`,
    convo_no_signal: "Añade una señal de contexto primero",
    convo_no_profile: "Ningún perfil cargado",
    tweaks_title: "Ajustes",
    tweaks_color: "Color",
    tweaks_atmosphere: "Atmósfera",
    tweaks_session: "Sesión",
    tweaks_ambient: "Gradiente ambiente",
    tweaks_grain: "Grano de película",
    tweaks_copilot: "Panel copiloto",
    tweaks_reset: "Reiniciar sesión",
    copilot_connect: "Exporta tu perfil de LinkedIn como PDF (Más → Guardar como PDF) y súbelo aquí. Lo leeré como lo haría un reclutador senior.",
    copilot_audit: (n) => `${n} tarea${n !== 1 ? 's' : ''} abierta${n !== 1 ? 's' : ''}. Empieza por las de mayor severidad — mayor impacto, más rápido.`,
    copilot_brand: "El headline es la edición de mayor retorno. Genera alternativas, elige la que suene como tú en tu mejor momento.",
    copilot_outreach: "La especificidad supera a la cordialidad. Cita algo concreto que hayas observado de la persona.",
    thread_improve: "Mejorar",
  },
};

function generateThreadsFromBreakdown(breakdown, tr) {
  const improveWord = tr ? tr.thread_improve : "Melhorar";
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
        title: item.suggestions?.[0] || `${improveWord} ${item.category}`,
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

// ---------- Language Switcher ----------
function LanguageSwitcher({ lang, setLang }) {
  return (
    <div className="lang-switcher">
      {["pt", "en", "es"].map(l => (
        <button key={l} className={`lang-btn ${lang === l ? "on" : ""}`} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ---------- Barra lateral ----------
function Sidebar({ screen, setScreen, threads, tr, lang, setLang }) {
  const items = [
    { k: "connect",  label: tr.nav_connect,  icon: "M3 12h18M3 6h18M3 18h18" },
    { k: "audit",    label: tr.nav_audit,    icon: "M3 12c4-8 14-8 18 0" },
    { k: "brand",    label: tr.nav_brand,    icon: "M4 20l4-12 4 8 4-4 4 8" },
    { k: "outreach", label: tr.nav_outreach, icon: "M3 5h18v12H8l-5 4z" },
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
        <LanguageSwitcher lang={lang} setLang={setLang} />
        <div className="user-row">
          <div className="avatar">L</div>
          <div>
            <div className="user-name">Lattice</div>
            <Mono className="user-sub">{tr.copilot_sub}</Mono>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ---------- Header de pontuação ----------
function ScoreHeader({ score, prevScore, threads, accent, tr }) {
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
            <Mono className="score-lbl">{tr.score_label}</Mono>
            {delta !== 0 && (
              <Mono className="score-delta" style={{ color: a.glow }}>
                {delta > 0 ? "▲" : "▽"} {Math.abs(delta)}
              </Mono>
            )}
          </div>
        </div>
        <div className="score-divider" />
        <div className="thread-count">
          <Mono>{tr.score_pending}</Mono>
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
          <Mono>{tr.session_live}</Mono>
        </div>
      </div>
    </header>
  );
}

// ---------- Bandeja de pendências ----------
function ThreadTray({ threads, onOpen, accent, tr }) {
  const [open, setOpen] = useState(true);
  const a = ACCENTS[accent];
  const unresolved = threads.filter(t => !t.resolved);
  if (unresolved.length === 0) return (
    <div className="thread-tray empty">
      <Mono>{tr.tray_resolved(threads.reduce((s,t) => s + t.lift, 0))}</Mono>
    </div>
  );
  return (
    <div className={`thread-tray ${open ? "open" : ""}`}>
      <button className="tray-toggle" onClick={() => setOpen(!open)}>
        <Mono>{tr.tray_open(unresolved.length)}</Mono>
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
function CopilotRail({ context, accent, visible, tr }) {
  if (!visible) return null;
  const a = ACCENTS[accent];
  return (
    <aside className="copilot">
      <div className="copilot-head">
        <span className="copilot-glyph" style={{ background: a.glow }} />
        <Mono>{tr.copilot_title}</Mono>
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
        <Mono>{tr.copilot_silent}</Mono>
      </div>
    </aside>
  );
}

// ============================================================
// TELA: CONECTAR
// ============================================================
const SESSION_KEY = 'lattice_payment_session';

function _resolveInitialSession() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSession = params.get('utm_content');
    if (utmSession) {
      const saved = (() => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } })();
      const entry = saved?.sessionId === utmSession ? saved : { sessionId: utmSession, checkoutUrl: null };
      localStorage.setItem(SESSION_KEY, JSON.stringify(entry));
      const clean = window.location.pathname + (window.location.hash || '');
      window.history.replaceState(null, '', clean);
      return entry;
    }
  } catch (_) {}
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

function ConnectScreen({ onComplete, accent, tr }) {
  const a = ACCENTS[accent];
  const inputRef = useRef(null);

  const saved = _resolveInitialSession();

  const [stage, setStage]         = useState(saved ? "waiting_pay" : "idle");
  const [sessionId, setSessionId] = useState(saved?.sessionId || null);
  const [checkoutUrl, setCheckoutUrl] = useState(saved?.checkoutUrl || null);
  const [file, setFile]           = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [errMsg, setErrMsg]       = useState("");
  const [pollMsg, setPollMsg]     = useState(tr.poll_waiting[0]);

  useEffect(() => {
    if (stage !== "waiting_pay" && stage !== "analyzing") return;
    if (!sessionId) return;

    let cancelled = false;
    const INTERVAL = 3500;
    let tick = 0;
    const id = setInterval(async () => {
      if (cancelled) return;
      tick++;

      try {
        const res = await fetch(`${API}/payment/status/${sessionId}`);

        if (res.status === 404) {
          clearInterval(id);
          localStorage.removeItem(SESSION_KEY);
          if (!cancelled) { setStage("error"); setErrMsg(tr.error_session_expired); }
          return;
        }

        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "completed") {
          clearInterval(id);
          localStorage.removeItem(SESSION_KEY);
          if (!cancelled) {
            setStage("done");
            onComplete({
              profile:        { id: data.profile_id },
              overall_score:  data.overall_score ?? 0,
              score_breakdown: data.score_breakdown ?? [],
            });
          }
          return;
        }

        if (data.status === "failed") {
          clearInterval(id);
          localStorage.removeItem(SESSION_KEY);
          if (!cancelled) { setStage("error"); setErrMsg(tr.error_analysis_failed); }
          return;
        }

        if (data.status === "analyzing" || data.status === "paid") {
          if (!cancelled) {
            setStage("analyzing");
            setPollMsg(tr.poll_analyzing[tick % tr.poll_analyzing.length]);
          }
          return;
        }

        if (!cancelled) setPollMsg(tr.poll_waiting[tick % tr.poll_waiting.length]);

      } catch (_) { /* network blip */ }
    }, INTERVAL);

    return () => { cancelled = true; clearInterval(id); };
  }, [stage, sessionId, tr]);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) { setErrMsg(tr.error_pdf_only); return; }
    setErrMsg('');
    setFile(f);
  };

  const handlePay = async () => {
    if (!file || stage !== "idle") return;
    setStage("submitting");
    setErrMsg("");
    try {
      const form = new FormData();
      form.append('pdf_file', file);
      const res = await fetch(`${API}/payment/checkout-pdf`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
        throw new Error(err.detail || 'Falha ao criar sessão de pagamento');
      }
      const { session_id, checkout_url } = await res.json();
      localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: session_id, checkoutUrl: checkout_url }));
      setSessionId(session_id);
      setCheckoutUrl(checkout_url);
      setStage("redirecting");
      setTimeout(() => { window.location.href = checkout_url; }, 800);
    } catch (e) {
      setStage("error");
      setErrMsg(e.message);
    }
  };

  const reset = () => {
    localStorage.removeItem(SESSION_KEY);
    setStage("idle"); setFile(null); setErrMsg(""); setSessionId(null); setCheckoutUrl(null);
  };

  return (
    <div className="screen connect-screen" data-screen-label="Conectar">
      <div className="connect-shell">
        <Mono className="connect-eyebrow">{tr.connect_step}</Mono>
        <h1 className="connect-h1">
          {tr.connect_h1_1}<br/>
          <em style={{ color: a.glow }}>{tr.connect_h1_em}</em>
        </h1>

        {stage === "idle" && (
          <>
            <p className="connect-sub">{tr.connect_sub}</p>
            <div style={{display:'flex',flexDirection:'column',gap:'14px',maxWidth:'440px'}}>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                style={{
                  border: `1.5px dashed ${file ? a.glow : dragOver ? a.soft : 'oklch(0.32 0.02 270)'}`,
                  borderRadius: '10px', padding: '32px 24px', textAlign: 'center',
                  cursor: 'pointer', transition: 'border-color .2s, background .2s',
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
                    <p style={{color: a.glow, fontWeight:500, fontSize:'13px', marginBottom:'4px'}}>{file.name}</p>
                    <Mono style={{color:'oklch(0.50 0.02 270)',fontSize:'11px'}}>{tr.connect_file_sub((file.size/1024).toFixed(0))}</Mono>
                  </>
                ) : (
                  <>
                    <p style={{fontWeight:500, fontSize:'13px', marginBottom:'4px', color:'oklch(0.85 0.01 270)'}}>{tr.connect_drop_title}</p>
                    <Mono style={{color:'oklch(0.50 0.02 270)',fontSize:'11px'}}>{tr.connect_drop_sub}</Mono>
                  </>
                )}
              </div>
              {errMsg && <Mono style={{color:'oklch(0.65 0.18 28)',fontSize:'12px'}}>{errMsg}</Mono>}
              <button className="btn-primary lg" disabled={!file} onClick={handlePay}
                style={{opacity: file ? 1 : 0.38, cursor: file ? 'default' : 'not-allowed'}}>
                <span>{tr.connect_btn}</span>
                <Mono className="btn-kbd">⏎</Mono>
              </button>
              <div className="connect-footnotes" style={{marginTop:'4px'}}>
                <div><Mono>·</Mono><span>{tr.connect_note1}</span></div>
                <div><Mono>·</Mono><span>{tr.connect_note2}</span></div>
                <div><Mono>·</Mono><span>{tr.connect_note3}</span></div>
              </div>
            </div>
          </>
        )}

        {stage === "submitting" && (
          <div style={{display:'flex',alignItems:'center',gap:'14px',paddingTop:'8px'}}>
            <div style={{width:'16px',height:'16px',borderRadius:'50%',border:`2px solid ${a.glow}`,borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}} />
            <Mono style={{color:'oklch(0.58 0.02 270)',textTransform:'none',letterSpacing:0}}>{tr.connect_preparing}</Mono>
          </div>
        )}

        {stage === "redirecting" && (
          <div style={{display:'flex',flexDirection:'column',gap:'16px',maxWidth:'440px'}}>
            <div style={{
              background:`color-mix(in oklch, ${a.deep} 20%, transparent)`,
              border:`1px solid color-mix(in oklch, ${a.glow} 30%, oklch(0.30 0.02 270))`,
              borderRadius:'10px', padding:'20px 22px',
            }}>
              <Mono style={{color: a.glow, display:'block', marginBottom:'8px'}}>{tr.connect_redirect_title}</Mono>
              <p style={{margin:0,fontSize:'14px',color:'oklch(0.78 0.01 270)',lineHeight:1.5}}>
                {tr.connect_redirect_body}
              </p>
            </div>
          </div>
        )}

        {(stage === "waiting_pay" || stage === "analyzing") && (
          <div style={{display:'flex',flexDirection:'column',gap:'20px',maxWidth:'440px'}}>
            <div style={{
              background:'oklch(0.16 0.014 270 / 0.6)',
              border:'1px solid oklch(0.28 0.02 270)',
              borderRadius:'10px', padding:'20px 22px',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background: stage === "analyzing" ? a.glow : 'oklch(0.58 0.02 270)',boxShadow: stage === "analyzing" ? `0 0 10px ${a.glow}` : 'none',animation:'pulse 2s ease-in-out infinite'}} />
                <Mono style={{color: stage === "analyzing" ? a.glow : 'oklch(0.58 0.02 270)', textTransform:'none', letterSpacing:0, fontSize:'12px'}}>
                  {pollMsg}
                </Mono>
              </div>
              {stage === "analyzing" && (
                <div style={{height:'2px',background:'oklch(0.22 0.012 270)',borderRadius:'1px',overflow:'hidden'}}>
                  <div style={{height:'100%',background:`linear-gradient(90deg, ${a.deep}, ${a.glow})`,borderRadius:'1px',width:'70%',animation:'grow 8s ease-in-out infinite alternate'}} />
                </div>
              )}
            </div>

            {checkoutUrl && stage === "waiting_pay" && (
              <div style={{display:'flex',gap:'10px'}}>
                <button className="btn-primary sm" onClick={() => { window.location.href = checkoutUrl; }}>
                  {tr.connect_go_pay}
                </button>
                <button className="btn-ghost sm" onClick={reset}>{tr.connect_cancel}</button>
              </div>
            )}
            {stage === "waiting_pay" && !checkoutUrl && (
              <button className="btn-ghost sm" style={{alignSelf:'flex-start'}} onClick={reset}>{tr.connect_cancel_restart}</button>
            )}

            <div className="connect-footnotes">
              <div><Mono>·</Mono><span>{tr.connect_footnote1}</span></div>
              <div><Mono>·</Mono><span>{tr.connect_footnote2}</span></div>
            </div>
          </div>
        )}

        {stage === "error" && (
          <div style={{display:'flex',flexDirection:'column',gap:'16px',maxWidth:'440px'}}>
            <Mono style={{color:'oklch(0.65 0.18 28)',fontSize:'12px',background:'oklch(0.65 0.18 28 / 0.08)',border:'1px solid oklch(0.65 0.18 28 / 0.20)',borderRadius:'8px',padding:'10px 14px',textTransform:'none',letterSpacing:0}}>
              {errMsg || tr.error_generic}
            </Mono>
            <button className="btn-ghost sm" style={{alignSelf:'flex-start'}} onClick={reset}>{tr.connect_retry}</button>
          </div>
        )}
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
function AuditScreen({ threads, onOpenThread, accent, scoreBreakdown, overallScore, tr }) {
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
          <Mono className="eyebrow">{tr.audit_step}</Mono>
          <h1>{tr.audit_h1}</h1>
        </div>
        <p className="screen-lede">{tr.audit_lede}</p>
      </div>

      <div className="audit-main">
        <div className="pulse-stage">
          <Pulse accent={a} threads={threads} onOpen={onOpenThread} />
          <div className="pulse-axis">
            {tr.audit_axes.map(t => (
              <Mono key={t}>{t}</Mono>
            ))}
          </div>
        </div>

        <div className="audit-grades">
          <Mono className="grades-eyebrow">{tr.audit_sections_label}</Mono>
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
                      <span>{tr.audit_see_thread}</span>
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
function BrandStudio({ threads, activeThreadId, onResolve, onPickThread, accent, profileId, tr }) {
  const a = ACCENTS[accent];
  const localThreads = threads.filter(t => t.screen === "brand");
  const active = localThreads.find(t => t.id === activeThreadId) || localThreads.find(t => !t.resolved) || localThreads[0];

  return (
    <div className="screen brand-screen" data-screen-label="Brand Studio">
      <div className="screen-head">
        <div>
          <Mono className="eyebrow">{tr.brand_step}</Mono>
          <h1>{tr.brand_h1_1}<br/><em style={{color: a.glow}}>{tr.brand_h1_em}</em></h1>
        </div>
        <p className="screen-lede">{tr.brand_lede}</p>
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
                ? <Mono className="pick-state done">{tr.brand_resolved}</Mono>
                : <Mono className="pick-state" style={{color: a.glow}}>+{t.lift}</Mono>}
            </button>
          )) : (
            <div style={{padding:'16px', color:'oklch(0.50 0.02 270)'}}>
              <Mono>{tr.brand_no_threads}</Mono>
            </div>
          )}
        </div>

        <div className="workshop">
          {active
            ? <Workshop thread={active} accent={a} onResolve={onResolve} profileId={profileId} tr={tr} />
            : <div className="workshop-empty"><Mono>{tr.ws_select_thread}</Mono></div>
          }
        </div>
      </div>
    </div>
  );
}

function Workshop({ thread, accent, onResolve, profileId, tr }) {
  if (thread.target === "headline") return <HeadlineWorkshop thread={thread} accent={accent} onResolve={onResolve} profileId={profileId} tr={tr} />;
  if (thread.target === "bio")      return <BioWorkshop thread={thread} accent={accent} onResolve={onResolve} profileId={profileId} tr={tr} />;
  if (thread.target === "banner")   return <BannerWorkshop thread={thread} accent={accent} onResolve={onResolve} profileId={profileId} tr={tr} />;
  return <BioWorkshop thread={thread} accent={accent} onResolve={onResolve} profileId={profileId} tr={tr} />;
}

function HeadlineWorkshop({ thread, accent, onResolve, profileId, tr }) {
  const [picked, setPicked] = useState(null);
  const [alts, setAlts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!profileId) { setError(tr.ws_no_profile); return; }
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
          <Mono className="ws-section-lbl">{tr.ws_alternatives(alts.length)}</Mono>
          <button className="btn-ghost sm" onClick={generate} disabled={loading}>
            {loading ? tr.ws_generating : alts.length > 0 ? tr.ws_regenerate : tr.ws_generate}
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
                >{tr.ws_copy}</button>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ws-foot">
        <button className="btn-ghost">{tr.ws_discard}</button>
        <button className="btn-primary" disabled={alts.length === 0 || thread.resolved} onClick={() => onResolve(thread.id)}>
          {thread.resolved ? tr.ws_resolved : tr.ws_apply_headline(thread.lift)}
          {!thread.resolved && <Mono className="btn-kbd">⌘ ⏎</Mono>}
        </button>
      </div>
    </div>
  );
}

function BioWorkshop({ thread, accent, onResolve, profileId, tr }) {
  const [drafts, setDrafts] = useState([]);
  const [draft, setDraft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!profileId) { setError(tr.ws_no_profile); return; }
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
          <Mono className="ws-section-lbl">{drafts.length > 0 ? tr.ws_draft(draft+1, drafts.length) : tr.ws_drafts}</Mono>
          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
            {drafts.length > 0 && (
              <>
                <button className="btn-ghost sm" onClick={() => setDraft(Math.max(0,draft-1))}>‹</button>
                <button className="btn-ghost sm" onClick={() => setDraft(Math.min(drafts.length-1,draft+1))}>›</button>
              </>
            )}
            <button className="btn-ghost sm" onClick={generate} disabled={loading}>
              {loading ? tr.ws_generating : drafts.length > 0 ? tr.ws_regenerate : tr.ws_generate}
            </button>
          </div>
        </div>
        {error && <Mono style={{color:'oklch(0.65 0.18 28)',fontSize:'12px',marginTop:'8px'}}>{error}</Mono>}
        {current && (
          <div className="bio-card">
            <p className="bio-text">{current}</p>
            <div className="bio-meta">
              <Mono>{tr.ws_words(current.split(" ").length)}</Mono>
            </div>
          </div>
        )}
      </div>
      <div className="ws-foot">
        <button className="btn-ghost" onClick={() => current && navigator.clipboard.writeText(current)} disabled={!current}>
          {tr.ws_copy}
        </button>
        <button className="btn-primary" disabled={thread.resolved || drafts.length === 0} onClick={() => onResolve(thread.id)}>
          {thread.resolved ? tr.ws_resolved : tr.ws_apply_bio(thread.lift)}
        </button>
      </div>
    </div>
  );
}

function BannerWorkshop({ thread, accent, onResolve, profileId, tr }) {
  const [bannerUrl, setBannerUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!profileId) { setError(tr.ws_no_profile); return; }
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
            {loading ? tr.banner_generating : '1584 × 396'}
          </Mono>
        </div>
      )}
      {error && <Mono style={{color:'oklch(0.65 0.18 28)',fontSize:'12px',marginBottom:'8px'}}>{error}</Mono>}
      <div className="ws-foot">
        <button className="btn-ghost" onClick={generate} disabled={loading}>
          {loading ? tr.ws_generating : bannerUrl ? tr.ws_regenerate : tr.ws_generate}
        </button>
        {bannerUrl && (
          <a href={bannerUrl} download="banner-linkedin.svg"
            className="btn-ghost" style={{textDecoration:'none',display:'inline-flex',alignItems:'center'}}>
            {tr.banner_download}
          </a>
        )}
        <button className="btn-primary" disabled={thread.resolved || !bannerUrl} onClick={() => onResolve(thread.id)}>
          {thread.resolved ? tr.ws_resolved : tr.ws_apply_banner(thread.lift)}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// TELA: OUTREACH
// ============================================================
function OutreachScreen({ threads, activeThreadId, onResolve, onPickThread, accent, profileId, tr }) {
  const a = ACCENTS[accent];
  const localThreads = threads.filter(t => t.screen === "outreach");
  const active = localThreads.find(t => t.id === activeThreadId) || localThreads.find(t => !t.resolved) || localThreads[0];

  return (
    <div className="screen outreach-screen" data-screen-label="Outreach">
      <div className="screen-head">
        <div>
          <Mono className="eyebrow">{tr.outreach_step}</Mono>
          <h1>{tr.outreach_h1}</h1>
        </div>
        <p className="screen-lede">{tr.outreach_lede}</p>
      </div>

      <div className="outreach-grid">
        <div className="targets">
          <Mono className="targets-lbl">{tr.outreach_pending_label}</Mono>
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
              <Mono>{tr.outreach_no_threads}</Mono>
            </div>
          )}
        </div>

        <div className="convo">
          {active && <Conversation thread={active} accent={a} onResolve={onResolve} profileId={profileId} tr={tr} />}
        </div>
      </div>
    </div>
  );
}

function Conversation({ thread, accent, onResolve, profileId, tr }) {
  const [signal, setSignal] = useState('');
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!profileId) { setError(tr.convo_no_profile); return; }
    if (!signal.trim()) { setError(tr.convo_no_signal); return; }
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
        <Mono className="convo-thread">{tr.convo_thread_label}</Mono>
      </div>
      <div className="convo-body">
        <div className="msg from-ai">
          <Mono className="who">{tr.copilot_title}</Mono>
          <p>{thread.note || thread.title}</p>
        </div>
        {pitches.length === 0 && (
          <div className="msg from-ai">
            <Mono className="who">{tr.copilot_title}</Mono>
            <p>{tr.convo_ai_intro}</p>
          </div>
        )}
        {pitches.map((p, i) => (
          <div key={i} className="draft-card">
            <div className="draft-head">
              <Mono>{tr.draft_label(i+1)}</Mono>
              <button className="btn-ghost sm" style={{fontSize:'11px'}} onClick={() => navigator.clipboard.writeText(p)}>{tr.ws_copy}</button>
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
          placeholder={tr.convo_placeholder}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(); }}
        />
        <Mono className="kbd">⌘ ⏎</Mono>
        <button className="btn-primary sm" onClick={generate} disabled={loading || !signal.trim()}>
          {loading ? '…' : pitches.length > 0 ? tr.convo_regenerate : tr.convo_generate}
        </button>
        {pitches.length > 0 && (
          <button className="btn-primary sm" disabled={thread.resolved} onClick={() => onResolve(thread.id)}
            style={{marginLeft:'6px'}}>
            {thread.resolved ? tr.ws_resolved : tr.convo_resolve(thread.lift)}
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

  // Language state
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('lattice_lang');
      if (saved && TRANSLATIONS[saved]) return saved;
    } catch (_) {}
    const bl = (navigator.language || '').toLowerCase();
    if (bl.startsWith('es')) return 'es';
    if (bl.startsWith('en')) return 'en';
    return 'pt';
  });

  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem('lattice_lang', l); } catch (_) {}
  };

  const tr = TRANSLATIONS[lang] || TRANSLATIONS.pt;

  const onConnectComplete = useCallback((data) => {
    const pid = data.profile?.id || null;
    const score = data.overall_score ?? 0;
    const breakdown = data.score_breakdown ?? [];

    setProfileId(pid);
    setScoreBreakdown(breakdown);
    setScoreState({ current: score, prev: 0 });

    const newThreads = generateThreadsFromBreakdown(breakdown, tr);
    setThreads(newThreads);
    setScreen("audit");
    setTimeout(() => setScoreState(prev => ({ ...prev, prev: prev.current })), 2400);
  }, [tr]);

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
    if (screen === "connect")  return [{ kind: "info", text: tr.copilot_connect }];
    if (screen === "audit")    return [{ kind: "info", text: tr.copilot_audit(open) }];
    if (screen === "brand")    return [{ kind: "info", text: tr.copilot_brand }];
    if (screen === "outreach") return [{ kind: "info", text: tr.copilot_outreach }];
    return [];
  }, [screen, threads, tr]);

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
        <Sidebar screen={screen} setScreen={setScreen} threads={threads} tr={tr} lang={lang} setLang={setLang} />

        <div className="app-main">
          {screen !== "connect" && (
            <ScoreHeader score={scoreState.current} prevScore={scoreState.prev} threads={threads} accent={accent} tr={tr} />
          )}
          <div className="app-stage">
            {screen === "connect"  && <ConnectScreen onComplete={onConnectComplete} accent={accent} tr={tr} />}
            {screen === "audit"    && <AuditScreen threads={threads} onOpenThread={openThread} accent={accent} scoreBreakdown={scoreBreakdown} overallScore={scoreState.current} tr={tr} />}
            {screen === "brand"    && <BrandStudio threads={threads} activeThreadId={activeThread} onResolve={resolveThread} onPickThread={pickThread} accent={accent} profileId={profileId} tr={tr} />}
            {screen === "outreach" && <OutreachScreen threads={threads} activeThreadId={activeThread} onResolve={resolveThread} onPickThread={pickThread} accent={accent} profileId={profileId} tr={tr} />}
          </div>
          {screen !== "connect" && (
            <ThreadTray threads={threads} onOpen={openThread} accent={accent} tr={tr} />
          )}
        </div>

        {screen !== "connect" && (
          <CopilotRail context={copilotCtx} accent={accent} visible={t.showCopilot} tr={tr} />
        )}
      </div>

      <TweaksPanel title={tr.tweaks_title}>
        <TweakSection label={tr.tweaks_color}>
          <TweakRadio
            value={t.accent}
            onChange={v => setTweak("accent", v)}
            options={Object.entries(ACCENTS).map(([k,v]) => ({ value: k, label: v.name }))}
          />
        </TweakSection>
        <TweakSection label={tr.tweaks_atmosphere}>
          <TweakToggle label={tr.tweaks_ambient} value={t.showAmbient} onChange={v => setTweak("showAmbient", v)} />
          <TweakToggle label={tr.tweaks_grain} value={t.showGrain} onChange={v => setTweak("showGrain", v)} />
          <TweakToggle label={tr.tweaks_copilot} value={t.showCopilot} onChange={v => setTweak("showCopilot", v)} />
        </TweakSection>
        <TweakSection label={tr.tweaks_session}>
          <TweakButton label={tr.tweaks_reset} onClick={reset} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
