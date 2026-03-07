'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { sendInvitation } from '@/app/lib/actions/organizations'
import { updateStaffMember } from '@/app/lib/actions/staff'

/**
 * Modal for adding new staff (sends invitation) or editing existing staff.
 *
 * WHY: From the v1 design — a centered modal overlay for staff creation/editing.
 * For new staff, this creates an invitation (since users enter the system
 * through invitations only). For editing, it updates the staff record.
 *
 * Uses the native <dialog> element with showModal() which renders in the
 * browser's top layer, escaping all stacking contexts and overflow containers.
 */

type StaffRole = 'ADMIN' | 'PRESENTER' | 'VIEWER'

interface AddStaffModalProps {
  organizationId: string
  editingStaff?: {
    id: string
    name: string
    email: string
    role: StaffRole
    job_title: string | null
  } | null
}

export function AddStaffModal({
  organizationId,
  editingStaff,
}: AddStaffModalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = !!editingStaff
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [name, setName] = useState(editingStaff?.name ?? '')
  const [email, setEmail] = useState(editingStaff?.email ?? '')
  const [role, setRole] = useState<StaffRole>(editingStaff?.role ?? 'VIEWER')
  const [jobTitle, setJobTitle] = useState(editingStaff?.job_title ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('add')
    params.delete('edit')
    router.push(`/staff?${params.toString()}`)
  }, [router, searchParams])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      close()
    }
  }

  // Close on Escape (native dialog behavior, but also update URL)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    function handleCancel(e: Event) {
      e.preventDefault()
      close()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [close])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (isEditing) {
      const result = await updateStaffMember({
        staffId: editingStaff!.id,
        name,
        role,
        jobTitle,
        phone: '',
        officeLocation: '',
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      close()
      router.refresh()
    } else {
      const result = await sendInvitation({
        organizationId,
        email,
        role,
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setSuccess('Invitation sent!')
      setInviteUrl(result.inviteUrl ?? null)
      setLoading(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop:bg-black/50"
      style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', margin: 0 }}
    >
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {isEditing ? 'Edit staff' : 'Add new staff'}
          </h2>
          <button
            onClick={close}
            className="text-2xl text-[var(--color-muted)] hover:text-[var(--foreground)]"
          >
            &times;
          </button>
        </div>

        {success && inviteUrl && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <p className="font-medium">{success}</p>
            <p className="mt-1 text-xs">Share this link with the invited user:</p>
            <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-xs">
              {inviteUrl}
            </code>
            <button
              type="button"
              onClick={close}
              className="mt-3 rounded-lg border border-green-300 bg-white px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
            >
              Done
            </button>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isEditing}
                className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:bg-gray-50 disabled:text-[var(--color-muted)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              >
                <option value="ADMIN">Admin</option>
                <option value="PRESENTER">Presenter</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Job title (optional)
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Head of Customer Enablement"
                  className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-border)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50"
              >
                {loading
                  ? 'Saving...'
                  : isEditing
                    ? 'Save changes'
                    : 'Send invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
