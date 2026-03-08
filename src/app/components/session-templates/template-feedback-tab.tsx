/**
 * Feedback tab placeholder for session templates.
 *
 * WHY: The Surveys feature isn't built yet. This tab shows where the linked
 * feedback form will appear once surveys are connected.
 */
export function TemplateFeedbackTab() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-border)]">
        <svg
          className="h-6 w-6 text-[var(--color-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-[var(--foreground)]">
        No feedback form linked
      </p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Surveys are coming soon. Once built, you can link a feedback form to this
        template from the Settings tab.
      </p>
    </div>
  )
}
