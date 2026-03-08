import type { SessionTemplate } from '@/app/lib/actions/session-templates'

/**
 * Overview tab for a selected session template.
 *
 * WHY: Matches the v1 design — read-only summary of template details
 * plus an "Upcoming Sessions" placeholder (sessions aren't built yet).
 */

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} minutes`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} hour${h > 1 ? 's' : ''}` : `${h} hr ${m} min`
}

function formatReminder(minutes: number | null) {
  if (minutes === null) return 'Don\'t send'
  if (minutes < 60) return `${minutes} minutes before`
  const h = minutes / 60
  return `${h} hour${h > 1 ? 's' : ''} before`
}

function formatFollowup(minutes: number | null) {
  if (minutes === null) return 'Don\'t send'
  if (minutes === 0) return 'Immediately after'
  if (minutes < 60) return `${minutes} minutes after`
  const h = minutes / 60
  return `${h} hour${h > 1 ? 's' : ''} after`
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
    </div>
  )
}

export function TemplateOverviewTab({ template }: { template: SessionTemplate }) {
  return (
    <div className="space-y-8">
      {/* Upcoming Sessions */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Upcoming Sessions
        </h3>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            No upcoming sessions of this type.
          </p>
        </div>
      </section>

      {/* Template Details */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Template Details
        </h3>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6">
          <DetailRow
            label="Default Duration"
            value={formatDuration(template.duration_minutes)}
          />
          <DetailRow
            label="Feedback Window"
            value={`${template.feedback_window_hours} hour${template.feedback_window_hours !== 1 ? 's' : ''}`}
          />
          <DetailRow
            label="Send Reminder"
            value={formatReminder(template.reminder_minutes_before)}
          />
          <DetailRow
            label="Send Follow-up"
            value={formatFollowup(template.followup_minutes_after)}
          />
          <DetailRow
            label="Self-Identification"
            value={template.require_self_identification ? 'Required' : 'Not required'}
          />
        </div>

        {template.description && (
          <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
            <p className="text-sm text-[var(--color-muted)] whitespace-pre-wrap">
              {template.description}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
