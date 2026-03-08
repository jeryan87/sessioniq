'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import type { SessionTemplate } from '@/app/lib/actions/session-templates'

/**
 * Left panel for the Session Templates master-detail layout.
 *
 * WHY: Matches the v1 design — search at top, template rows showing name
 * and duration. URL-based selection so state is bookmarkable and works
 * with browser back/forward.
 */

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

function TemplateRow({
  template,
  selected,
}: {
  template: SessionTemplate
  selected: boolean
}) {
  return (
    <Link
      href={`/session-templates?selected=${template.id}`}
      className={`block px-4 py-3 transition-colors ${
        selected
          ? 'border-l-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10'
          : 'border-l-2 border-transparent hover:bg-[var(--color-border)]/50'
      }`}
    >
      <div
        className={`font-medium text-sm ${selected ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]'}`}
      >
        {template.name}
      </div>
      <div className="mt-0.5 text-xs text-[var(--color-muted)]">
        {formatDuration(template.duration_minutes)}
      </div>
    </Link>
  )
}

interface TemplateListProps {
  templates: SessionTemplate[]
  selectedId: string | undefined
  isAdmin: boolean
}

export function TemplateList({
  templates,
  selectedId,
  isAdmin,
}: TemplateListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleAddTemplate() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('add', '1')
    router.push(`/session-templates?${params.toString()}`)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Search */}
      <div className="border-b border-[var(--color-border)] p-3">
        <input
          type="search"
          placeholder="Search templates"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto py-1">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[var(--color-muted)]">
            {search ? 'No templates match your search.' : 'No templates yet.'}
            {!search && isAdmin && (
              <button
                onClick={handleAddTemplate}
                className="mt-2 block text-[var(--color-primary)] hover:underline"
              >
                + Add your first template
              </button>
            )}
          </div>
        ) : (
          filtered.map((t) => (
            <TemplateRow key={t.id} template={t} selected={selectedId === t.id} />
          ))
        )}
      </div>
    </div>
  )
}
