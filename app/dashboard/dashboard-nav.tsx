'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/dashboard', label: 'Evaluaciones', exact: true },
  { href: '/dashboard/test-cases', label: 'Test Cases', exact: false },
  { href: '/dashboard/prompt-variants', label: 'Prompt Variants', exact: false },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-1">
        <span className="font-semibold text-sm mr-6 text-foreground">Evaluation Lab</span>
        {LINKS.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
