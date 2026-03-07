'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { updateStaffMember, removeStaffMember } from '@/app/lib/actions/staff'
import type { StaffMember } from './staff-list'

/**
 * Staff detail panel (right side of the master-detail layout).
 *
 * WHY: Matches the v1 design — large header with avatar, name, job title,
 * role badge, and action links ("Edit staff", "Book appointment"). Below that,
 * a tabbed interface with Overview, Contact, Calendar, and Services sections.
 *
 * Overview shows contact info summary + upcoming sessions placeholder.
 * Contact tab has an editable form for updating staff details.
 * Calendar and Services are placeholder tabs for future features.
 */

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: 'bg-blue-100 text-blue-800',
    PRESENTER: 'bg-slate-100 text-slate-800',
    VIEWER: 'bg-slate-100 text-slate-600',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${colors[role] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {role}
    </span>
  )
}

interface StaffDetailProps {
  staff: StaffMember[]
  selectedId: string | undefined
  currentUserId: string
  currentUserEmail: string
  isAdmin: boolean
}

export function StaffDetail({
  staff,
  selectedId,
  currentUserId,
  currentUserEmail,
  isAdmin,
}: StaffDetailProps) {
  const selectedStaff = selectedId ? staff.find((s) => s.id === selectedId) : null

  if (!selectedStaff) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-[var(--color-muted)]">
          Select a staff member from the list to view their profile.
        </p>
      </div>
    )
  }

  const isSelf = selectedStaff.user_id === currentUserId

  return (
    <div className="flex flex-col">
      {/* Header with avatar and name */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-2xl font-medium text-[var(--color-primary)]">
            {getInitials(selectedStaff.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              {selectedStaff.name}
            </h1>
            {selectedStaff.job_title && (
              <p className="mt-1 text-[var(--color-muted)]">
                {selectedStaff.job_title}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <RoleBadge role={selectedStaff.role} />
              {isSelf && (
                <span className="text-xs text-[var(--color-muted)]">(you)</span>
              )}
              {!selectedStaff.user_id && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  Invited (not yet joined)
                </span>
              )}
            </div>
            <div className="mt-4 flex gap-4">
              {isAdmin && (
                <a
                  href={`/staff?selected=${selectedStaff.id}&edit=1`}
                  className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  Edit staff
                </a>
              )}
              <span className="text-sm text-[var(--color-muted)]">
                Book appointment (coming soon)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <StaffDetailTabs
        staff={selectedStaff}
        isAdmin={isAdmin}
        isSelf={isSelf}
        currentUserId={currentUserId}
      />
    </div>
  )
}

// ============================================================
// Tabbed content area
// ============================================================

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'contact', label: 'Contact' },
  { id: 'calendar', label: 'Calendar and Availability' },
  { id: 'services', label: 'Services' },
] as const

function StaffDetailTabs({
  staff,
  isAdmin,
  isSelf,
  currentUserId,
}: {
  staff: StaffMember
  isAdmin: boolean
  isSelf: boolean
  currentUserId: string
}) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('overview')

  return (
    <div className="flex-1">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
        <nav className="-mb-px flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-border)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="bg-[var(--background)] p-6">
        {activeTab === 'overview' && <OverviewTab staff={staff} />}
        {activeTab === 'contact' && (
          <ContactTab staff={staff} isAdmin={isAdmin} isSelf={isSelf} />
        )}
        {activeTab === 'calendar' && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted)]">
            Calendar sync will be available when Integrations are configured.
          </div>
        )}
        {activeTab === 'services' && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted)]">
            Services can be configured when Session Types are set up.
          </div>
        )}

        {/* Danger zone (admin only, not on self) */}
        {isAdmin && !isSelf && (
          <DangerZone staffId={staff.id} staffName={staff.name} />
        )}
      </div>
    </div>
  )
}

// ============================================================
// Overview tab
// ============================================================

function OverviewTab({ staff }: { staff: StaffMember }) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Upcoming appointments
        </h3>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted)]">
          No upcoming sessions
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Contact Information
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-[var(--color-muted)]">Email:</span>
            <span>{staff.email}</span>
          </div>
          {staff.job_title && (
            <div className="flex items-center gap-3">
              <span className="text-[var(--color-muted)]">Job title:</span>
              <span>{staff.job_title}</span>
            </div>
          )}
          {staff.phone && (
            <div className="flex items-center gap-3">
              <span className="text-[var(--color-muted)]">Phone:</span>
              <span>{staff.phone}</span>
            </div>
          )}
          {staff.office_location && (
            <div className="flex items-center gap-3">
              <span className="text-[var(--color-muted)]">Office location:</span>
              <span>{staff.office_location}</span>
            </div>
          )}
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Membership information
        </h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
            Active
          </span>
          <span className="text-sm text-[var(--color-muted)]">
            Last updated: {new Date(staff.updated_at).toLocaleString()}
          </span>
        </div>
      </section>
    </div>
  )
}

// ============================================================
// Contact tab (editable form)
// ============================================================

function ContactTab({
  staff,
  isAdmin,
  isSelf,
}: {
  staff: StaffMember
  isAdmin: boolean
  isSelf: boolean
}) {
  const canEdit = isAdmin || isSelf
  if (!canEdit) {
    return <OverviewTab staff={staff} />
  }
  return <ContactForm staff={staff} isAdmin={isAdmin} />
}

function ContactForm({ staff, isAdmin }: { staff: StaffMember; isAdmin: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    if (isAdmin) {
      // Admin edit — use server action with role sync
      const result = await updateStaffMember({
        staffId: staff.id,
        name: formData.get('name') as string,
        role: formData.get('role') as 'ADMIN' | 'PRESENTER' | 'VIEWER',
        jobTitle: (formData.get('job_title') as string) || '',
        phone: (formData.get('phone') as string) || '',
        officeLocation: (formData.get('office_location') as string) || '',
      })

      if (result.error) {
        setError(result.error)
        setSaving(false)
        return
      }
    } else {
      // Self-edit — use RLS-enforced client update
      const supabase = createClient()
      const { error } = await supabase
        .from('staff')
        .update({
          name: formData.get('name') as string,
          job_title: (formData.get('job_title') as string) || null,
          phone: (formData.get('phone') as string) || null,
          office_location: (formData.get('office_location') as string) || null,
        })
        .eq('id', staff.id)

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }

    setSuccess('Changes saved')
    setTimeout(() => setSuccess(null), 3000)
    router.refresh()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Name</label>
        <input
          name="name"
          type="text"
          defaultValue={staff.name}
          required
          className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Email</label>
        <input
          name="email"
          type="email"
          defaultValue={staff.email}
          readOnly
          className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-gray-50 px-4 py-2 text-sm text-[var(--color-muted)]"
        />
      </div>
      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Role</label>
          <select
            name="role"
            defaultValue={staff.role}
            className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            <option value="ADMIN">Admin</option>
            <option value="PRESENTER">Presenter</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Job title</label>
        <input
          name="job_title"
          type="text"
          defaultValue={staff.job_title ?? ''}
          placeholder="e.g. Head of Customer Enablement"
          className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Phone</label>
        <input
          name="phone"
          type="tel"
          defaultValue={staff.phone ?? ''}
          className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Office location</label>
        <input
          name="office_location"
          type="text"
          defaultValue={staff.office_location ?? ''}
          placeholder="e.g. Munich Headquarters"
          className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}

// ============================================================
// Danger zone
// ============================================================

function DangerZone({ staffId, staffName }: { staffId: string; staffName: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRemove() {
    setRemoving(true)
    const result = await removeStaffMember(staffId)
    if (result.error) {
      setError(result.error)
      setRemoving(false)
      return
    }
    router.push('/staff')
    router.refresh()
  }

  return (
    <div className="mt-8 rounded-lg border border-red-200 bg-red-50/50 p-6">
      <h4 className="text-base font-medium text-red-700">Danger zone</h4>
      <p className="mt-1 text-sm text-red-600">
        Removing {staffName} will revoke their access to this organization.
      </p>
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
        >
          Remove staff member
        </button>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <p className="text-sm font-medium text-red-700">
            Are you sure? This cannot be undone.
          </p>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {removing ? 'Removing...' : 'Yes, remove'}
          </button>
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
