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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 px-6 py-0">
        <div className="max-w-5xl mx-auto flex items-center gap-8 h-12">
          <Link href="/" className="text-sm font-semibold text-foreground tracking-tight shrink-0">
            LinkedIn Pro-Copilot
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
