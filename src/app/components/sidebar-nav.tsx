'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Sidebar navigation for the authenticated app.
 *
 * WHY: Matches the v1 SessionIQ design — dark sidebar (#0F172A) with white
 * text, active route highlighted in teal, full roadmap nav items (even if
 * the pages don't exist yet — they'll show coming-soon placeholders).
 */

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/session-templates', label: 'Session Templates' },
  { href: '/session-tracker', label: 'Session Tracker' },
  { href: '/staff', label: 'Staff' },
  { href: '/surveys', label: 'Surveys' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/analytics', label: 'Analytics' },
]

export function SidebarNav({ isSuperadmin }: { isSuperadmin: boolean }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-[#0F172A]">
      {/* Brand */}
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="text-xl font-semibold text-white">
          SessionIQ
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-800 p-4 space-y-2">
        {isSuperadmin && (
          <Link
            href="/admin"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-accent)] hover:bg-slate-800"
          >
            Admin Panel
          </Link>
        )}
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-light)]"
        >
          + New Session
        </Link>
      </div>
    </aside>
  )
}
