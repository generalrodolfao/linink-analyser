import Link from 'next/link'

const sections = [
  { href: '/dashboard/profile', label: 'Perfil', desc: 'Análise completa com score e recomendações' },
  { href: '/dashboard/branding', label: 'Branding', desc: 'Headlines, bio e banner gerados com IA' },
  { href: '/dashboard/outreach', label: 'Outreach', desc: 'Pitches e e-mails personalizados' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Início</h1>
        <p className="text-sm text-muted-foreground">Selecione uma seção para começar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sections.map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 p-5 rounded-lg border border-border bg-card hover:border-border/80 hover:bg-muted/30 transition-colors"
          >
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            <svg className="text-muted-foreground group-hover:text-foreground transition-colors mt-auto" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
