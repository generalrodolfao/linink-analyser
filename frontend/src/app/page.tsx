import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-3xl text-center space-y-8">
        <Badge variant="secondary" className="text-sm">MVP · Copiloto</Badge>
        <h1 className="text-5xl font-bold tracking-tight">
          LinkedIn <span className="text-blue-400">Pro-Copilot</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-xl mx-auto">
          Otimize seu perfil, gere abordagens personalizadas e acelere sua carreira com I.A.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/dashboard">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
              Começar Agora
            </Button>
          </Link>
          <Link href="/dashboard/profile">
            <Button size="lg" variant="outline" className="cursor-pointer">
              Analisar Perfil
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 text-left">
          {[
            { title: 'Auditoria de Perfil', desc: 'Score 0-100 com checklist de melhorias detalhada', icon: '📊' },
            { title: 'Geração de Branding', desc: 'Headlines, bio e banner gerados por I.A.', icon: '✨' },
            { title: 'Inteligência de Outreach', desc: 'Pitches e e-mails personalizados por sinal', icon: '🎯' },
          ].map((feature) => (
            <div key={feature.title} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
