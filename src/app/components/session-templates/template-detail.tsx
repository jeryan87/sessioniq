'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { TemplateOverviewTab } from './template-overview-tab'
import { TemplateSettingsForm } from './template-settings-form'
import { TemplateFeedbackTab } from './template-feedback-tab'
import type { SessionTemplate } from '@/app/lib/actions/session-templates'

/**
 * Right panel for the Session Templates master-detail layout.
 *
 * WHY: Matches the v1 design — template header (name, duration, "+ Book session"
 * stub), then tabs for Overview / Settings / Feedback. Active tab is driven by
 * the ?tab= search param so state persists across navigation.
 */

type Tab = 'overview' | 'settings' | 'feedback'

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

interface TemplateDetailProps {
  templates: SessionTemplate[]
  selectedId: string | undefined
  isAdmin: boolean
}

export function TemplateDetail({
  templates,
  selectedId,
  isAdmin,
}: TemplateDetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get('tab') as Tab | null) ?? 'overview'

  const template = selectedId
    ? templates.find((t) => t.id === selectedId)
    : null

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`/session-templates?${params.toString()}`)
  }

  if (!template) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">
          Select a template to view details.
        </p>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'settings', label: 'Settings' },
    { key: 'feedback', label: 'Feedback' },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {template.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {formatDuration(template.duration_minutes)}
          </p>
        </div>
        <button
          disabled
          title="Session booking coming soon"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] cursor-not-allowed opacity-60"
        >
          + Book session
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--color-border)] px-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <TemplateOverviewTab template={template} />
        )}
        {activeTab === 'settings' && (
          <TemplateSettingsForm template={template} isAdmin={isAdmin} />
        )}
        {activeTab === 'feedback' && <TemplateFeedbackTab />}
      </div>
    </div>
  )
}
