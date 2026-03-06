'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import {
  acceptInvitation,
  acceptInvitationAsExistingUser,
} from '@/app/lib/actions/invitations'

/**
 * Invitation acceptance page.
 *
 * WHY: This is the landing page for invitation links. It handles four states:
 *
 *   1. No token in URL           -> error message
 *   2. Invalid/expired/accepted  -> appropriate error
 *   3. Valid token, not logged in -> "Create your account" form
 *   4. Valid token, logged in     -> "Join [Org Name]" button
 *
 * The page is wrapped in Suspense because useSearchParams() requires it
 * in Next.js 15+ when the page is statically generated.
 */

interface InvitationData {
  id: string
  organization_id: string
  organization_name: string
  email: string
  role: string
  expires_at: string
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
          <p className="text-[var(--color-muted)]">Loading...</p>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  )
}

function InviteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state (for new users)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function validate() {
      if (!token) {
        setValidationError('No invitation token provided')
        setLoading(false)
        return
      }

      // Check if user is already logged in
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)

      // Validate the token via the security-definer RPC function
      const { data, error } = await supabase.rpc('validate_invitation', {
        invite_token: token,
      })

      if (error) {
        setValidationError('Failed to validate invitation')
        setLoading(false)
        return
      }

      const result = data as Record<string, unknown>
      if (!result.valid) {
        setValidationError(result.error as string)
        setLoading(false)
        return
      }

      setInvitation({
        id: result.id as string,
        organization_id: result.organization_id as string,
        organization_name: result.organization_name as string,
        email: result.email as string,
        role: result.role as string,
        expires_at: result.expires_at as string,
      })
      setLoading(false)
    }

    validate()
  }, [token])

  // Handler for new user signup
  async function handleNewUserSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !invitation) return

    setSubmitError(null)
    setSubmitting(true)

    const result = await acceptInvitation({
      token,
      password,
      name,
    })

    if (result.error) {
      setSubmitError(result.error)
      setSubmitting(false)
      return
    }

    // Log the new user in
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    })

    if (signInError) {
      setSubmitError(
        'Account created but sign-in failed. Please go to the login page.'
      )
      setSubmitting(false)
      return
    }

    // Redirect to app
    window.location.href = '/'
  }

  // Handler for existing user joining
  async function handleExistingUserJoin() {
    if (!token) return

    setSubmitError(null)
    setSubmitting(true)

    const result = await acceptInvitationAsExistingUser(token)

    if (result.error) {
      setSubmitError(result.error)
      setSubmitting(false)
      return
    }

    window.location.href = '/'
  }

  // --- RENDER ---

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--color-muted)]">Validating invitation...</p>
      </div>
    )
  }

  if (validationError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Invalid Invitation
          </h1>
          <p className="mt-4 text-[var(--color-muted)]">{validationError}</p>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Contact your administrator for a new invitation.
          </p>
        </div>
      </div>
    )
  }

  if (!invitation) return null

  // State 4: Existing user joining an org
  if (isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Join {invitation.organization_name}
          </h1>
          <p className="mt-4 text-[var(--color-muted)]">
            You&apos;ve been invited to join{' '}
            <strong>{invitation.organization_name}</strong> as a{' '}
            <strong>{invitation.role}</strong>.
          </p>

          {submitError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <button
            onClick={handleExistingUserJoin}
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
          >
            {submitting ? 'Joining...' : 'Accept & Join'}
          </button>
        </div>
      </div>
    )
  }

  // State 3: New user creating an account
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Create Your Account
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            You&apos;ve been invited to join{' '}
            <strong>{invitation.organization_name}</strong> as a{' '}
            <strong>{invitation.role}</strong>.
          </p>
        </div>

        <form onSubmit={handleNewUserSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={invitation.email}
              readOnly
              className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-gray-50 px-4 py-2.5 text-[var(--color-muted)]"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Create Account & Join'}
          </button>
        </form>
      </div>
    </div>
  )
}
