import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-blue-600">
            LinkedIn Pro-Copilot
          </Link>
          <div className="flex gap-1">
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm">Perfil</Button>
            </Link>
            <Link href="/dashboard/branding">
              <Button variant="ghost" size="sm">Branding</Button>
            </Link>
            <Link href="/dashboard/outreach">
              <Button variant="ghost" size="sm">Outreach</Button>
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  )
}
