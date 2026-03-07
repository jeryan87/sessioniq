'use client'

import Link from 'next/link'

/**
 * Staff list panel (left side of the master-detail layout).
 *
 * WHY: Matches the v1 design — URL-based selection via query params,
 * "My profile" section at top, "Other staff" below, initials avatars,
 * and role badges. Selection uses Link navigation so it works with
 * browser back/forward and is bookmarkable.
 */

export interface StaffMember {
  id: string
  organization_id: string
  user_id: string | null
  name: string
  email: string
  role: string
  job_title: string | null
  phone: string | null
  office_location: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface StaffListProps {
  staff: StaffMember[]
  currentUserEmail: string
  selectedId: string | undefined
  search?: string | null
  roleFilter?: string | null
}

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
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[role] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {role}
    </span>
  )
}

function StaffRow({
  staff,
  selected,
  isMyProfile,
}: {
  staff: StaffMember
  selected: boolean
  isMyProfile: boolean
}) {
  return (
    <Link
      href={`/staff?selected=${staff.id}`}
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
        selected ? 'bg-[var(--color-primary)]/10' : 'hover:bg-[var(--color-border)]/50'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-sm font-medium text-[var(--color-primary)]">
        {getInitials(staff.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-[var(--foreground)]">
            {staff.name}
          </span>
          {isMyProfile && (
            <span className="shrink-0 text-xs text-[var(--color-muted)]">
              (you)
            </span>
          )}
        </div>
        <div className="truncate text-sm text-[var(--color-muted)]">
          {staff.email}
        </div>
      </div>
      <RoleBadge role={staff.role} />
    </Link>
  )
}

export function StaffList({
  staff,
  currentUserEmail,
  selectedId,
  search = '',
  roleFilter = 'all',
}: StaffListProps) {
  const searchLower = (search ?? '').toLowerCase()
  const filtered = staff.filter((s) => {
    const matchesSearch =
      !searchLower ||
      s.name.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower)
    const matchesRole = !roleFilter || roleFilter === 'all' || s.role === roleFilter
    return matchesSearch && matchesRole
  })

  const myProfile = currentUserEmail
    ? filtered.find((s) => s.email.toLowerCase() === currentUserEmail.toLowerCase())
    : null
  const otherStaff = filtered.filter((s) => s.id !== myProfile?.id)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Staff</h2>
        <p className="text-xs text-[var(--color-muted)]">
          Manage internal team members and their roles.
        </p>
      </div>
      <div className="flex-1 overflow-auto">
        {myProfile && (
          <div className="py-2">
            <div className="px-4 py-1 text-xs font-medium text-[var(--color-muted)]">
              My profile
            </div>
            <StaffRow
              staff={myProfile}
              selected={selectedId === myProfile.id}
              isMyProfile
            />
          </div>
        )}
        <div className="py-2">
          <div className="px-4 py-1 text-xs font-medium text-[var(--color-muted)]">
            Other staff
          </div>
          {otherStaff.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[var(--color-muted)]">
              No other staff members yet.
            </div>
          ) : (
            otherStaff.map((s) => (
              <StaffRow
                key={s.id}
                staff={s}
                selected={selectedId === s.id}
                isMyProfile={false}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
