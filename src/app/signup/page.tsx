'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/app/lib/supabase/client'

/**
 * Sign up page - Email + Password registration.
 *
 * WHY: signUp() creates a new user in Supabase. By default, Supabase requires
 * email confirmation—it sends a magic link. The user clicks it, lands on
 * /auth/callback, and we exchange the token for a session. You can disable
 * email confirmation in Supabase Dashboard > Auth > Providers > Email.
 */
export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Check your email
          </h1>
          <p className="mt-4 text-[var(--color-muted)]">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Click the link to activate your account.
          </p>
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            <Link
              href="/login"
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Get started with SessionIQ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="you@company.com"
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
              minLength={6}
              autoComplete="new-password"
              className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
