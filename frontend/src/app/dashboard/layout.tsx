'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard/profile', label: 'Perfil' },
  { href: '/dashboard/branding', label: 'Branding' },
  { href: '/dashboard/outreach', label: 'Outreach' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-11 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-foreground">
            LinkedIn Pro-Copilot
          </Link>
          <nav className="flex items-center gap-0.5">
            {nav.map(({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    active
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  )
}
