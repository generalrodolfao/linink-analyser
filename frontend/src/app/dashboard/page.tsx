import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const features = [
  {
    href: '/dashboard/profile',
    icon: '📊',
    title: 'Auditoria de Perfil',
    description: 'Analise e pontue seu perfil do LinkedIn com base em 10 critérios.',
    label: 'Analisar Perfil',
  },
  {
    href: '/dashboard/branding',
    icon: '✨',
    title: 'Geração de Branding',
    description: 'Gere headlines, bio e banner personalizados com I.A.',
    label: 'Gerar Branding',
    outline: true,
  },
  {
    href: '/dashboard/outreach',
    icon: '🎯',
    title: 'Inteligência de Outreach',
    description: 'Crie pitches e e-mails de candidatura personalizados.',
    label: 'Gerar Outreach',
    outline: true,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Seu copiloto de LinkedIn</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <Card key={f.href} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>
                <span className="mr-2">{f.icon}</span>
                {f.title}
              </CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={f.href}>
                <Button className="w-full" variant={f.outline ? 'outline' : 'default'}>
                  {f.label}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
