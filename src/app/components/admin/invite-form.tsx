'use client'

import { useState } from 'react'
import { sendInvitation } from '@/app/lib/actions/organizations'

/**
 * Form for superadmins to send invitations.
 *
 * WHY: Invitations are the only way new users enter the system. The form
 * lets superadmins pick an org, enter an email, and choose a role. On
 * success, it displays the invite URL for manual sharing. In production
 * this would also trigger an email.
 */
export function InviteForm({
  organizations,
}: {
  organizations: Array<{ id: string; name: string }>
}) {
  const [organizationId, setOrganizationId] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'PRESENTER' | 'VIEWER'>('ADMIN')
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInviteUrl(null)
    setCopied(false)
    setLoading(true)

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

    setInviteUrl(result.inviteUrl ?? null)
    setEmail('')
    setLoading(false)
  }

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="text-lg font-medium text-[var(--foreground)]">
        Send Invitation
      </h3>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {inviteUrl && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <p className="font-medium">Invitation created!</p>
            <p className="mt-1 text-xs">Share this link with the invited user:</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-2 py-1 text-xs text-[var(--foreground)] break-all">
                {inviteUrl}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-md border border-green-300 bg-white px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="invite-org"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Organization
            </label>
            <select
              id="invite-org"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-[var(--foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              <option value="">Select org...</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="invite-email"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="user@company.com"
            />
          </div>

          <div>
            <label
              htmlFor="invite-role"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'PRESENTER' | 'VIEWER')}
              className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-[var(--foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              <option value="ADMIN">Admin</option>
              <option value="PRESENTER">Presenter</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>
    </div>
  )
}
