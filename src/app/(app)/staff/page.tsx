import { Suspense } from 'react'
import { getUserContext } from '@/app/lib/auth'
import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffList } from '@/app/components/staff/staff-list'
import { StaffDetail } from '@/app/components/staff/staff-detail'
import { StaffPageHeader } from '@/app/components/staff/staff-page-header'
import { AddStaffModal } from '@/app/components/staff/add-staff-modal'
import { RolePermissionsTable } from '@/app/components/staff/role-permissions-table'

/**
 * Staff management page — master-detail layout.
 *
 * WHY: Matches the v1 SessionIQ design and Microsoft Bookings pattern:
 * - Top header bar with search, role filter, and "+ Add new staff" button
 * - Left panel: staff list (My profile + Other staff)
 * - Right panel: selected staff detail with tabs (Overview, Contact, etc.)
 * - Bottom: role permissions table
 *
 * Uses URL search params for selection/modal state so the page is bookmarkable
 * and works with browser back/forward.
 */
export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{
    selected?: string
    search?: string
    role?: string
    add?: string
    edit?: string
  }>
}) {
  const ctx = await getUserContext()
  if (!ctx) redirect('/login')

  const activeOrgId = ctx.activeOrganizationId
  if (!activeOrgId) redirect('/')

  const supabase = await createClient()

  const { data: staffMembers } = await supabase
    .from('staff')
    .select('id, organization_id, user_id, name, email, role, job_title, phone, office_location, avatar_url, created_at, updated_at')
    .eq('organization_id', activeOrgId)
    .order('name')

  const staff = staffMembers ?? []
  const params = await searchParams
  const selectedId = params.selected
  const showAddModal = params.add === '1'
  const showEditModal = params.edit === '1'
  const isAdmin = ctx.activeRole === 'ADMIN' || ctx.isSuperadmin

  const editingStaff =
    showEditModal && selectedId
      ? staff.find((s) => s.id === selectedId)
      : null

  return (
    <div className="flex h-full flex-col">
      <Suspense>
        <StaffPageHeader isAdmin={isAdmin} />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: staff list */}
          <div className="w-80 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]">
            <StaffList
              staff={staff}
              currentUserEmail={ctx.email}
              selectedId={selectedId}
              search={params.search}
              roleFilter={params.role}
            />
          </div>

          {/* Right panel: staff detail */}
          <div className="flex-1 overflow-auto">
            <StaffDetail
              staff={staff}
              selectedId={selectedId}
              currentUserId={ctx.userId}
              currentUserEmail={ctx.email}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        {/* Bottom: role permissions */}
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <RolePermissionsTable />
        </div>
      </div>

      {/* Add staff modal */}
      {showAddModal && (
        <Suspense>
          <AddStaffModal organizationId={activeOrgId} />
        </Suspense>
      )}

      {/* Edit staff modal */}
      {showEditModal && editingStaff && (
        <Suspense>
          <AddStaffModal
            organizationId={activeOrgId}
            editingStaff={{
              id: editingStaff.id,
              name: editingStaff.name,
              email: editingStaff.email,
              role: editingStaff.role as 'ADMIN' | 'PRESENTER' | 'VIEWER',
              job_title: editingStaff.job_title,
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
