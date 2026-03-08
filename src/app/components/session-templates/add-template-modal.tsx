'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createTemplate } from '@/app/lib/actions/session-templates'

/**
 * Modal for creating a new session template.
 *
 * WHY: A focused creation form — just name and duration to get started.
 * All other settings (email templates, scheduling, etc.) are edited in
 * the Settings tab of the template detail view after creation.
 *
 * Uses the native <dialog> element matching the AddStaffModal pattern.
 */

interface AddTemplateModalProps {
  organizationId: string
}

export function AddTemplateModal({ organizationId }: AddTemplateModalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [name, setName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('add')
    router.push(`/session-templates?${params.toString()}`)
  }, [router, searchParams])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) close()
  }

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

    const dur = parseInt(durationMinutes, 10)
    if (!name.trim()) return setError('Name is required.')
    if (isNaN(dur) || dur <= 0) return setError('Duration must be a positive number.')

    setLoading(true)
    const result = await createTemplate({
      organizationId,
      name,
      durationMinutes: dur,
      description,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Navigate to the newly created template
    const params = new URLSearchParams()
    if (result.data) params.set('selected', result.data.id)
    params.set('tab', 'settings')
    router.push(`/session-templates?${params.toString()}`)
    router.refresh()
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop:bg-black/50"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        margin: 0,
      }}
    >
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Add template
          </h2>
          <button
            onClick={close}
            className="text-2xl text-[var(--color-muted)] hover:text-[var(--foreground)]"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Template name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Executive Briefing"
              required
              autoFocus
              className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Default duration (minutes) *
            </label>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe this session type..."
              rows={2}
              className="mt-1 block w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>

          <p className="text-xs text-[var(--color-muted)]">
            You can configure scheduling, feedback settings, and email templates
            after creating the template.
          </p>

          <div className="flex justify-end gap-2 pt-2">
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
              {loading ? 'Creating...' : 'Create template'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
