'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

/**
 * Staff page top header with search, role filter, and "Add new staff" button.
 *
 * WHY: Matches the v1 design — a horizontal bar above the list-detail layout
 * with filtering controls. Uses URL search params so filters persist across
 * navigation and are shareable.
 */

export function StaffPageHeader({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') ?? 'all')

  function updateFilters() {
    const params = new URLSearchParams(searchParams.toString())
    if (search) params.set('search', search)
    else params.delete('search')
    if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter)
    else params.delete('role')
    router.push(`/staff?${params.toString()}`)
  }

  function handleAddStaff() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('add', '1')
    router.push(`/staff?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
      <div className="flex items-center gap-4">
        {isAdmin && (
          <button
            onClick={handleAddStaff}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-light)]"
          >
            <span className="text-lg leading-none">+</span>
            Add new staff
          </button>
        )}
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search Staff"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters()}
            className="w-48 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          <button
            onClick={updateFilters}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-border)]"
          >
            Search
          </button>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              const params = new URLSearchParams(searchParams.toString())
              if (e.target.value && e.target.value !== 'all') params.set('role', e.target.value)
              else params.delete('role')
              router.push(`/staff?${params.toString()}`)
            }}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            <option value="all">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="PRESENTER">Presenter</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>
      </div>
    </div>
  )
}
