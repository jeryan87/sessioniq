'use server'

import { getUserContext } from '@/app/lib/auth'
import { createAdminClient } from '@/app/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Session Template server actions.
 *
 * WHY: All writes use the admin client after manual authorization checks,
 * matching the staff actions pattern. Reads happen in server components
 * directly via the regular Supabase client (RLS-enforced).
 *
 * Authorization model:
 * - createTemplate / updateTemplate / deleteTemplate: org ADMIN or superadmin only
 */

export type SessionTemplate = {
  id: string
  organization_id: string
  name: string
  description: string | null
  duration_minutes: number
  feedback_window_hours: number
  reminder_minutes_before: number | null
  followup_minutes_after: number | null
  require_self_identification: boolean
  invitation_subject: string | null
  invitation_body: string | null
  reminder_subject: string | null
  reminder_body: string | null
  followup_subject: string | null
  followup_body: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// Helpers
// ============================================================

async function assertOrgAdmin(organizationId: string) {
  const ctx = await getUserContext()
  if (!ctx) return { error: 'Unauthorized' as const }

  const isAdmin =
    ctx.isSuperadmin ||
    ctx.memberships.some(
      (m) => m.organizationId === organizationId && m.role === 'ADMIN'
    )

  if (!isAdmin) return { error: 'Unauthorized: admin access required' as const }

  return { ctx }
}

// ============================================================
// CREATE
// ============================================================

export async function createTemplate(params: {
  organizationId: string
  name: string
  durationMinutes: number
  description?: string
}): Promise<{ data?: SessionTemplate; error?: string }> {
  const auth = await assertOrgAdmin(params.organizationId)
  if ('error' in auth && auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('session_templates')
    .insert({
      organization_id: params.organizationId,
      name: params.name.trim(),
      duration_minutes: params.durationMinutes,
      description: params.description?.trim() || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/session-templates')
  return { data: data as SessionTemplate }
}

// ============================================================
// UPDATE
// ============================================================

export async function updateTemplate(params: {
  templateId: string
  name: string
  description?: string
  durationMinutes: number
  feedbackWindowHours: number
  reminderMinutesBefore: number | null
  followupMinutesAfter: number | null
  requireSelfIdentification: boolean
  invitationSubject?: string
  invitationBody?: string
  reminderSubject?: string
  reminderBody?: string
  followupSubject?: string
  followupBody?: string
}): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()

  // Fetch to get org_id for the auth check
  const { data: template, error: fetchError } = await admin
    .from('session_templates')
    .select('organization_id')
    .eq('id', params.templateId)
    .single()

  if (fetchError || !template) return { error: 'Template not found' }

  const auth = await assertOrgAdmin(template.organization_id)
  if ('error' in auth && auth.error) return { error: auth.error }

  const { error } = await admin
    .from('session_templates')
    .update({
      name: params.name.trim(),
      description: params.description?.trim() || null,
      duration_minutes: params.durationMinutes,
      feedback_window_hours: params.feedbackWindowHours,
      reminder_minutes_before: params.reminderMinutesBefore,
      followup_minutes_after: params.followupMinutesAfter,
      require_self_identification: params.requireSelfIdentification,
      invitation_subject: params.invitationSubject?.trim() || null,
      invitation_body: params.invitationBody?.trim() || null,
      reminder_subject: params.reminderSubject?.trim() || null,
      reminder_body: params.reminderBody?.trim() || null,
      followup_subject: params.followupSubject?.trim() || null,
      followup_body: params.followupBody?.trim() || null,
    })
    .eq('id', params.templateId)

  if (error) return { error: error.message }

  revalidatePath('/session-templates')
  return { success: true }
}

// ============================================================
// DELETE
// ============================================================

export async function deleteTemplate(
  templateId: string
): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()

  const { data: template, error: fetchError } = await admin
    .from('session_templates')
    .select('organization_id')
    .eq('id', templateId)
    .single()

  if (fetchError || !template) return { error: 'Template not found' }

  const auth = await assertOrgAdmin(template.organization_id)
  if ('error' in auth && auth.error) return { error: auth.error }

  const { error } = await admin
    .from('session_templates')
    .delete()
    .eq('id', templateId)

  if (error) return { error: error.message }

  revalidatePath('/session-templates')
  return { success: true }
}
