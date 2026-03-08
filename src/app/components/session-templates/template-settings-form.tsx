'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTemplate, deleteTemplate } from '@/app/lib/actions/session-templates'
import type { SessionTemplate } from '@/app/lib/actions/session-templates'

/**
 * Settings tab for a session template — live editable form.
 *
 * WHY: Matches the v1 design — name, duration, scheduling dropdowns,
 * self-ID checkbox, and email template editors with token chips.
 * All changes are persisted to Supabase via server actions.
 */

const REMINDER_OPTIONS = [
  { label: "Don't send", value: '' },
  { label: '5 minutes before', value: '5' },
  { label: '10 minutes before', value: '10' },
  { label: '30 minutes before', value: '30' },
  { label: '1 hour before', value: '60' },
  { label: '24 hours before', value: '1440' },
]

const FOLLOWUP_OPTIONS = [
  { label: "Don't send", value: '' },
  { label: 'Immediately after', value: '0' },
  { label: '10 minutes after', value: '10' },
  { label: '30 minutes after', value: '30' },
  { label: '1 hour after', value: '60' },
  { label: '24 hours after', value: '1440' },
]

const EMAIL_TOKENS = [
  '{session_title}',
  '{session_date}',
  '{presenter_name}',
  '{feedback_link}',
  '{account_name}',
  '{session_type}',
]

function TokenChip({
  token,
  onInsert,
}: {
  token: string
  onInsert: (token: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onInsert(token)}
      className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
    >
      {token}
    </button>
  )
}

function EmailTemplateEditor({
  label,
  subjectValue,
  bodyValue,
  onSubjectChange,
  onBodyChange,
}: {
  label: string
  subjectValue: string
  bodyValue: string
  onSubjectChange: (v: string) => void
  onBodyChange: (v: string) => void
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  function insertToken(token: string) {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = bodyValue.slice(0, start) + token + bodyValue.slice(end)
    onBodyChange(next)
    // Restore cursor after token
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-[var(--foreground)]">{label}</h4>

      {/* Token chips */}
      <div className="flex flex-wrap gap-1.5">
        {EMAIL_TOKENS.map((t) => (
          <TokenChip key={t} token={t} onInsert={insertToken} />
        ))}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
          Subject
        </label>
        <input
          type="text"
          value={subjectValue}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder={`${label} subject line`}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
          Body
        </label>
        <textarea
          ref={bodyRef}
          value={bodyValue}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={`Write your ${label.toLowerCase()} email here...`}
          rows={5}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-y"
        />
      </div>
    </div>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

export function TemplateSettingsForm({
  template,
  isAdmin,
}: {
  template: SessionTemplate
  isAdmin: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Form state
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description ?? '')
  const [durationMinutes, setDurationMinutes] = useState(
    String(template.duration_minutes)
  )
  const [feedbackWindowHours, setFeedbackWindowHours] = useState(
    String(template.feedback_window_hours)
  )
  const [reminderMinutes, setReminderMinutes] = useState(
    template.reminder_minutes_before !== null
      ? String(template.reminder_minutes_before)
      : ''
  )
  const [followupMinutes, setFollowupMinutes] = useState(
    template.followup_minutes_after !== null
      ? String(template.followup_minutes_after)
      : ''
  )
  const [requireSelfId, setRequireSelfId] = useState(
    template.require_self_identification
  )

  // Email templates
  const [invSubject, setInvSubject] = useState(template.invitation_subject ?? '')
  const [invBody, setInvBody] = useState(template.invitation_body ?? '')
  const [remSubject, setRemSubject] = useState(template.reminder_subject ?? '')
  const [remBody, setRemBody] = useState(template.reminder_body ?? '')
  const [fupSubject, setFupSubject] = useState(template.followup_subject ?? '')
  const [fupBody, setFupBody] = useState(template.followup_body ?? '')

  function handleDiscard() {
    setName(template.name)
    setDescription(template.description ?? '')
    setDurationMinutes(String(template.duration_minutes))
    setFeedbackWindowHours(String(template.feedback_window_hours))
    setReminderMinutes(
      template.reminder_minutes_before !== null
        ? String(template.reminder_minutes_before)
        : ''
    )
    setFollowupMinutes(
      template.followup_minutes_after !== null
        ? String(template.followup_minutes_after)
        : ''
    )
    setRequireSelfId(template.require_self_identification)
    setInvSubject(template.invitation_subject ?? '')
    setInvBody(template.invitation_body ?? '')
    setRemSubject(template.reminder_subject ?? '')
    setRemBody(template.reminder_body ?? '')
    setFupSubject(template.followup_subject ?? '')
    setFupBody(template.followup_body ?? '')
    setError(null)
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    setSaved(false)

    const dur = parseInt(durationMinutes, 10)
    const fbw = parseInt(feedbackWindowHours, 10)

    if (!name.trim()) return setError('Name is required.')
    if (isNaN(dur) || dur <= 0) return setError('Duration must be a positive number.')
    if (isNaN(fbw) || fbw < 0) return setError('Feedback window must be 0 or more.')

    startTransition(async () => {
      const result = await updateTemplate({
        templateId: template.id,
        name,
        description,
        durationMinutes: dur,
        feedbackWindowHours: fbw,
        reminderMinutesBefore:
          reminderMinutes !== '' ? parseInt(reminderMinutes, 10) : null,
        followupMinutesAfter:
          followupMinutes !== '' ? parseInt(followupMinutes, 10) : null,
        requireSelfIdentification: requireSelfId,
        invitationSubject: invSubject,
        invitationBody: invBody,
        reminderSubject: remSubject,
        reminderBody: remBody,
        followupSubject: fupSubject,
        followupBody: fupBody,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${template.name}"? This cannot be undone.`
      )
    )
      return

    startDeleteTransition(async () => {
      const result = await deleteTemplate(template.id)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/session-templates')
        router.refresh()
      }
    })
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          Only admins can edit session templates.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Basic Settings */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Basic Settings
        </h3>
        <div className="space-y-4">
          <FormField label="Name *">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Executive Briefing"
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </FormField>

          <FormField label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this session type..."
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duration (min)">
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </FormField>
            <FormField label="Feedback window (hrs)">
              <input
                type="number"
                min={0}
                value={feedbackWindowHours}
                onChange={(e) => setFeedbackWindowHours(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </FormField>
          </div>
        </div>
      </section>

      {/* Scheduling */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Scheduling
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Send reminder">
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              {REMINDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Send follow-up">
            <select
              value={followupMinutes}
              onChange={(e) => setFollowupMinutes(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              {FOLLOWUP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      {/* Feedback */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Feedback
        </h3>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <p className="mb-3 text-xs text-[var(--color-muted)]">
            Feedback forms are managed in Surveys. Once surveys are built, you'll be
            able to link one here.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requireSelfId}
              onChange={(e) => setRequireSelfId(e.target.checked)}
              className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--foreground)]">
              Require self-identification on feedback form
            </span>
          </label>
        </div>
      </section>

      {/* Email Templates */}
      <section>
        <h3 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
          Email Templates
        </h3>
        <p className="mb-4 text-xs text-[var(--color-muted)]">
          Templates are saved here and will be used when email dispatch is enabled.
          Click a token to insert it at your cursor.
        </p>

        <div className="space-y-8">
          <EmailTemplateEditor
            label="Invitation"
            subjectValue={invSubject}
            bodyValue={invBody}
            onSubjectChange={setInvSubject}
            onBodyChange={setInvBody}
          />
          <div className="border-t border-[var(--color-border)]" />
          <EmailTemplateEditor
            label="Reminder"
            subjectValue={remSubject}
            bodyValue={remBody}
            onSubjectChange={setRemSubject}
            onBodyChange={setRemBody}
          />
          <div className="border-t border-[var(--color-border)]" />
          <EmailTemplateEditor
            label="Follow-up"
            subjectValue={fupSubject}
            bodyValue={fupBody}
            onSubjectChange={setFupSubject}
            onBodyChange={setFupBody}
          />
        </div>
      </section>

      {/* Error / success feedback */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Settings saved.
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete template'}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isPending}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-border)] disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
