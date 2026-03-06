'use client'

import { useState } from 'react'
import { createOrganization } from '@/app/lib/actions/organizations'

/**
 * Form for superadmins to create a new organization.
 *
 * WHY: Organizations are the top-level tenant unit. Superadmins create them
 * before inviting customer admins. The slug is auto-generated from the name
 * but can be manually edited.
 */
export function CreateOrgForm() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function generateSlug(orgName: string) {
    return orgName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  function handleNameChange(value: string) {
    setName(value)
    setSlug(generateSlug(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const result = await createOrganization({ name, slug })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(`Organization "${result.organization?.name}" created successfully`)
    setName('')
    setSlug('')
    setLoading(false)
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="text-lg font-medium text-[var(--foreground)]">
        Create Organization
      </h3>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="org-name"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Organization Name
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="Acme Corporation"
            />
          </div>
          <div>
            <label
              htmlFor="org-slug"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Slug
            </label>
            <input
              id="org-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="acme-corporation"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Organization'}
        </button>
      </form>
    </div>
  )
}
