import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserContext } from '@/app/lib/auth'
import { createClient } from '@/app/lib/supabase/server'
import { TemplateList } from '@/app/components/session-templates/template-list'
import { TemplateDetail } from '@/app/components/session-templates/template-detail'
import { AddTemplateModal } from '@/app/components/session-templates/add-template-modal'
import type { SessionTemplate } from '@/app/lib/actions/session-templates'

/**
 * Session Templates page — master-detail layout.
 *
 * WHY: Matches the v1 SessionIQ design:
 * - Top header with title and "+ Add template" button
 * - Left panel: searchable template list
 * - Right panel: selected template detail with tabs (Overview, Settings, Feedback)
 *
 * Uses URL search params for selection and modal state so the page is
 * bookmarkable and works with browser back/forward.
 */
export default async function SessionTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    selected?: string
    tab?: string
    add?: string
  }>
}) {
  const ctx = await getUserContext()
  if (!ctx) redirect('/login')

  const activeOrgId = ctx.activeOrganizationId
  if (!activeOrgId) redirect('/')

  const supabase = await createClient()
  const { data } = await supabase
    .from('session_templates')
    .select('*')
    .eq('organization_id', activeOrgId)
    .order('name')

  const templates = (data ?? []) as SessionTemplate[]
  const params = await searchParams
  const selectedId = params.selected
  const showAddModal = params.add === '1'
  const isAdmin = ctx.activeRole === 'ADMIN' || ctx.isSuperadmin

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Session Templates
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            Manage reusable templates for your different session types.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/session-templates?add=1"
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-light)]"
          >
            <span className="text-lg leading-none">+</span>
            Add template
          </Link>
        )}
      </div>

      {/* Master-detail layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: template list */}
        <div className="w-72 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]">
          <Suspense>
            <TemplateList
              templates={templates}
              selectedId={selectedId}
              isAdmin={isAdmin}
            />
          </Suspense>
        </div>

        {/* Right panel: template detail */}
        <div className="flex-1 overflow-hidden bg-[var(--background)]">
          <Suspense>
            <TemplateDetail
              templates={templates}
              selectedId={selectedId}
              isAdmin={isAdmin}
            />
          </Suspense>
        </div>
      </div>

      {/* Add template modal */}
      {showAddModal && isAdmin && (
        <Suspense>
          <AddTemplateModal organizationId={activeOrgId} />
        </Suspense>
      )}
    </div>
  )
}

