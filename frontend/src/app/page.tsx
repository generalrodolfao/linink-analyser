import Link from 'next/link'

const features = [
  { title: 'Auditoria de Perfil', desc: 'Score 0–100 em 10 critérios com sugestões específicas por seção.', href: '/dashboard/profile' },
  { title: 'Personal Branding', desc: 'Headlines, bio e banner gerados com IA a partir do seu perfil.', href: '/dashboard/branding' },
  { title: 'Outreach Inteligente', desc: 'Pitches e e-mails personalizados baseados em sinais de contexto.', href: '/dashboard/outreach' },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-8 py-4">
        <span className="text-sm font-medium text-foreground tracking-tight">LinkedIn Pro-Copilot</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-24">
        <div className="max-w-2xl w-full space-y-16">
          <div className="space-y-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Copiloto de carreira</p>
            <h1 className="text-5xl font-semibold tracking-tight text-foreground leading-tight">
              Seu perfil LinkedIn,<br />otimizado com IA.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Análise completa, branding personalizado e outreach baseado em intenção.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
              >
                Analisar meu perfil
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </div>

          <div className="border-t border-border pt-12 space-y-6">
            {features.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="flex items-start justify-between gap-8 group py-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{f.title}</p>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
                <svg className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
